import { Service, Inject } from 'typedi';
import * as bb from 'bluebird';
import * as net from 'net';
import { AppServer } from '@app/AppServer';
import { LogFactory, Logger } from '@app/log';
import { BaseIncomingMessage, FlexOutgoingMessage, IndepIncomingMessage } from '@app/types';
import { StubStore } from '@app/stores/StubStore';
import {
  MessageHandler,
  Configurer,
  IdGenShowFlake,
  PubSub,
  KERNEL
} from '@app/lib'

import { INCOMING, IN_INDEP } from '@app/constants';
import { epchild, epglue } from '@app/helpers';
import { RPCEnclosure, RPCRequest } from '@app/lib/RpcEnclosure';

interface RPCRegisterStruct {
  methods?: Array<[string, string, string]>
}
interface RPCRegisterHandler {
  (params: RPCRegisterStruct): any
}

@Service()
export class Dispatcher {

  log: Logger;
  enrichBus: PubSub = new PubSub();
  listenBus: PubSub = new PubSub();
  handleBus: { [key: string]: MessageHandler } = {};

  @Inject()
  idGen: IdGenShowFlake;

  @Inject()
  stubStore: StubStore;

  @Inject()
  rpc: RPCEnclosure
  rpcHandlers: { [k: string]: [string, string] } = {};

  constructor(logFactory: LogFactory, confugurer: Configurer) {
    this.log = logFactory.for(this);
    this.log.info('Starting dispatcher');
  }

  setup() {

    // Attaching stores
    this.enrichBus.subscribe('*', (key: string, msg: any) => {
      this.stubStore.push(msg);
    });

    this.rpc.setup();

    this.rpc.register('status', async () => {
      return { 'status': "i'm ok!" };
    });

    this.rpc.register<RPCRegisterStruct>('__status_receiver', async (params) => {
      if (params.methods) {
        for (const [name, method, role] of params.methods) {
          const key = epglue(IN_INDEP, name, method)
          if (role === 'handler') {
            this.log.info('registering rpc handler');
            this.rpcHandlers[key] = [name, method];
          }
          this.registerHandler(key, this.rpcHandlerGateway)
        }
      }
      return {};
    });

    setTimeout(() => {
      this.rpc.request<any>('band', '__status_request', {})
        .then((_) => { }).catch(err => this.log.error(err))
    }, 100);
  }

  rpcHandlerGateway = async (key: string, msg: IndepIncomingMessage): Promise<FlexOutgoingMessage> => {
    if (msg.service && msg.name && this.rpcHandlers[key]) {
      return await this.rpc.request<any>(msg.service, msg.name, msg)
    }
    return this.defaultHandler(key, msg);
  }

  defaultHandler(key: string, msg: IndepIncomingMessage): FlexOutgoingMessage {
    return { key: key, id: msg.id }
  }

  start() {
    this.log.info('Started');
  }

  registerEnricher(key: string, func: MessageHandler): void {
    this.log.info(`Registering enricher for ${key}`);
    this.enrichBus.subscribe(key, func);
  }

  registerListener(key: string, func: MessageHandler): void {
    this.log.info(`Registering subscriber for ${key}`);
    this.listenBus.subscribe(key, func);
  }

  registerHandler(key: string, func: MessageHandler): void {
    this.log.info(`Registering handler for ${key}`);
    this.handleBus[key] = func;
  }

  async emit(key: string, msg: IndepIncomingMessage): Promise<any> {

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
    return this.handleBus[key] ? await this.handleBus[key](key, msg) : this.defaultHandler(key, msg);

  }
}
