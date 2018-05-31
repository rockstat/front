import { Service, Inject, Container } from 'typedi';
import * as bb from 'bluebird';
import * as net from 'net';
import {
  AppServer
} from '@app/AppServer';
import {
  BaseIncomingMessage,
  FlexOutgoingMessage,
  BusMsgHdr,
  FrontierConfig,
  DispatchResult,
  Dictionary
} from '@app/types';
import {
  TreeBus,
  FlatBus
} from '@app/lib'
import {
  INCOMING,
  IN_INDEP,
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
  AppConfig
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

  setup() {
    this.handleBus.setNoneHdr(this.defaultHandler);

    const redisFactory = Container.get(RedisFactory);
    const meter = Container.get(Meter);
    const channels = [this.appConfig.rpc.name];

    // Setup RPC
    const rpcOptions: AgnosticRPCOptions = { channels, redisFactory, log: this.log, meter, ...this.appConfig.rpc }
    const rpcAdaptor = new RPCAdapterRedis(rpcOptions);

    this.rpc = new RPCAgnostic(rpcOptions);
    this.rpc.setup(rpcAdaptor);

    this.rpc.register<{}>('status', async () => {
      return { 'status': "i'm ok!" };
    });

    this.rpc.register<{ methods?: Array<[string, string, string]> }>('services', async (data) => {
      if (data.methods) {
        const updateHdrs: string[] = [];
        for (const [name, method, role] of data.methods) {
          const key = epglue(IN_INDEP, name, method)
          if (role === 'handler') {
            this.rpcHandlers[key] = [name, method];
          }
          updateHdrs.push(key);
        }
        this.handleBus.replace(updateHdrs, this.rpcGateway)
      }
      return { result: true };
    });

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
      const res = await this.rpc.request<Dictionary<any>>(msg.service, msg.name, msg);
      if (res.code && typeof res.code === 'number' && res.result) {
        return res as DispatchResult;
      } else {
        return {
          result: res,
          code: STATUS_OK
        }
      }
    }
    return this.defaultHandler(key, msg);
  }

  defaultHandler: BusMsgHdr = async (key, msg): Promise<DispatchResult> => {
    return {
      code: STATUS_OK,
      result: {
        key: key,
        id: msg.id
      }
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
    this.handleBus.set(key, func);
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
