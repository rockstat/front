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
const index_1 = require("@app/log/index");
const lib_1 = require("@app/lib");
const listeners_1 = require("@app/listeners");
const statsd_1 = require("@app/lib/metrics/statsd");
let CoreDeps = class CoreDeps {
};
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.Configurer)
], CoreDeps.prototype, "config", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", index_1.LogFactory)
], CoreDeps.prototype, "logger", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", statsd_1.StatsDMetrics)
], CoreDeps.prototype, "metrics", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.IdService)
], CoreDeps.prototype, "identifier", void 0);
CoreDeps = __decorate([
    typedi_1.Service()
], CoreDeps);
exports.CoreDeps = CoreDeps;
let AppServer = class AppServer {
    initialize() {
        this.log = this.logFactory.for(this);
        this.log.info('Starting Handler service');
        this.dispatcher.setup();
    }
    start() {
        this.dispatcher.start();
        exports.handlerService.startTransport();
    }
    startTransport() {
        this.log.info('Starting transports');
        this.httpServer.start();
        this.wsServer.start();
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
    __metadata("design:type", index_1.LogFactory)
], AppServer.prototype, "logFactory", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.Dispatcher)
], AppServer.prototype, "dispatcher", void 0);
AppServer = __decorate([
    typedi_1.Service()
], AppServer);
exports.AppServer = AppServer;
exports.handlerService = typedi_1.Container.get(AppServer);
exports.handlerService.initialize();
exports.handlerService.start();
exports.deps = typedi_1.Container.get(CoreDeps);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwU2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0FwcFNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLDRCQUEwQjtBQUMxQixtQ0FBb0Q7QUFDcEQsMENBQW9EO0FBQ3BELGtDQUE2RDtBQUU3RCw4Q0FHd0I7QUFJeEIsb0RBQXdEO0FBR3hELElBQWEsUUFBUSxHQUFyQjtDQVNDLENBQUE7QUFQQztJQURDLGVBQU0sRUFBRTs4QkFDRCxnQkFBVTt3Q0FBQztBQUVuQjtJQURDLGVBQU0sRUFBRTs4QkFDRCxrQkFBVTt3Q0FBQztBQUVuQjtJQURDLGVBQU0sRUFBRTs4QkFDQSxzQkFBYTt5Q0FBQTtBQUV0QjtJQURDLGVBQU0sRUFBRTs4QkFDRyxlQUFTOzRDQUFDO0FBUlgsUUFBUTtJQURwQixnQkFBTyxFQUFFO0dBQ0csUUFBUSxDQVNwQjtBQVRZLDRCQUFRO0FBYXJCLElBQWEsU0FBUyxHQUF0QjtJQWdCRSxVQUFVO1FBQ1IsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3hCLHNCQUFjLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELGNBQWM7UUFDWixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN4QixDQUFDO0NBQ0YsQ0FBQTtBQTdCQztJQURDLGVBQU0sRUFBRTs4QkFDRyxzQkFBVTs2Q0FBQztBQUd2QjtJQURDLGVBQU0sRUFBRTs4QkFDQywyQkFBZTsyQ0FBQztBQUcxQjtJQURDLGVBQU0sRUFBRTs4QkFDRyxrQkFBVTs2Q0FBQztBQUd2QjtJQURDLGVBQU0sRUFBRTs4QkFDRyxnQkFBVTs2Q0FBQztBQVpaLFNBQVM7SUFEckIsZ0JBQU8sRUFBRTtHQUNHLFNBQVMsQ0FnQ3JCO0FBaENZLDhCQUFTO0FBa0NULFFBQUEsY0FBYyxHQUFjLGtCQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2xFLHNCQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDNUIsc0JBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNWLFFBQUEsSUFBSSxHQUFhLGtCQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDIn0=