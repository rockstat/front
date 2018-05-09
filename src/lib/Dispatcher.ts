import { Service, Inject } from 'typedi';
import * as bb from 'bluebird';
import * as net from 'net';
import { AppServer } from '@app/AppServer';
import { LogFactory, Logger } from '@app/log';
import { BaseIncomingMessage, FlexOutgoingMessage, IncMsg, RPCConfig, BusMsgHdr } from '@app/types';
import { StubStore } from '@app/stores/StubStore';
import {
  Configurer,
  IdGenShowFlake,
  TreeBus,
  FlatBus
} from '@app/lib'

import { INCOMING, IN_INDEP, CALL_IAMALIVE, SERVICE_BAND, SERVICE_KERNEL } from '@app/constants';
import { epchild, epglue } from '@app/helpers';
import { RPCAgnostic } from '@app/lib/rpc/agnostic';
import { RPCAdapterRedis } from '@app/lib/rpc/adapter/redis';

interface RPCRegisterStruct {
  methods?: Array<[string, string, string]>
}

interface RPCRegisterHandler {
  (params: RPCRegisterStruct): any
}

@Service()
export class Dispatcher {

  log: Logger;
  enrichBus: TreeBus = new TreeBus();
  listenBus: TreeBus = new TreeBus();
  handleBus: FlatBus = new FlatBus();

  @Inject()
  idGen: IdGenShowFlake;

  @Inject()
  stubStore: StubStore;

  rpcConfig: RPCConfig;
  @Inject()
  rpcRedis: RPCAdapterRedis;
  @Inject()
  rpc: RPCAgnostic;

  rpcHandlers: { [k: string]: [string, string] } = {};

  constructor(logFactory: LogFactory, config: Configurer) {
    this.log = logFactory.for(this);
    this.rpcConfig = config.get('rpc');
    this.log.info('starting');
  }

  setup() {
    this.rpcRedis.setup(this.rpcConfig);
    this.rpcRedis.setReceiver(this.rpc, 'dispatch');
    this.rpc.setup(this.rpcRedis);
    this.handleBus.setNoneHdr(this.defaultHandler);

    this.rpc.register('status', async () => {
      return { 'status': "i'm ok!" };
    });

    this.rpc.register<RPCRegisterStruct>('services', async (data) => {
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
      this.rpc.notify(SERVICE_BAND, CALL_IAMALIVE, { name: SERVICE_KERNEL })
    })

    this.listenBus.subscribe('*', async (key: string, msg: BusMsgHdr) => {
      try {
        return await this.rpc.notify('any', 'listener', msg);
      } catch (error) {
        this.log.error(`catch! ${error.message}`);
      }

    })

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

  start() {
    this.log.info('Started');
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

    msg.id = this.idGen.take();
    msg.time = new Date();

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
