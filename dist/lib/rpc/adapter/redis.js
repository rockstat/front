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
const EventEmitter = require("eventemitter3");
const redis_1 = require("@app/lib/redis");
const class_1 = require("@app/helpers/class");
const log_1 = require("@app/log");
const lib_1 = require("@app/lib");
let RPCAdapterRedis = class RPCAdapterRedis extends EventEmitter {
    constructor() {
        super(...arguments);
        this.receiver = (data) => {
            throw new Error('Adapter not attached');
        };
        this.redisMsg = (redismsg) => {
            if (redismsg[0] === 'message' || redismsg[0] === 'pmessage') {
                const raw = redismsg[redismsg.length - 1];
                this.log.debug('\n --> ', raw);
                const msg = this.decode(raw);
                if (msg && msg.jsonrpc === '2.0') {
                    this.receiver(msg);
                }
            }
            else {
                this.log.warn('unhandled cmd', redismsg);
            }
        };
    }
    setup(config) {
        class_1.handleSetup(this);
        this.log = this.logFactory.for(this);
        this.rsub = new redis_1.RedisClient();
        this.rsub.on('connect', () => {
            this.rsub.subscribe(config.name, this.redisMsg);
        });
        this.log.info('started');
        this.rpub = new redis_1.RedisClient();
    }
    setReceiver(obj, fname) {
        this.receiver = obj[fname];
    }
    decode(raw) {
        try {
            return JSON.parse(raw);
        }
        catch (error) {
            this.log.error('Redis decode payload error', error);
            return;
        }
    }
    encode(data) {
        try {
            return JSON.stringify(data);
        }
        catch (error) {
            this.log.error('Redis encode payload error', error);
            return;
        }
    }
    send(to, msg) {
        const raw = this.encode(msg);
        this.log.debug('\n <---', raw);
        this.rpub.publish(to, raw);
    }
};
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", log_1.LogFactory)
], RPCAdapterRedis.prototype, "logFactory", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.Configurer)
], RPCAdapterRedis.prototype, "config", void 0);
RPCAdapterRedis = __decorate([
    typedi_1.Service()
], RPCAdapterRedis);
exports.RPCAdapterRedis = RPCAdapterRedis;
