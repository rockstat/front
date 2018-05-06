import 'reflect-metadata';
import { Container, Service, Inject } from 'typedi';
import { LogFactory, Logger } from '@app/log';
import { IdService, Configurer, Dispatcher } from '@app/lib';
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
export class CoreDeps {
  @Inject()
  config: Configurer;
  @Inject()
  logger: LogFactory;
  @Inject()
  metrics: StatsDMetrics
  @Inject()
  identifier: IdService;
}


@Service()
export class AppServer {

  @Inject()
  httpServer: HttpServer;

  @Inject()
  wsServer: WebSocketServer;

  @Inject()
  logFactory: LogFactory;

  @Inject()
  dispatcher: Dispatcher;

  log: Logger;

  initialize() {
    this.log = this.logFactory.for(this);
    this.log.info('Starting Handler service');
    this.dispatcher.setup();
  }

  start() {
    this.dispatcher.start();
    handlerService.startTransport();
  }

  startTransport() {
    this.log.info('Starting transports');
    this.httpServer.start();
    this.wsServer.start();
  }
}

export const handlerService = <AppServer>Container.get(AppServer);
handlerService.initialize();
handlerService.start();
export const deps = <CoreDeps>Container.get(CoreDeps);
