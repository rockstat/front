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
            this.rpc.notify(constants_1.SERVICE_BAND, constants_1.RPC_IAMALIVE, { name: constants_1.SERVICE_KERNEL });
        });
        this.listenBus.subscribe('*', async (key, msg) => {
            try {
                return await this.rpc.notify(constants_1.BROADCAST, constants_1.BROADCAST, msg);
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
        msg.time = Number(new Date());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvRGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLG1DQUF5QztBQUl6QyxrQ0FBOEM7QUFFOUMscURBQWtEO0FBQ2xELGtDQUtpQjtBQUVqQiw4Q0FBMkc7QUFDM0csMENBQStDO0FBQy9DLG9EQUFvRDtBQUNwRCxzREFBNkQ7QUFXN0QsSUFBYSxVQUFVLEdBQXZCO0lBcUJFLFlBQVksVUFBc0IsRUFBRSxNQUFrQjtRQWxCdEQsY0FBUyxHQUFZLElBQUksYUFBTyxFQUFFLENBQUM7UUFDbkMsY0FBUyxHQUFZLElBQUksYUFBTyxFQUFFLENBQUM7UUFDbkMsY0FBUyxHQUFZLElBQUksYUFBTyxFQUFFLENBQUM7UUFjbkMsZ0JBQVcsR0FBc0MsRUFBRSxDQUFDO1FBZ0RwRCxlQUFVLEdBQUcsS0FBSyxFQUFFLEdBQVcsRUFBRSxHQUFXLEVBQWdDLEVBQUU7WUFDNUUsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDcEQsT0FBTyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTthQUMvRDtZQUNELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFBO1FBRUQsbUJBQWMsR0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQU8sRUFBRTtZQUM1QyxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFBO1FBQ2pDLENBQUMsQ0FBQTtRQXREQyxJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUs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