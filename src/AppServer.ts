import 'reflect-metadata';
import { Container, Service, Inject } from 'typedi';
import { Dispatcher } from '@app/lib';
import { TheIds, Meter, Logger, RedisFactory, AppConfig } from 'rock-me-ts';
import {
  WebSocketServer,
  HttpServer
} from '@app/listeners';
import { FrontierConfig } from '@app/types';


@Service()
export class AppServer {

  appConfig: AppConfig<FrontierConfig>;
  httpServer: HttpServer;
  wsServer: WebSocketServer;
  dispatcher: Dispatcher;
  log: Logger;
  meter: Meter;

  setup() {
    Container.set(AppConfig, new AppConfig<FrontierConfig>());
    this.appConfig = Container.get(AppConfig);
    Container.set(Logger, new Logger(this.appConfig.log));
    const log = Container.get(Logger);
    this.log = log.for(this);

    this.log.info('Starting service');

    Container.set(Meter, new Meter(this.appConfig.meter));
    Container.set(TheIds, new TheIds());

    const meter = this.meter = Container.get(Meter);

    Container.set(RedisFactory, new RedisFactory({ log, meter, ...this.appConfig.redis }));
    Container.set(Dispatcher, new Dispatcher());
    Container.set(HttpServer, new HttpServer());
    Container.set(WebSocketServer, new WebSocketServer());

    this.httpServer = Container.get(HttpServer);
    this.wsServer = Container.get(WebSocketServer);

    const dispatcher = this.dispatcher = Container.get(Dispatcher);
    dispatcher.setup();
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
    process.exit(0);
  }

  private attachSignals() {
    // Handles normal process termination.
    process.on('exit', () => this.onStop());
    // Handles `Ctrl+C`.
    process.on('SIGINT', () => this.onStop());
    // Handles `kill pid`.
    process.on('SIGTERM', () => this.onStop());
  }

}

export const appServer = <AppServer>Container.get(AppServer);
appServer.setup()
