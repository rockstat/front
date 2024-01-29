import { Service, Inject, Container } from 'typedi';
import * as BBPromise from 'bluebird';
import * as net from 'net';
import {
  AppServer
} from '@app/AppServer';
import {
  BusMsgHdr,
  FrontierConfig,
  IncomingMessage,
  BaseIncomingMessage,
  MsgBusConfig,
} from '@app/types';
import {
  TreeBus,
  TreeNameBus
} from '@app/bus';
import {
  IN_GENERIC,
  SERVICE_DIRECTOR,
  SERVICE_FRONTIER,
  BROADCAST,
  ENRICH,
  RPC_IAMALIVE,
} from '@app/constants';
import {
  epglue
} from '@app/helpers';
import {
  AppConfig,
  TheIds,
  Logger,
  AppStatus,
  RedisFactory,
  Meter,
  RPCAdapterRedis,
  RPCAgnostic,
  AgnosticRPCOptions,
  MethodRegRequest,
  EnrichersRequirements,
  METHOD_STATUS,
  STATUS_INT_ERROR,
  STATUS_OK,
  BandResponse,
  UnknownResponse,
  response,
  MethodRegistrationOptions,
} from '@rockstat/rock-me-ts';
import * as EnrichersRepo from '@app/enrichers';
import * as HandlersRepo from '@app/handlers';
import {
  dotPropGetter,
  getvals
} from '@app/helpers/getprop';

type HandlerRepo = typeof HandlersRepo
type EnricherRepo = typeof EnrichersRepo
type HandlersNames = keyof HandlerRepo;
type EnrichersNames = keyof EnricherRepo;

const HANDLER = 'handler';
const ENRICHER = 'enricher';
const LISTENER = 'listener';


@Service()
export class Dispatcher {

  log: Logger;
  enrichBus: TreeBus = new TreeBus('enrichers');
  remoteEnrichers: TreeNameBus = new TreeNameBus()
  listenBus: TreeBus = new TreeBus('listeners');
  handleBus: TreeBus = new TreeBus('handlers');
  appConfig: AppConfig<FrontierConfig>;
  idGen: TheIds;
  status: AppStatus;
  registrationsHash: string = '';
  rpc: RPCAgnostic;
  rpcHandlers: { [k: string]: [string, string, MethodRegistrationOptions] } = {};
  rpcEnrichers: { [k: string]: Array<string> } = {};
  propGetters: { [k: string]: (obj: any) => { [k: string]: any } } = {};
  enrichersRequirements: EnrichersRequirements = [];


  constructor() {
    this.log = Container.get(Logger).for(this);
    this.status = new AppStatus();
    this.log.info('Starting');
    this.appConfig = Container.get<AppConfig<FrontierConfig>>(AppConfig);
    this.idGen = Container.get(TheIds);
  }

  /**
   * Initial asynchronous setup
   */
  setup() {
    this.handleBus.subscribe('*', this.defaultHandler);

    // Core deps
    const redisFactory = Container.get(RedisFactory);
    // Stat meter
    const meter = Container.get(Meter);

    // Setup RPC
    const channels = [this.appConfig.rpc.name];
    const rpcOptions: AgnosticRPCOptions = { channels, redisFactory, log: this.log, meter, ...this.appConfig.rpc }
    const rpcAdaptor = new RPCAdapterRedis(rpcOptions);

    this.rpc = new RPCAgnostic(rpcOptions);
    this.rpc.setup(rpcAdaptor);

    // status notification for band director
    setInterval(() => {
      this.rpc.notify(SERVICE_DIRECTOR, RPC_IAMALIVE, { name: SERVICE_FRONTIER })
    }, 5 * 1000)
    // Registering status handler / payload receiver
    this.rpc.register<MethodRegRequest>(METHOD_STATUS, async (data) => {
      if (data.register && data.state_hash) {
        if (data.state_hash == this.registrationsHash) {
          // Skip handling. Nothing changed
          return;
        }
        const handlerRoutingKeys: string[] = [];
        const enrichersRequirements: EnrichersRequirements = [];
        for (const row of data.register) {
          const { service, method, options } = row;
          const route = { service, method };
          if (options && options.alias) {
            route.service = options.alias;
          }
          const routingPath = [IN_GENERIC, route.service].concat([route.method].filter(e => e !== '*'))
          const routingKey = routingPath.join('.');
          if (row.role === HANDLER) {
            this.rpcHandlers[routingKey] = [service, method, options];
            handlerRoutingKeys.push(routingKey);
          }
          if (row.role === ENRICHER && options && Array.isArray(options.keys)) {
            this.propGetters[route.service] = dotPropGetter(options.props || {});
            // Handling enrichments data selection
            if (options.props) {
              for (const [k, v] of Object.entries(options.props)) {
                enrichersRequirements.push([k, v]);
              }
            }
            this.remoteEnrichers.subscribe(options.keys, route.service)
          }
        }
        this.registrationsHash = data.state_hash;
        // TODO: split by services (when enrichers will be splitted)
        this.enrichersRequirements = enrichersRequirements;
        // Registering/unregistering remote handlers
        this.handleBus.replace(handlerRoutingKeys, this.handlersGateway)
      }
      return this.status.get({});
    });

    this.rpc.register<{}>('handlers', async () => {
      return this.rpcHandlers;
    })


    this.rpc.register<{}>('enrichers', async () => {
      return this.rpcEnrichers;
    })

    // Attaching internal enrichers
    const enrichersConfig: {
      [k in EnrichersNames]?: MsgBusConfig['enrichers'][k]
    } = this.appConfig.get('bus').enrichers;

    Object.entries(enrichersConfig)
      .filter(([name, chans]) => chans && (name in EnrichersRepo))
      .forEach(([name, chans]: [EnrichersNames, Array<string>]) => {
        const enricher = new EnrichersRepo[name]();
        chans.forEach(chan => this.enrichBus.subscribe(chan, enricher.handle));
      })

    // Registering remote enrichers notification
    this.enrichBus.subscribe('*', this.enrichersGateway);


    // Attaching internal handlers
    const handlersConfig: {
      [k in HandlersNames]?: MsgBusConfig['handlers'][k]
    } = this.appConfig.get('bus').handlers;

    Object.entries(handlersConfig)
      .filter(([name, chan]) => chan && (name in HandlersRepo))
      .forEach(([name, chan]: [HandlersNames, string]) => {
        this.handleBus.subscribe(chan, HandlersRepo[name]());
      })

    // Remote listeners gateway
    this.listenBus.subscribe('*', this.listenersGateway);

  }

