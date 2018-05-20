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
const StatsdClient = require("statsd-client");
const typedi_1 = require("typedi");
const lib_1 = require("@app/lib");
let StatsDMetrics = class StatsDMetrics {
    constructor(ch) {
        const config = ch.get('metrics').statsd;
        if (config) {
            this.client = new StatsdClient(config);
        }
        else {
            throw new Error('Statsd not configured');
        }
    }
    tick(metric, tags) {
        this.client.increment(metric, undefined, tags);
    }
    timenote(metric, tags) {
        const start = process.hrtime();
        return () => {
            const diff = process.hrtime(start);
            const time = Math.round(diff[0] * 1e3 + diff[1] * 1e-6);
            this.time(metric, time);
            return time;
        };
    }
    time(metric, duration, tags) {
        this.client.timing(metric, duration, tags);
    }
};
StatsDMetrics = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [lib_1.Configurer])
], StatsDMetrics);
exports.StatsDMetrics = StatsDMetrics;
