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
const log_1 = require("@app/log");
const StubStore_1 = require("@app/stores/StubStore");
const lib_1 = require("@app/lib");
const constants_1 = require("@app/constants");
const helpers_1 = require("@app/helpers");
const agnostic_1 = require("@app/lib/rpc/agnostic");
const redis_1 = require("@app/lib/rpc/adapter/redis");
let Dispatcher = class Dispatcher {
    constructor(logFactory, config) {
        this.enrichBus = new lib_1.TreeBus();
        this.listenBus = new lib_1.TreeBus();
        this.handleBus = new lib_1.FlatBus();
        this.rpcHandlers = {};
        this.rpcGateway = async (key, msg) => {
            if (msg.service && msg.name && this.rpcHandlers[key]) {
                return await this.rpc.request(msg.service, msg.name, msg);
            }
            return this.defaultHandler(key, msg);
        };
        this.defaultHandler = (key, msg) => {
            return { key: key, id: msg.id };
        };
        this.log = logFactory.for(this);
        this.rpcConfig = config.get('rpc');
        this.log.info('starting');
    }
    setup() {
        this.rpcRedis.setup(this.rpcConfig);
        this.rpcRedis.setReceiver(this.rpc, 'dispatch');
        this.rpc.setup(this.rpcRedis);
        this.handleBus.setNoneHdr(this.defaultHandler);
        this.rpc.register('status', async () => {
            return { 'status': "i'm ok!" };
        });
        this.rpc.register('services', async (data) => {
            if (data.methods) {
                const updateHdrs = [];
                for (const [name, method, role] of data.methods) {
                    const key = helpers_1.epglue(constants_1.IN_INDEP, name, method);
                    if (role === 'handler') {
                        this.rpcHandlers[key] = [name, method];
                    }
                    updateHdrs.push(key);
                }
                this.handleBus.replace(updateHdrs, this.rpcGateway);
            }
            return { result: true };
        });
        // notify band
        setImmediate(() => {
            this.rpc.notify(constants_1.SERVICE_BAND, constants_1.CALL_IAMALIVE, { name: constants_1.SERVICE_KERNEL });
        });
        this.listenBus.subscribe('*', async (key, msg) => {
            try {
                return await this.rpc.notify('any', 'listener', msg);
            }
            catch (error) {
                this.log.error(`catch! ${error.message}`);
            }
        });
    }
    start() {
        this.log.info('Started');
    }
    registerEnricher(key, func) {
        this.log.info(`Registering enricher for ${key}`);
        this.enrichBus.subscribe(key, func);
    }
    registerListener(key, func) {
        this.log.info(`Registering subscriber for ${key}`);
        this.listenBus.subscribe(key, func);
    }
    registerHandler(key, func) {
        this.handleBus.set(key, func);
    }
    async emit(key, msg) {
        this.log.debug(` -> ${key}`);
        msg.id = this.idGen.take();
        msg.time = new Date();
        // ### Phase 1: enriching
        const enrichments = await this.enrichBus.publish(key, msg);
        if (enrichments.length) {
            msg = Object.assign(msg, ...enrichments);
        }
        // ### Phase 2: deliver to listeners
        this.listenBus.publish(key, msg).then(results => { });
        // ### Phase 3: handling if configuring
        return await this.handleBus.handle(key, msg);
    }
};
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.IdGenShowFlake)
], Dispatcher.prototype, "idGen", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", StubStore_1.StubStore)
], Dispatcher.prototype, "stubStore", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", redis_1.RPCAdapterRedis)
], Dispatcher.prototype, "rpcRedis", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", agnostic_1.RPCAgnostic)
], Dispatcher.prototype, "rpc", void 0);
Dispatcher = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [log_1.LogFactory, lib_1.Configurer])
], Dispatcher);
exports.Dispatcher = Dispatcher;
