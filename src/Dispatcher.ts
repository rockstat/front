import { Service, Inject, Container } from 'typedi';
import * as BBPromise from 'bluebird';
import * as net from 'net';
import {
  AppServer
} from '@app/AppServer';
import {
  BaseIncomingMessage,
  BusMsgHdr,
  FrontierConfig,
  Dictionary,
  IncomingMessage,
  HttpConfig,
  HTTPServiceMapParams,
} from '@app/types';
import {
  TreeBus,
  TreeNameBus
} from '@app/bus';
import {
  IN_GENERIC,
  RPC_IAMALIVE,
  SERVICE_DIRECTOR,
  SERVICE_FRONTIER,
  BROADCAST,
  IN_REDIR,
  STATUS_INT_ERROR,
  ENRICH,
  IN_PIXEL,
} from '@app/constants';
import {
  epglue
} from '@app/helpers';
import {
  TheIds,
  RPCAdapterRedis,
  RPCAgnostic,
  Logger,
  AppStatus,
  RedisFactory,
  AgnosticRPCOptions,
  Meter,
  AppConfig,
  METHOD_STATUS,
  MethodRegRequest,
  EnrichersRequirements,
  DispatchResult
} from '@rockstat/rock-me-ts';
import { baseRedirect, basePixel } from '@app/handlers';
import { dotPropGetter, getvals } from '@app/helpers/getprop';

@Service()
export class Dispatcher {

  log: Logger;
  enrichBus: TreeBus = new TreeBus();
  remoteEnrichers: TreeNameBus = new TreeNameBus()
  listenBus: TreeBus = new TreeBus();
  handleBus: TreeBus = new TreeBus();
  appConfig: AppConfig<FrontierConfig>;
  idGen: TheIds;
  status: AppStatus;
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
      if (data.register) {
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
        this.enrichersRequirements = newReqs;
        this.handleBus.replace(updateHdrs, this.rpcGateway)
      }
      return this.status.get({});
    });
    this.log.info('register handler here');
    // default redirect handler
    baseRedirect(this.servicesMap, this);
    // default pixel handler
    basePixel(this.servicesMap, this);
    // notify band director
    setInterval(() => {
      this.rpc.notify(SERVICE_DIRECTOR, RPC_IAMALIVE, { name: SERVICE_FRONTIER })
    }, 5 * 1000)
    // Registering remote listeners notification
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
  }

  start() {
    this.log.info('Started');
  }

  rpcGateway = async (key: string, msg: BaseIncomingMessage): Promise<DispatchResult> => {
    if (msg.service && msg.name && this.rpcHandlers[key]) {
      // Real destination
      const [service, method] = this.rpcHandlers[key];
      return await this.rpc.request<Dictionary<any>>(service, method, msg);
    }
    return this.defaultHandler(key, msg);
  }

  defaultHandler: BusMsgHdr = async (key, msg): Promise<DispatchResult> => {
    return {
      key: key,
      id: msg.id
    }
  }

  registerListener(key: string, func: BusMsgHdr): void {
    this.log.info(`Registering subscriber for ${key}`);
    this.listenBus.subscribe(key, func);
  }

  async dispatch(key: string, msg: BaseIncomingMessage): Promise<DispatchResult> {
    try {
      return await this.emit(key, msg);
    } catch (error) {
      this.log.warn(error);
      return {
        error: 'Internal error. Smth wrong.',
        code: STATUS_INT_ERROR
      }
    }
  }

  async emit(key: string, msg: BaseIncomingMessage): Promise<any> {

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
    BBPromise.all(this.listenBus.publish(key, msg)).then(results => { });

    // ### Phase 3: handling if configuring
    const handlers = this.handleBus.publish(key, msg);
    const result = await handlers[handlers.length - 1];
    this.log.debug(` <--- ${key}`, msg);
    return result
  }
}
