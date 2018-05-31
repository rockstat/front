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
        typedi_1.Container.set(rock_me_ts_1.AppConfig, new rock_me_ts_1.AppConfig());
        this.appConfig = typedi_1.Container.get(rock_me_ts_1.AppConfig);
        typedi_1.Container.set(rock_me_ts_1.Logger, new rock_me_ts_1.Logger(this.appConfig.log));
        const log = typedi_1.Container.get(rock_me_ts_1.Logger);
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
    }
    attachSignals() {
        // Handles normal process termination.
        process.on('exit', () => this.onStop());
        // Handles `Ctrl+C`.
        process.on('SIGINT', () => process.exit(0));
        // Handles `kill pid`.
        process.on('SIGTERM', () => process.exit(0));
    }
};
AppServer = __decorate([
    typedi_1.Service()
], AppServer);
exports.AppServer = AppServer;
exports.appServer = typedi_1.Container.get(AppServer);
exports.appServer.setup();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwU2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0FwcFNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLDRCQUEwQjtBQUMxQixtQ0FBb0Q7QUFDcEQsa0NBQXNDO0FBQ3RDLDJDQUE0RTtBQUM1RSw4Q0FHd0I7QUFLeEIsSUFBYSxTQUFTLEdBQXRCO0lBU0UsS0FBSztRQUNILGtCQUFTLENBQUMsR0FBRyxDQUFDLHNCQUFTLEVBQUUsSUFBSSxzQkFBUyxFQUFrQixDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxrQkFBUyxDQUFDLEdBQUcsQ0FBQyxzQkFBUyxDQUFDLENBQUM7UUFDMUMsa0JBQVMsQ0FBQyxHQUFHLENBQUMsbUJBQU0sRUFBRSxJQUFJLG1CQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sR0FBRyxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLG1CQUFNLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFekIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUVsQyxrQkFBUyxDQUFDLEdBQUcsQ0FBQyxrQkFBSyxFQUFFLElBQUksa0JBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEQsa0JBQVMsQ0FBQyxHQUFHLENBQUMsbUJBQU0sRUFBRSxJQUFJLG1CQUFNLEVBQUUsQ0FBQyxDQUFDO1FBRXBDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsa0JBQVMsQ0FBQyxHQUFHLENBQUMsa0JBQUssQ0FBQyxDQUFDO1FBRWhELGtCQUFTLENBQUMsR0FBRyxDQUFDLHlCQUFZLEVBQUUsSUFBSSx5QkFBWSxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZGLGtCQUFTLENBQUMsR0FBRyxDQUFDLGdCQUFVLEVBQUUsSUFBSSxnQkFBVSxFQUFFLENBQUMsQ0FBQztRQUM1QyxrQkFBUyxDQUFDLEdBQUcsQ0FBQyxzQkFBVSxFQUFFLElBQUksc0JBQVUsRUFBRSxDQUFDLENBQUM7UUFDNUMsa0JBQVMsQ0FBQyxHQUFHLENBQUMsMkJBQWUsRUFBRSxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1FBRXRELElBQUksQ0FBQyxVQUFVLEdBQUcsa0JBQVMsQ0FBQyxHQUFHLENBQUMsc0JBQVUsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxRQUFRLEdBQUcsa0JBQVMsQ0FBQyxHQUFHLENBQUMsMkJBQWUsQ0FBQyxDQUFDO1FBRS9DLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsa0JBQVMsQ0FBQyxHQUFHLENBQUMsZ0JBQVUsQ0FBQyxDQUFDO1FBQy9ELFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRUQsS0FBSztRQUNILElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFTyxjQUFjO1FBQ3BCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFTyxNQUFNO1FBQ1osSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVPLGFBQWE7UUFDbkIsc0NBQXNDO1FBQ3RDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLG9CQUFvQjtRQUNwQixPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUMsc0JBQXNCO1FBQ3RCLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0NBRUYsQ0FBQTtBQTNEWSxTQUFTO0lBRHJCLGdCQUFPLEVBQUU7R0FDRyxTQUFTLENBMkRyQjtBQTNEWSw4QkFBUztBQTZEVCxRQUFBLFNBQVMsR0FBYyxrQkFBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM3RCxpQkFBUyxDQUFDLEtBQUssRUFBRSxDQUFBIn0=