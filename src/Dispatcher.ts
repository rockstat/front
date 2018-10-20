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
  HTTPServiceMapParams,
  BusBaseEnricher,
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
  isBandResponse,
  response,
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
  servicesMap: HTTPServiceMapParams
  rpc: RPCAgnostic;
  rpcHandlers: { [k: string]: [string, string] } = {};
  rpcEnrichers: { [k: string]: Array<string> } = {};
  propGetters: { [k: string]: (obj: any) => { [k: string]: any } } = {};
  enrichersRequirements: EnrichersRequirements = [];


  constructor() {
    this.log = Container.get(Logger).for(this);
    this.status = new AppStatus();
    this.log.info('Starting');
    this.appConfig = Container.get<AppConfig<FrontierConfig>>(AppConfig);
    this.servicesMap = this.appConfig.http.channels;
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

    // Registering status handler / payload receiver
    this.rpc.register<MethodRegRequest>(METHOD_STATUS, async (data) => {
      if (data.register && data.state_hash) {
        if (data.state_hash == this.registrationsHash) {
          // Skip handling. Nothing changed
          return;
        }
        const updateHdrs: string[] = [];
        const newReqs: EnrichersRequirements = [];
        for (const row of data.register) {
          const { service, method, options } = row;
          const route = { service, method };
          if (options && options.alias) {
            route.service = options.alias;
          }
          const bindToKey = epglue(IN_GENERIC, route.service, route.method)
          if (row.role === 'handler') {
            this.rpcHandlers[bindToKey] = [service, method];
            updateHdrs.push(bindToKey);
          }
          if (row.role === 'enricher' && options && Array.isArray(options.keys)) {
            this.propGetters[service] = dotPropGetter(options.props || {});
            // Handling enrichments data selection
            if (options.props) {
              for (const [k, v] of Object.entries(options.props)) {
                newReqs.push([k, v]);
              }
            }
            this.remoteEnrichers.subscribe(options.keys, service)
          }
        }
        this.registrationsHash = data.state_hash;
        // TODO: split by services (when enrichers will be splitted)
        this.enrichersRequirements = newReqs;
        this.handleBus.replace(updateHdrs, this.rpcGateway)
      }
      return this.status.get({});
    });

    // Attaching enrichers
    const enrichersConfig: {
      [k in EnrichersNames]?: MsgBusConfig['enrichers'][k]
    } = this.appConfig.get('bus').enrichers;
    Object
      .entries(enrichersConfig)
      .filter(([name, chans]) => chans && (name in EnrichersRepo))
      .forEach(([name, chans]: [EnrichersNames, Array<string>]) => {
        const enricher = new EnrichersRepo[name]();
        chans.forEach(chan => this.enrichBus.subscribe(chan, enricher.handle));
      })


    // Attaching handlers
    const handlersConfig: {
      [k in HandlersNames]?: MsgBusConfig['handlers'][k]
    } = this.appConfig.get('bus').handlers;
    Object
      .entries(handlersConfig)
      .filter(([name, chan]) => chan && (name in HandlersRepo))
      .forEach(([name, chan]: [HandlersNames, string]) => {
        this.handleBus.subscribe(chan, HandlersRepo[name]());
      })


    this.listenBus.subscribe('*', async (key: string, msg: IncomingMessage) => {
      try {
        return await this.rpc.notify(BROADCAST, BROADCAST, msg);
      } catch (error) {
        this.log.error(`catch! ${error.message}`);
      }
    });

    // Registering remote enrichers notification
    this.enrichBus.subscribe('*', async (key: string, msg: IncomingMessage) => {
      try {
        const smallMsg = getvals(msg, this.enrichersRequirements);
        return await this.rpc.request(ENRICH, ENRICH, smallMsg, this.remoteEnrichers.simulate(key));
      } catch (error) {
        this.log.error(`catch! ${error.message}`);
      }
    });
    // status notification for band director
    setInterval(() => {
      this.rpc.notify(SERVICE_DIRECTOR, RPC_IAMALIVE, { name: SERVICE_FRONTIER })
    }, 5 * 1000)
  }

  start() {
    this.log.info('Started');
  }

  /**
   * Using to handle event remotely
   */
  rpcGateway = async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
    if (msg.service && msg.name && this.rpcHandlers[key]) {
      // Real destination
      const [service, method] = this.rpcHandlers[key];
      try {
        const data: BandResponse | string | Array<any> | number | null = await this.rpc.request<any>(service, method, msg);
        if (data && typeof data === "object" && !Array.isArray(data) && isBandResponse(data)) {
          data.headers = data.headers || [];
          data.statusCode = data.statusCode || STATUS_OK;
          return data;
        }
        return response.data({ data });
      } catch (error) {
        this.log.warn('error at rpcGateway', error);
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

    // ### Phase 1: enriching
    const enrichers = this.enrichBus.publish(key, msg);
    const enrichments = await BBPromise.all(enrichers);
    if (enrichments.length && msg.data) {
      Object.assign(msg.data, ...enrichments);
    }

    // ### Phase 2: deliver to listeners
    // Call using Promise then to avoid waiting
    BBPromise.all(this.listenBus.publish(key, msg))
      .then(() => this.log.debug('Listeners handled'))
      .catch(error => this.log.error(error))

    // ### Phase 3: handling if configuring
    const handlers = this.handleBus.publish(key, msg);

    this.log.debug(` <--- ${key}`, msg);
    return await handlers[handlers.length - 1];
  }
}
