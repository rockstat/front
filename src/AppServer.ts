import 'reflect-metadata';
// import { Container, Service } from 'typedi';
import { Dispatcher } from '@app/Dispatcher';
import { Logger, TheIds, Meter, RedisFactory, AppConfig, version as rockmeVersion, ENV_PROD } from '@rockstat/rock-me-ts';
import {
  // WebSocketServer,
  HttpServer
} from '@app/http';
import { FrontierConfig } from '@app/types';
import * as constants from '@app/constants';
import { getAppDeps } from '@rockstat/rock-me-ts';

// @Service()
export class AppServer {

  appConfig: AppConfig<FrontierConfig>;
  httpServer: HttpServer;
  // wsServer: WebSocketServer;
  dispatcher: Dispatcher;
  log: Logger;
  meter: Meter;

  setup() {
    this.appConfig = new AppConfig<FrontierConfig>({ vars: constants })

    getAppDeps().setDep('config', this.appConfig);
    // Container.set(AppConfig, this.appConfig);

    const mainLog = new Logger(this.appConfig.log)
    getAppDeps().setDep('log', mainLog);
    // Container.set(Logger, mainLog);

    this.log = mainLog.for(this);
    this.log.info(`Configuration ${AppConfig.env} ${ENV_PROD} ${String(AppConfig.env) === ENV_PROD}`);

    this.log.info({
      version: this.appConfig.config.version,
      rockmeVersion
    }, 'Starting service');

    this.meter = new Meter(this.appConfig.meter);
    getAppDeps().setDep('meter', this.meter);
    // Container.set(Meter, this.meter);

    const ids = new TheIds();
    getAppDeps().setDep('ids', ids);
    // Container.set(TheIds, getAppDeps().getDep('ids'));


    const redisFactory = new RedisFactory({ log: this.log, meter: this.meter, ...this.appConfig.redis });
    getAppDeps().setDep('redis', redisFactory);
    // Container.set(RedisFactory, redisFactory);
    
    this.dispatcher = new Dispatcher();
    this.httpServer = new HttpServer(this.dispatcher);
    // this.wsServer = new WebSocketServer();
    

    // Container.set(Dispatcher, this.dispatcher);
    // Container.set(HttpServer, this.httpServer);
    // Container.set(WebSocketServer, this.wsServer);

    // const dispatcher = this.dispatcher = Container.get(Dispatcher);
    this.dispatcher.setup();
  }

  start() {
    this.attachSignals();
    this.dispatcher.start();
    this.log.info('Starting transports');
    this.httpServer.start();
    // this.wsServer.start();
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

export const appServer = new AppServer();
appServer.setup()
