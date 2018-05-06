import 'reflect-metadata';
import { Container, Service, Inject } from 'typedi';
import { LogFactory, Logger } from '@app/log';
import { Indentifier, Configurer, Dispatcher } from '@app/lib';
import { } from '@app/services';
import {
  WebSocketServer,
  HttpServer
} from '@app/listeners';
import {
  RemoteService,
} from '@app/types';
import { StatsDMetrics } from '@app/lib/metrics/statsd';

@Service()
export class AppServer {

  @Inject()
  configurer: Configurer;

  @Inject()
  httpServer: HttpServer;

  @Inject()
  wsServer: WebSocketServer;

  @Inject()
  logFactory: LogFactory;

  @Inject()
  dispatcher: Dispatcher;

  @Inject()
  identifier: Indentifier;

  @Inject()
  metrics: StatsDMetrics

  services: Array<RemoteService> = [];
  log: Logger;

  initialize() {
    this.log = this.logFactory.for(this);
    this.log.info('Starting Handler service');
    this.dispatcher.setup();
  }

  start() {
    this.initServices();
    this.dispatcher.start();
    handlerService.startTransport();
  }

  /**
   * Init connectors
   */
  initServices() { }

  startTransport() {
    this.log.info('Starting transports');
    this.httpServer.start();
    this.wsServer.start();
  }
}

export const handlerService = <AppServer>Container.get(AppServer);
handlerService.initialize();
handlerService.start();
