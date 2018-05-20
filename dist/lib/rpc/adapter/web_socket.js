"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rpc_websockets_1 = require("rpc-websockets");
class RemoteWsRpcService {
    constructor({ config, log }) {
        this.wsClientConfig = {
            autoconnect: true,
            reconnect: true,
            reconnect_interval: 500,
            max_reconnects: 0
        };
        if (config === undefined) {
            throw new Error('Service not configured');
        }
        this.log = log;
        this.options = config;
        this.ws = new rpc_websockets_1.Client(this.options.location, this.wsClientConfig);
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
        });
        this.ws.on('close', (code) => {
            this.log.info(`ws close code:${code}`);
        });
        this.log.info('Initialized');
    }
    // handle:
    register(dispatcher) {
        for (const [route, method] of Object.entries(this.options.handlers)) {
            this.log.info(`adding method ${method} on ${route}`);
            dispatcher.registerHandler(route, (key, msg) => {
                return this.ws.call(method, msg);
            });
        }
    }
}
exports.RemoteWsRpcService = RemoteWsRpcService;
