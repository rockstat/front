import { Service, Inject, Container } from 'typedi';
import * as bb from 'bluebird';
import * as net from 'net';
import {
  AppServer
} from '@app/AppServer';
import {
  BaseIncomingMessage,
  FlexOutgoingMessage,
  IncMsg,
  BusMsgHdr,
  KernelConfig
} from '@app/types';
import {
  TreeBus,
  FlatBus
} from '@app/lib'
import {
  INCOMING,
  IN_INDEP,
  RPC_IAMALIVE,
  SERVICE_BAND,
  SERVICE_KERNEL,
  BROADCAST
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

@Service()
export class Dispatcher {

  log: Logger;
  enrichBus: TreeBus = new TreeBus();
  listenBus: TreeBus = new TreeBus();
  handleBus: FlatBus = new FlatBus();
  appConfig: AppConfig<KernelConfig>;
  idGen: TheIds;
  rpc: RPCAgnostic;

  rpcHandlers: { [k: string]: [string, string] } = {};

  constructor() {
    this.log = Container.get(Logger).for(this);
    this.log.info('Starting');
    this.appConfig = Container.get<AppConfig<KernelConfig>>(AppConfig);
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
    // notify band
    setImmediate(() => {
      this.rpc.notify(SERVICE_BAND, RPC_IAMALIVE, { name: SERVICE_KERNEL })
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

  rpcGateway = async (key: string, msg: IncMsg): Promise<FlexOutgoingMessage> => {
    if (msg.service && msg.name && this.rpcHandlers[key]) {
      return await this.rpc.request<any>(msg.service, msg.name, msg)
    }
    return this.defaultHandler(key, msg);
  }

  defaultHandler: BusMsgHdr = (key, msg): any => {
    return { key: key, id: msg.id }
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

  async emit(key: string, msg: IncMsg): Promise<any> {

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
