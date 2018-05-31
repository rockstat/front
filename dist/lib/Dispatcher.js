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
const redirect_1 = require("@app/lib/handlers/redirect");
let Dispatcher = class Dispatcher {
    constructor() {
        this.enrichBus = new lib_1.TreeBus();
        this.listenBus = new lib_1.TreeBus();
        this.handleBus = new lib_1.FlatBus();
        this.rpcHandlers = {};
        this.rpcGateway = async (key, msg) => {
            if (msg.service && msg.name && this.rpcHandlers[key]) {
                const res = await this.rpc.request(msg.service, msg.name, msg);
                if (res.code && typeof res.code === 'number' && res.result) {
                    return res;
                }
                else {
                    return {
                        result: res,
                        code: constants_1.STATUS_OK
                    };
                }
            }
            return this.defaultHandler(key, msg);
        };
        this.defaultHandler = async (key, msg) => {
            return {
                code: constants_1.STATUS_OK,
                result: {
                    key: key,
                    id: msg.id
                }
            };
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
        this.handleBus.handle(constants_1.IN_REDIR, redirect_1.baseRedirect);
        // notify band director
        setImmediate(() => {
            this.rpc.notify(constants_1.SERVICE_DIRECTOR, constants_1.RPC_IAMALIVE, { name: constants_1.SERVICE_FRONTIER });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvRGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLG1DQUFvRDtBQWNwRCxrQ0FHaUI7QUFDakIsOENBWXdCO0FBQ3hCLDBDQUdzQjtBQUN0QiwyQ0FTb0I7QUFDcEIseURBQTBEO0FBRzFELElBQWEsVUFBVSxHQUF2QjtJQVlFO1FBVEEsY0FBUyxHQUFZLElBQUksYUFBTyxFQUFFLENBQUM7UUFDbkMsY0FBUyxHQUFZLElBQUksYUFBTyxFQUFFLENBQUM7UUFDbkMsY0FBUyxHQUFZLElBQUksYUFBTyxFQUFFLENBQUM7UUFLbkMsZ0JBQVcsR0FBc0MsRUFBRSxDQUFDO1FBNkRwRCxlQUFVLEdBQUcsS0FBSyxFQUFFLEdBQVcsRUFBRSxHQUF3QixFQUEyQixFQUFFO1lBQ3BGLElBQUksR0FBRyxDQUFDLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3BELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQWtCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDaEYsSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRTtvQkFDMUQsT0FBTyxHQUFxQixDQUFDO2lCQUM5QjtxQkFBTTtvQkFDTCxPQUFPO3dCQUNMLE1BQU0sRUFBRSxHQUFHO3dCQUNYLElBQUksRUFBRSxxQkFBUztxQkFDaEIsQ0FBQTtpQkFDRjthQUNGO1lBQ0QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUE7UUFFRCxtQkFB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