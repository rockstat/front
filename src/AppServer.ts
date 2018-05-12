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
export class AppServer {

  @Inject()
  httpServer: HttpServer;

  @Inject()
  wsServer: WebSocketServer;

  @Inject()
  dispatcher: Dispatcher;

  @Inject()
  logFactory: LogFactory

  log: Logger;

  setup() {
    this.log = this.logFactory.for(this);
    this.log.info('Starting Handler service');
    this.dispatcher.setup();
  }

  start() {
    this.dispatcher.start();
    this.startTransport();
  }

  private startTransport() {
    this.log.info('Starting transports');
    this.httpServer.start();
    this.wsServer.start();
  }

  private onStop() {
    this.log.info('Stopping...');
  }

  private attachSignals() {
    // Handles normal process termination.
    process.on('exit', () => this.onStop());
    // Handles `Ctrl+C`.
    process.on('SIGINT', () => process.exit(0));
    // Handles `kill pid`.
    process.on('SIGTERM', () => process.exit(0));
  }

}

export const appServer = <AppServer>Container.get(AppServer);
appServer.setup()
