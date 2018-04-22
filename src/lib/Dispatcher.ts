import { Service, Inject } from 'typedi';
import * as bb from 'bluebird';
import * as ipc from 'node-ipc';
import * as net from 'net';
import { AppServer } from '@app/AppServer';
import { LogFactory, Logger } from '@app/log';
import { BaseIncomingMessage, FlexOutgoingMessage } from '@app/types';
import { StubStore } from '@app/stores/StubStore';
import {
  MessageHandler,
  Configurer,
  IdGenShowFlake,
  PubSub
} from '@app/lib'
import { INCOMING } from '@app/constants';
import { epchild } from '@app/helpers';

@Service()
export class Dispatcher {

  log: Logger;
  socket: net.Socket;
  sock: string = 'var/alco.sock';
  enrichBus: PubSub = new PubSub();
  listenBus: PubSub = new PubSub();
  handleBus: { [key: string]: MessageHandler } = {};

  @Inject()
  idGen: IdGenShowFlake;

  @Inject()
  stubStore: StubStore;

  constructor(logFactory: LogFactory, confugurer: Configurer) {

    this.log = logFactory.for(this);
    this.log.info('Starting dispatcher');

    Object.assign(ipc.config, confugurer.ipcConfig);
    ipc.config.logger = this.log.debug.bind(this.log);
  }

  setup() {

    // Attaching stores
    this.enrichBus.subscribe('*', (key: string, msg: any) => {
      this.stubStore.push(msg);
    });
  }

  startIPC() {

    this.log.info('Starting IPC');
    ipc.serve(() => {
      ipc.server.on('message', (data, socket) => {
        ipc.log(data, 'got a message');
      });
    });

    ipc.server.start();
  }

  start() {
    // this.startIPC();
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

  async emit(key: string, msg: BaseIncomingMessage | FlexOutgoingMessage): Promise<any> {

    this.log.debug(` -> ${key}`);

    msg.id = this.idGen.take();
    msg.time = new Date();

    // ### Phase 1: enriching
    const enrichments = await this.enrichBus.publish(key, msg);
    if(enrichments.length){
      msg = Object.assign(msg, ...enrichments);
    }

    // ### Phase 2: deliver to listeners
    this.listenBus.publish(key, msg).then(results => { });

    // ### Phase 3: handling if configuring
    return this.handleBus[key] ? await this.handleBus[key](key, msg) : { id: msg.id };

  }
}
