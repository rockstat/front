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
const constants_1 = require("@app/constants");
const helpers_1 = require("@app/helpers");
const rock_me_ts_1 = require("rock-me-ts");
let Dispatcher = class Dispatcher {
    constructor() {
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
        this.log = typedi_1.Container.get(rock_me_ts_1.Logger).for(this);
        this.log.info('Starting');
        this.appConfig = typedi_1.Container.get(rock_me_ts_1.AppConfig);
        this.idGen = typedi_1.Container.get(rock_me_ts_1.TheIds);
    }
    setup() {
        this.handleBus.setNoneHdr(this.defaultHandler);
        const redisFactory = typedi_1.Container.get(rock_me_ts_1.RedisFactory);
        const meter = typedi_1.Container.get(rock_me_ts_1.Meter);
        const channels = [this.appConfig.rpc.name];
        // Setup RPC
        const rpcOptions = { channels, redisFactory, log: this.log, meter, ...this.appConfig.rpc };
        const rpcAdaptor = new rock_me_ts_1.RPCAdapterRedis(rpcOptions);
        this.rpc = new rock_me_ts_1.RPCAgnostic(rpcOptions);
        this.rpc.setup(rpcAdaptor);
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
        msg.id = this.idGen.flake();
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
Dispatcher = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], Dispatcher);
exports.Dispatcher = Dispatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvRGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLG1DQUFvRDtBQWFwRCxrQ0FHaUI7QUFDakIsOENBT3dCO0FBQ3hCLDBDQUdzQjtBQUN0QiwyQ0FTb0I7QUFHcEIsSUFBYSxVQUFVLEdBQXZCO0lBWUU7UUFUQSxjQUFTLEdBQVksSUFBSSxhQUFPLEVBQUUsQ0FBQztRQUNuQyxjQUFTLEdBQVksSUFBSSxhQUFPLEVBQUUsQ0FBQztRQUNuQyxjQUFTLEdBQVksSUFBSSxhQUFPLEVBQUUsQ0FBQztRQUtuQyxnQkFBVyxHQUFzQyxFQUFFLENBQUM7UUE2RHBELGVBQVUsR0FBRyxLQUFLLEVBQUUsR0FBVyxFQUFFLEdBQVcsRUFBZ0MsRUFBRTtZQUM1RSxJQUFJLEdBQUcsQ0FBQyxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNwRCxPQUFPLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQU0sR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO2FBQy9EO1lBQ0QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUE7UUFFRCxtQkFBYyxHQUFjLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBTyxFQUFFO1lBQzVDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUE7UUFDakMsQ0FBQyxDQUFBO1FBbkVDLElBQUksQ0FBQyxHQUFHLEdBQUcsa0JBQVMsQ0FBQyxHQUFHLENBQUMsbUJBQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQyxJ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