import { Service, Inject, Container } from 'typedi';
import * as bb from 'bluebird';
import * as net from 'net';
import {
  AppServer
} from '@app/AppServer';
import {
  BaseIncomingMessage,
  BusMsgHdr,
  FrontierConfig,
  DispatchResult,
  Dictionary,
  MethodRegistration
} from '@app/types';
import {
  TreeBus,
  FlatBus
} from '@app/lib'
import {
  INCOMING,
  IN_GENERIC,
  RPC_IAMALIVE,
  SERVICE_DIRECTOR,
  SERVICE_FRONTIER,
  BROADCAST,
  IN_REDIR,
  STATUS_OK,
  STATUS_BAD_REQUEST,
  STATUS_TEMP_REDIR,
  STATUS_INT_ERROR,
} from '@app/constants';
import {
  epchild,
  epglue
} from '@app/helpers';
import {
  TheIds,
  RPCAdapterRedis,
  RPCAgnostic,
  Logger,
  RedisFactory,
  AgnosticRPCOptions,
  Meter,
  AppConfig,
  METHOD_STATUS,
  STATUS_RUNNING
} from 'rock-me-ts';
import { baseRedirect } from '@app/lib/handlers/redirect';

@Service()
export class Dispatcher {

  log: Logger;
  enrichBus: TreeBus = new TreeBus();
  listenBus: TreeBus = new TreeBus();
  handleBus: FlatBus = new FlatBus();
  appConfig: AppConfig<FrontierConfig>;
  idGen: TheIds;
  rpc: RPCAgnostic;
  rpcHandlers: { [k: string]: [string, string] } = {};

  constructor() {
    this.log = Container.get(Logger).for(this);
    this.log.info('Starting');
    this.appConfig = Container.get<AppConfig<FrontierConfig>>(AppConfig);
    this.idGen = Container.get(TheIds);
  }

  /**
   * Initial asynchronous setup
   */
  setup() {
    this.handleBus.setNoneHdr(this.defaultHandler);

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
    this.rpc.register<{ register?: Array<MethodRegistration> }>(METHOD_STATUS, async (data) => {
      if (data.register) {
        const updateHdrs: string[] = [];
        for (const row of data.register) {
          const { service, method, options } = row;
          const route = { service, method };
          if (options && options.service) {
            route.service = options.service;
          }
          const bindToKey = epglue(IN_GENERIC, route.service, route.method)
          if (row.role === 'handler') {
            this.rpcHandlers[bindToKey] = [service, method];
            updateHdrs.push(bindToKey);
          }
        }
        this.handleBus.replace(updateHdrs, this.rpcGateway)
      }
      return {};
    });;
    // Default redirect handler
    this.handleBus.handle(IN_REDIR, baseRedirect);
    // notify band director
    setImmediate(() => {
      this.rpc.notify(SERVICE_DIRECTOR, RPC_IAMALIVE, { name: SERVICE_FRONTIER })
    })

    this.listenBus.subscribe('*', async (key: string, msg: BusMsgHdr) => {
      try {
        return await this.rpc.notify(BROADCAST, BROADCAST, msg);
      } catch (error) {
        this.log.error(`catch! ${error.message}`);
      }
    })
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

  registerEnricher(key: string, func: BusMsgHdr): void {
    this.log.info(`Registering enricher for ${key}`);
    this.enrichBus.subscribe(key, func);
  }

  registerListener(key: string, func: BusMsgHdr): void {
    this.log.info(`Registering subscriber for ${key}`);
    this.listenBus.subscribe(key, func);
  }

  registerHandler(key: string, func: BusMsgHdr): void {
    this.log.info(`>>> Registered handler fo route ${key}`);
    this.handleBus.set(key, func);
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

    this.log.debug(` -> ${key}`);

    msg.id = this.idGen.flake();
    msg.time = Number(new Date());

    // ### Phase 1: enriching
    const enrichments = await this.enrichBus.publish(key, msg);
    if (enrichments.length) {
      msg = Object.assign(msg, ...enrichments);
    }
    // ### Phase 2: deliver to listeners
    this.listenBus.publish(key, msg).then(results => { });

    // ### Phase 3: handling if configuring
    return await this.handleBus.handle(key, msg);
  }
}
