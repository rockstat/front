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
const bus_1 = require("@app/bus");
const constants_1 = require("@app/constants");
const helpers_1 = require("@app/helpers");
const rock_me_ts_1 = require("rock-me-ts");
const handlers_1 = require("@app/handlers");
const getprop_1 = require("@app/helpers/getprop");
let Dispatcher = class Dispatcher {
    constructor() {
        this.enrichBus = new bus_1.TreeBus();
        this.remoteEnrichers = new bus_1.TreeNameBus();
        this.listenBus = new bus_1.TreeBus();
        this.handleBus = new bus_1.FlatBus();
        this.rpcHandlers = {};
        this.rpcEnrichers = {};
        this.propGetters = {};
        this.enrichersRequirements = [];
        this.rpcGateway = async (key, msg) => {
            if (msg.service && msg.name && this.rpcHandlers[key]) {
                // Real destination
                const [service, method] = this.rpcHandlers[key];
                return await this.rpc.request(service, method, msg);
            }
            return this.defaultHandler(key, msg);
        };
        this.defaultHandler = async (key, msg) => {
            return {
                key: key,
                id: msg.id
            };
        };
        this.log = typedi_1.Container.get(rock_me_ts_1.Logger).for(this);
        this.log.info('Starting');
        this.appConfig = typedi_1.Container.get(rock_me_ts_1.AppConfig);
        this.idGen = typedi_1.Container.get(rock_me_ts_1.TheIds);
    }
    /**
     * Initial asynchronous setup
     */
    setup() {
        this.handleBus.setNoneHdr(this.defaultHandler);
        // Core deps
        const redisFactory = typedi_1.Container.get(rock_me_ts_1.RedisFactory);
        // Stat meter
        const meter = typedi_1.Container.get(rock_me_ts_1.Meter);
        // Setup RPC
        const channels = [this.appConfig.rpc.name];
        const rpcOptions = { channels, redisFactory, log: this.log, meter, ...this.appConfig.rpc };
        const rpcAdaptor = new rock_me_ts_1.RPCAdapterRedis(rpcOptions);
        this.rpc = new rock_me_ts_1.RPCAgnostic(rpcOptions);
        this.rpc.setup(rpcAdaptor);
        // Registering status handler / payload receiver
        this.rpc.register(rock_me_ts_1.METHOD_STATUS, async (data) => {
            if (data.register) {
                const updateHdrs = [];
                const newReqs = [];
                for (const row of data.register) {
                    const { service, method, options } = row;
                    const route = { service, method };
                    if (options && options.alias) {
                        route.service = options.alias;
                    }
                    const bindToKey = helpers_1.epglue(constants_1.IN_GENERIC, route.service, route.method);
                    if (row.role === 'handler') {
                        this.rpcHandlers[bindToKey] = [service, method];
                        updateHdrs.push(bindToKey);
                    }
                    if (row.role === 'enricher' && options && Array.isArray(options.keys)) {
                        this.propGetters[service] = getprop_1.dotPropGetter(options.props || {});
                        // Handling enrichments data selection
                        if (options.props) {
                            for (const [k, v] of Object.entries(options.props)) {
                                newReqs.push([k, v]);
                            }
                        }
                        this.remoteEnrichers.subscribe(options.keys, service);
                    }
                }
                this.enrichersRequirements = newReqs;
                this.handleBus.replace(updateHdrs, this.rpcGateway);
            }
            return {};
        });
        ;
        // Default redirect handler
        this.handleBus.handle(constants_1.IN_REDIR, handlers_1.baseRedirect);
        // notify band director
        setImmediate(() => {
            this.rpc.notify(constants_1.SERVICE_DIRECTOR, constants_1.RPC_IAMALIVE, { name: constants_1.SERVICE_FRONTIER });
        });
        // Registering remote listeners notification
        this.listenBus.subscribe('*', async (key, msg) => {
            try {
                return await this.rpc.notify(constants_1.BROADCAST, constants_1.BROADCAST, msg);
            }
            catch (error) {
                this.log.error(`catch! ${error.message}`);
            }
        });
        // Registering remote enrichers notification
        this.enrichBus.subscribe('*', async (key, msg) => {
            try {
                const smallMsg = getprop_1.getvals(msg, this.enrichersRequirements);
                return await this.rpc.request(constants_1.ENRICH, constants_1.ENRICH, smallMsg, this.remoteEnrichers.simulate(key));
            }
            catch (error) {
                this.log.error(`catch! ${error.message}`);
            }
        });
    }
    start() {
        this.log.info('Started');
    }
    registerListener(key, func) {
        this.log.info(`Registering subscriber for ${key}`);
        this.listenBus.subscribe(key, func);
    }
    async dispatch(key, msg) {
        try {
            return await this.emit(key, msg);
        }
        catch (error) {
            this.log.warn(error);
            return {
                error: 'Internal error. Smth wrong.',
                code: constants_1.STATUS_INT_ERROR
            };
        }
    }
    async emit(key, msg) {
        this.log.debug(` -> ${key}`);
        msg.id = this.idGen.flake();
        msg.time = Number(new Date());
        // ### Phase 1: enriching
        const enrichments = await this.enrichBus.publish(key, msg);
        if (enrichments.length && msg.data) {
            Object.assign(msg.data, ...enrichments);
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
//# sourceMappingURL=Dispatcher.js.map