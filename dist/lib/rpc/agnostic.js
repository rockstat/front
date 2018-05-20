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
