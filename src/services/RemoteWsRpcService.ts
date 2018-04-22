import { Service } from 'typedi';
import * as Ajv from 'ajv';
import { HttpService, Configurer, CallCache, Dispatcher } from '@app/lib'
import { LogFactory, Logger } from "@app/log";
import {
  RemoteHttpServiceConfig,
  EnrichService
} from '@app/types';
import { Client as WsClient } from 'rpc-websockets';


type QueryFormat = {
  ip: string
};

export = class RemoteWsRpcService {

  options: RemoteHttpServiceConfig;
  prefix: string;
  log: Logger;
  ws: WsClient;

  wsClientConfig = {
    autoconnect: true,
    reconnect: true,
    reconnect_interval: 500,
    max_reconnects: 0
  }

  constructor({ config, log }: { log: Logger, config: RemoteHttpServiceConfig }) {

    if (config === undefined) {
      throw new Error('Service not configured');
    }

    this.log = log;
    this.options = config;

    this.ws = new WsClient(this.options.location, this.wsClientConfig);
    this.ws.on('open', () => {

      this.log.info('ws open');

      // // send a notification to an RPC server
      // ws.notify('openedNewsModule')

      // // subscribe to receive an event
      // ws.subscribe('feedUpdated')

      // ws.on('feedUpdated', function() {
      //   updateLogic()
      // })

      // unsubscribe from an event
      // ws.unsubscribe('feedUpdated')

      // close a websocket connection
      // ws.close()
    })

    this.ws.on('close', (code) => {
      this.log.info(`ws close code:${code}`);
    })


    this.log.info('Initialized');
  }

  // handle:

  register(dispatcher: Dispatcher) {
    for (const [route, method] of Object.entries(this.options.handlers)) {
      this.log.info(`adding method ${method} on ${route}`);
      dispatcher.registerHandler(route, (key: string, msg: any) => {
        return this.ws.call(method, msg);
      });
    }


  }

}
