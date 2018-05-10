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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViX3NvY2tldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcnBjL2FkYXB0ZXIvd2ViX3NvY2tldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVFBLG1EQUFvRDtBQU9wRDtJQWNFLFlBQVksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFvRDtRQVA3RSxtQkFBYyxHQUFHO1lBQ2YsV0FBVyxFQUFFLElBQUk7WUFDakIsU0FBUyxFQUFFLElBQUk7WUFDZixrQkFBa0IsRUFBRSxHQUFHO1lBQ3ZCLGNBQWMsRUFBRSxDQUFDO1NBQ2xCLENBQUE7UUFJQyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1NBQzNDO1FBRUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUV0QixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksdUJBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUV0QixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUV6QiwwQ0FBMEM7WUFDMUMsZ0NBQWdDO1lBRWhDLG1DQUFtQztZQUNuQyw4QkFBOEI7WUFFOUIsb0NBQW9DO1lBQ3BDLGtCQUFrQjtZQUNsQixLQUFLO1lBRUwsNEJBQTRCO1lBQzVCLGdDQUFnQztZQUVoQywrQkFBK0I7WUFDL0IsYUFBYTtRQUNmLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLElBQUksRUFBRSxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUE7UUFHRixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQsVUFBVTtJQUVWLFFBQVEsQ0FBQyxVQUFzQjtRQUM3QixLQUFLLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ25FLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixNQUFNLE9BQU8sS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNyRCxVQUFVLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQVcsRUFBRSxHQUFRLEVBQUUsRUFBRTtnQkFDMUQsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkMsQ0FBQyxDQUFDLENBQUM7U0FDSjtJQUdILENBQUM7Q0FFRjtBQWxFRCxnREFrRUMifQ==