  start() {
    this.log.info('Started');
  }


  listenersGateway = async (key: string, msg: IncomingMessage) => {
    try {
      return await this.rpc.notify(BROADCAST, BROADCAST, msg);
    } catch (error) {
      this.log.error(`catch! ${error.message}`);
    }
  }

  enrichersGateway = async (key: string, msg: IncomingMessage) => {
    try {
      const smallMsg = getvals(msg, this.enrichersRequirements);
      return await this.rpc.request(ENRICH, ENRICH, smallMsg, { services: this.remoteEnrichers.simulate(key) });
    } catch (error) {
      this.log.error(`catch! ${error.message}`);
    }
  }


  /**
   * Using to handle event remotely
   */
  handlersGateway = async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
    if (msg.service && msg.name && this.rpcHandlers[key]) {
      // Real destination
      const [service, method, options] = this.rpcHandlers[key];
      try {
        const data: UnknownResponse = await this.rpc.request<any>(service, method, msg, { timeout: options.timeout });
        // todo: check via isBandResponse
        if (data && typeof data === "object" && !Array.isArray(data)) {
          if ('type__' in data) {
            // todo: needed type with optional headers and statusCode
            data.headers = data.headers || [];
            data.statusCode = data.statusCode || STATUS_OK;
            return data;
          }
        }
        return response.data({ data });
      } catch (error) {
        this.log.warn(error, {error, key, msg});
        return response.error({ statusCode: STATUS_INT_ERROR, errorMessage: error.message })
      }
    }
    return this.defaultHandler(key, msg);
  }

  defaultHandler: BusMsgHdr = async (key, msg): Promise<BandResponse> => {
    return Promise.resolve().then(() =>
      response.data({
        data: {
          key: key,
          id: msg.id
        }
      })
    )
  }

  registerListener(key: string, func: BusMsgHdr): void {
    this.log.info(`Registering subscriber for ${key}`);
    this.listenBus.subscribe(key, func);
  }

  async dispatch(key: string, msg: BaseIncomingMessage): Promise<BandResponse> {

    msg.id = this.idGen.flake();
    msg.time = Number(new Date());

    this.log.debug(` ---> ${key} [${msg.id}]`);

    if (msg.key === 'in.gen.track.registration_success') {
      this.log.info('__registration_success__', msg)
    }

    // ### Phase 1: enriching
    const enrichers = this.enrichBus.publish(key, msg);
    const enrichments = await BBPromise.all(enrichers);
    if (enrichments.length && msg.data) {
      Object.assign(msg.data, ...enrichments);
    }
    
    // ### Phase 2: handling if configuring
    const handler = this.handleBus.handler(key, msg);
    this.log.debug(` <--- ${key}`, msg);
    const handled = await handler;  
    
    // ### Phase 3: send to listeners
    // Scheduling using Promise to avoid waiting
    BBPromise.all(this.listenBus.publish(key, msg))
      .then(() => this.log.debug('Listeners handled'))
      .catch(error => this.log.error(error))

    return handled;

  }
}
