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
require("reflect-metadata");
const typedi_1 = require("typedi");
const log_1 = require("@app/log");
const lib_1 = require("@app/lib");
const listeners_1 = require("@app/listeners");
let AppServer = class AppServer {
    setup() {
        this.log = this.logFactory.for(this);
        this.log.info('Starting Handler service');
        this.dispatcher.setup();
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
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", listeners_1.HttpServer)
], AppServer.prototype, "httpServer", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", listeners_1.WebSocketServer)
], AppServer.prototype, "wsServer", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.Dispatcher)
], AppServer.prototype, "dispatcher", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", log_1.LogFactory)
], AppServer.prototype, "logFactory", void 0);
AppServer = __decorate([
    typedi_1.Service()
], AppServer);
exports.AppServer = AppServer;
exports.appServer = typedi_1.Container.get(AppServer);
exports.appServer.setup();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwU2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0FwcFNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLDRCQUEwQjtBQUMxQixtQ0FBb0Q7QUFDcEQsa0NBQThDO0FBQzlDLGtDQUE2RDtBQUM3RCw4Q0FHd0I7QUFReEIsSUFBYSxTQUFTLEdBQXRCO0lBZ0JFLEtBQUs7UUFDSCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRUQsS0FBSztRQUNILElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFTyxjQUFjO1FBQ3BCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFFTyxNQUFNO1FBQ1osSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVPLGFBQWE7UUFDbkIsc0NBQXNDO1FBQ3RDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLG9CQUFvQjtRQUNwQixPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUMsc0JBQXNCO1FBQ3RCLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0NBRUYsQ0FBQTtBQTNDQztJQURDLGVBQU0sRUFBRTs4QkFDRyxzQkFBVTs2Q0FBQztBQUd2QjtJQURDLGVBQU0sRUFBRTs4QkFDQywyQkFBZTsyQ0FBQztBQUcxQjtJQURDLGVBQU0sRUFBRTs4QkFDRyxnQkFBVTs2Q0FBQztBQUd2QjtJQURDLGVBQU0sRUFBRTs4QkFDRyxnQkFBVTs2Q0FBQTtBQVpYLFNBQVM7SUFEckIsZ0JBQU8sRUFBRTtHQUNHLFNBQVMsQ0E4Q3JCO0FBOUNZLDhCQUFTO0FBZ0RULFFBQUEsU0FBUyxHQUFjLGtCQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzdELGlCQUFTLENBQUMsS0FBSyxFQUFFLENBQUEifQ==