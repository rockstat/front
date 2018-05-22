"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const lib_1 = require("@app/lib");
const class_1 = require("@app/helpers/class");
const log_1 = require("@app/log");
const constants_1 = require("@app/constants");
const metrics_1 = require("@app/lib/metrics");
// RPC refs
// https://github.com/tedeh/jayson/blob/master/lib/utils.js
// https://github.com/qaap/rpc-websockets/blob/master/src/lib/client.js
// https://github.com/scoin/multichain-node/blob/development/lib/client.js
// http://www.jsonrpc.org/specification
const RPC20 = '2.0';
let RPCAgnostic = class RPCAgnostic {
    constructor(config, logFactory) {
        this.started = false;
        this.timeout = 2000;
        this.queue = {};
        this.methods = {};
        this.dispatch = async (msg) => {
            if ('method' in msg && msg.method !== undefined) {
                const names = msg.method.split(':');
                if (names.length === 3) {
                    msg.from = names[0];
                    msg.method = names[1];
                    msg.to = names[2];
                }
            }
            if ('method' in msg && msg.method !== undefined && msg.to && msg.params !== undefined) {
                this.dispatchRequest(msg).then(res => {
                    if (res) {
                        this.publish(res);
                    }
                });
            }
            else if ('id' in msg && msg.id !== undefined && ('result' in msg || 'error' in msg)) {
                this.dispatchResponse(msg);
            }
        };
        this.config = config.get('rpc');
        this.log = logFactory.for(this);
    }
    setup(adapter) {
        class_1.handleSetup(this);
        this.adapter = adapter;
        this.log.info('started');
    }
    publish(msg) {
        if ('method' in msg && msg.method !== undefined) {
            msg.method = `${msg.to}:${msg.method}:${constants_1.SERVICE_KERNEL}`;
        }
        this.adapter.send(msg.to, msg);
    }
    async dispatchResponse(msg) {
        const call = this.queue[msg.id];
        if (call) {
            if (call.timeout) {
                clearTimeout(call.timeout);
            }
            if ('result' in msg && call.resolve) {
                call.timing();
                call.resolve(msg.result);
            }
            if ('error' in msg && call.reject) {
                this.metrics.tick('rpc.error');
                call.reject(msg.error);
            }
            this.queue[msg.id] = undefined;
        }
    }
    async dispatchRequest(msg) {
        const { method, from } = msg;
        try {
            const result = await this.methods[method](msg.params || {});
            if ('id' in msg && msg.id !== undefined) {
                return {
                    jsonrpc: RPC20,
                    id: msg.id,
                    from: constants_1.SERVICE_KERNEL,
                    to: from,
                    result: result || null
                };
            }
        }
        catch (error) {
            return this.wrapError(msg, error);
            this.log.error('handler exec error', error);
        }
    }
    notify(service, method, params = null) {
        const msg = {
            jsonrpc: RPC20,
            from: constants_1.SERVICE_KERNEL,
            to: service,
            method: method,
            params: params
        };
        this.publish(msg);
    }
    request(service, method, params = null) {
        return new Promise((resolve, reject) => {
            const id = this.ids.rpcId();
            const msg = {
                jsonrpc: RPC20,
                from: constants_1.SERVICE_KERNEL,
                to: service,
                id: id,
                method: method,
                params: params || null
            };
            this.queue[id] = {
                resolve,
                reject,
                timing: this.metrics.timenote('rpc.request', { service, method }),
                timeout: setTimeout(() => {
                    const call = this.queue[id];
                    if (call) {
                        this.queue[id] = undefined;
                        call.reject(new Error('Reuest timeout'));
                    }
                }, this.timeout)
            };
            this.publish(msg);
        });
    }
    register(method, func) {
        this.methods[method] = func;
    }
    wrapError(msg, error, code) {
        if ('id' in msg && msg.id !== undefined) {
            return {
                id: msg.id,
                from: constants_1.SERVICE_KERNEL,
                to: msg.from,
                jsonrpc: RPC20,
                error: {
                    code: code || 0,
                    message: error.message,
                    data: error.stack || {}
                }
            };
        }
    }
};
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.IdService)
], RPCAgnostic.prototype, "ids", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", metrics_1.StatsDMetrics)
], RPCAgnostic.prototype, "metrics", void 0);
RPCAgnostic = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [lib_1.Configurer, log_1.LogFactory])
], RPCAgnostic);
exports.RPCAgnostic = RPCAgnostic;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdub3N0aWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3JwYy9hZ25vc3RpYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUVBLG1DQUEyRDtBQUUzRCxrQ0FBaUQ7QUFDakQsOENBQWlEO0FBQ2pELGtDQUE4QztBQUs5Qyw4Q0FBZ0Q7QUFDaEQsOENBQWlEO0FBR2pELFdBQVc7QUFDWCwyREFBMkQ7QUFDM0QsdUVBQXVFO0FBQ3ZFLDBFQUEwRTtBQUMxRSx1Q0FBdUM7QUFFdkMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBa0JwQixJQUFhLFdBQVcsR0FBeEI7SUFnQkUsWUFBWSxNQUFrQixFQUFFLFVBQXNCO1FBUHRELFlBQU8sR0FBWSxLQUFLLENBQUM7UUFDekIsWUFBTyxHQUFXLElBQUksQ0FBQztRQUV2QixVQUFLLEdBQW9CLEVBQUUsQ0FBQztRQUM1QixZQUFPLEdBQWUsRUFBRSxDQUFDO1FBcUJ6QixhQUFRLEdBQUcsS0FBSyxFQUFFLEdBQWdELEVBQWlCLEVBQUU7WUFDbkYsSUFBSSxRQUFRLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO2dCQUMvQyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDdEIsR0FBRyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN0QixHQUFHLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDbkI7YUFDRjtZQUNELElBQUksUUFBUSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLFNBQVMsSUFBSSxH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