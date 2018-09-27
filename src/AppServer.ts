import 'reflect-metadata';
import { Container, Service } from 'typedi';
import { Dispatcher } from './Dispatcher';
import { TheIds, Meter, Logger, RedisFactory, AppConfig, version as rockmeVersion, ENV_PROD } from '@rockstat/rock-me-ts';
import {
  WebSocketServer,
  HttpServer
} from '@app/http';
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
    this.appConfig = new AppConfig<FrontierConfig>()
    Container.set(AppConfig, this.appConfig);
    const log = new Logger(this.appConfig.log)
    Container.set(Logger, log);
    this.log = log.for(this);
    this.log.info(this.appConfig.config, 'Configuration');
    this.log.info(`Configuration ${AppConfig.env} ${ENV_PROD} ${String(AppConfig.env) === ENV_PROD}`);

    this.log.info({
      version: this.appConfig.config.version,
      rockmeVersion
    }, 'Starting service');

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
    this.attachSignals();
    this.dispatcher.start();
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
