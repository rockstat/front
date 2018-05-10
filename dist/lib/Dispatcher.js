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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvRGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLG1DQUF5QztBQUl6QyxrQ0FBOEM7QUFFOUMscURBQWtEO0FBQ2xELGtDQUtpQjtBQUVqQiw4Q0FBaUc7QUFDakcsMENBQStDO0FBQy9DLG9EQUFvRDtBQUNwRCxzREFBNkQ7QUFXN0QsSUFBYSxVQUFVLEdBQXZCO0lBcUJFLFlBQVksVUFBc0IsRUFBRSxNQUFrQjtRQWxCdEQsY0FBUyxHQUFZLElBQUksYUFBTyxFQUFFLENBQUM7UUFDbkMsY0FBUyxHQUFZLElBQUksYUFBTyxFQUFFLENBQUM7UUFDbkMsY0FBUyxHQUFZLElBQUksYUFBTyxFQUFFLENBQUM7UUFjbkMsZ0JBQVcsR0FBc0MsRUFBRSxDQUFDO1FBZ0RwRCxlQUFVLEdBQUcsS0FBSyxFQUFFLEdBQVcsRUFBRSxHQUFXLEVBQWdDLEVBQUU7WUFDNUUsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDcEQsT0FBTyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTthQUMvRDtZQUNELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFBO1FBRUQsbUJBQWMsR0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQU8sRUFBRTtZQUM1QyxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFBO1FBQ2pDLENBQUMsQ0FBQTtRQXREQyxJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUs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