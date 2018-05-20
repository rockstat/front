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
const Redis = require("redis-fast-driver");
const lib_1 = require("@app/lib");
const log_1 = require("@app/log");
let RedisClient = class RedisClient {
    constructor() {
        this.started = false;
        this.on = (event, func) => {
            this.client.on(event, func);
        };
        const deps = this.log = typedi_1.default.get(log_1.LogFactory).for(this);
        this.options = typedi_1.default.get(lib_1.Configurer).get('redis');
        const { host, port, db } = this.options;
        this.log.info('Starting redis client. Server: %s:%s/%d', host, port, db);
        this.client = new Redis(this.options);
        //happen only once
        this.client.on('ready', () => {
            this.log.info('redis ready');
        });
        //happen each time when reconnected
        this.client.on('connect', () => {
            this.log.info('redis connected');
        });
        this.client.on('disconnect', () => {
            this.log.info('redis disconnected');
        });
        this.client.on('reconnecting', (num) => {
            this.log.info('redis reconnecting with attempt #' + num);
        });
        this.client.on('error', (e) => {
            this.log.info('redis error', e);
        });
        // called on an explicit end, or exhausted reconnections
        this.client.on('end', () => {
            this.log.info('redis closed');
        });
    }
    publish(topic, raw) {
        this.client.rawCall(['publish', topic, raw], (error, msg) => {
            if (error) {
                this.log.error('Redis publish error', error);
            }
        });
    }
    subscribe(channel, func) {
        this.client.rawCall(['subscribe', channel], (error, msg) => {
            if (error) {
                this.log.error('Redis error', error);
                return;
            }
            func(msg);
        });
    }
};
RedisClient = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], RedisClient);
exports.RedisClient = RedisClient;
