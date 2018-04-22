import 'reflect-metadata';
import { Container, Service, Inject } from 'typedi';
import { LogFactory, Logger } from '@app/log';
import { Indentifier, Configurer, Dispatcher } from '@app/lib';
import { services } from '@app/services';
import {
  WebSocketServer,
  HttpServer
} from '@app/listeners';
import {
  RemoteService,
} from '@app/types';

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
   * Init microservices connectors
   */
  initServices() {
    for (const [name, config] of Object.entries(this.configurer.services)) {
      const log = this.logFactory.child({ name });
      // const ClassName = config.class;
      const params = { log, config, container: Container };
      const Service = services[config.class];
      if (Service) {
        const service = new Service(params);
        if (service.register) {
          service.register(this.dispatcher);
        }
      }
    }
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
