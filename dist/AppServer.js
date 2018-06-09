"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typedi_1 = require("typedi");
const lib_1 = require("@app/lib");
const rock_me_ts_1 = require("rock-me-ts");
const listeners_1 = require("@app/listeners");
let AppServer = class AppServer {
    setup() {
        this.appConfig = new rock_me_ts_1.AppConfig();
        typedi_1.Container.set(rock_me_ts_1.AppConfig, this.appConfig);
        const log = new rock_me_ts_1.Logger(this.appConfig.log);
        typedi_1.Container.set(rock_me_ts_1.Logger, log);
        this.log = log.for(this);
        this.log.info('Starting service');
        typedi_1.Container.set(rock_me_ts_1.Meter, new rock_me_ts_1.Meter(this.appConfig.meter));
        typedi_1.Container.set(rock_me_ts_1.TheIds, new rock_me_ts_1.TheIds());
        const meter = this.meter = typedi_1.Container.get(rock_me_ts_1.Meter);
        typedi_1.Container.set(rock_me_ts_1.RedisFactory, new rock_me_ts_1.RedisFactory({ log, meter, ...this.appConfig.redis }));
        typedi_1.Container.set(lib_1.Dispatcher, new lib_1.Dispatcher());
        typedi_1.Container.set(listeners_1.HttpServer, new listeners_1.HttpServer());
        typedi_1.Container.set(listeners_1.WebSocketServer, new listeners_1.WebSocketServer());
        this.httpServer = typedi_1.Container.get(listeners_1.HttpServer);
        this.wsServer = typedi_1.Container.get(listeners_1.WebSocketServer);
        const dispatcher = this.dispatcher = typedi_1.Container.get(lib_1.Dispatcher);
        dispatcher.setup();
    }
    start() {
        this.dispatcher.start();
        this.startTransport();
    }
    startTransport() {
        this.log.info('Starting transports');
        this.httpServer.start();
        this.wsServer.start();
    }
    onStop() {
        this.log.info('Stopping...');
        process.exit(0);
    }
    attachSignals() {
        // Handles normal process termination.
        process.on('exit', () => this.onStop());
        // Handles `Ctrl+C`.
        process.on('SIGINT', () => this.onStop());
        // Handles `kill pid`.
        process.on('SIGTERM', () => this.onStop());
    }
};
AppServer = __decorate([
    typedi_1.Service()
], AppServer);
exports.AppServer = AppServer;
exports.appServer = typedi_1.Container.get(AppServer);
exports.appServer.setup();
//# sourceMappingURL=AppServer.js.map