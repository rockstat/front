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
const FindMyWay = require("find-my-way");
const log_1 = require("@app/log");
const helpers_1 = require("@app/helpers");
const constants_1 = require("@app/constants");
;
;
;
let Router = class Router {
    constructor(logFactory) {
        this.log = logFactory.for(this);
        this.router = new FindMyWay();
        this.setupRoutes();
        console.log(this.router.prettyPrint());
        /** Default route (404) */
        this.defaultRoute = {
            params: {},
            handler: (payload) => {
                return Object.assign(payload, {
                    key: constants_1.PATH_HTTP_404,
                    status: constants_1.STATUS_NOT_FOUND
                });
            }
        };
    }
    /**
     * Find match route, execute and return result
     * @param {routeOn} Request params
     * @returns {RequestHandlerResult}
     */
    route(routeOn) {
        const matchedRoute = this.router.find(routeOn.method, routeOn.path);
        const useRoute = matchedRoute ? matchedRoute : this.defaultRoute;
        const payload = {
            params: useRoute.params,
            query: routeOn.query
        };
        return useRoute.handler(payload);
    }
    /**
     * Installing defaults routes
     */
    setupRoutes() {
        const optionsHandler = function (payload) {
            return {
                key: constants_1.PATH_HTTP_OPTS,
                status: constants_1.STATUS_OK_NO_CONTENT
            };
        };
        const trackHandler = function (payload) {
            return {
                key: helpers_1.epglue(constants_1.IN_TRACK, payload.query.name),
                contentType: constants_1.CONTENT_TYPE_JSON,
                status: constants_1.STATUS_OK
            };
        };
        const pixelHandler = function (payload) {
            return {
                key: helpers_1.epglue(constants_1.IN_PIXEL, payload.query.name),
                status: constants_1.STATUS_OK
            };
        };
        const redirHandler = function (payload) {
            return {
                params: payload.params,
                key: helpers_1.epglue(constants_1.IN_REDIR, payload.params.category, payload.params.name),
                status: constants_1.STATUS_TEMP_REDIR
            };
        };
        const webhookHandler = function (payload) {
            return {
                params: payload.params,
                channel: constants_1.CHANNEL_WEBHOOK,
                key: helpers_1.epglue(constants_1.IN_INDEP, payload.params.service, payload.params.name),
                status: constants_1.STATUS_OK
            };
        };
        const libjsHandler = function (payload) {
            return {
                key: constants_1.PATH_HTTP_LIBJS,
                status: constants_1.STATUS_OK
            };
        };
        this.router.get('/lib.js', libjsHandler);
        this.router.get('/img', pixelHandler);
        this.router.options('/track', optionsHandler);
        this.router.post('/track', trackHandler);
        this.router.options('/wh', optionsHandler);
        this.router.options('/webhook', optionsHandler);
        this.router.get('/wh/:service/:name', webhookHandler);
        this.router.post('/wh/:service/:name', webhookHandler);
        this.router.get('/webhook/:projectId/:service/:name', webhookHandler);
        this.router.post('/webhook/:projectId/:service/:name', webhookHandler);
        this.router.get('/redir/:projectId/:category/:name', redirHandler);
    }
};
Router = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [log_1.LogFactory])
], Router);
exports.Router = Router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlzdGVuZXJzL2h0dHBfcm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQ0EsbUNBQXlDO0FBQ3pDLHlDQUF5QztBQUN6QyxrQ0FBOEM7QUFDOUMsMENBQXNDO0FBQ3RDLDhDQWdCd0I7QUFrQnZCLENBQUM7QUFlRCxDQUFDO0FBU0QsQ0FBQztBQVlGLElBQWEsTUFBTSxHQUFuQjtJQU1FLFlBQVksVUFBc0I7UUFDaEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDdkMsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxZQUFZLEdBQUc7WUFDbEIsTUFBTSxFQUFFLEVBQUU7WUFDVixPQUFPLEVBQUUsQ0FBQyxPQUE4QixFQUFFLEVBQUU7Z0JBQzFDLE9BQTZCLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO29CQUNsRCxHQUFHLEVBQUUseUJBQWE7b0JBQ2xCLE1BQU0sRUFBRSw0QkFBZ0I7aUJBQ3pCLENBQUMsQ0FBQztZQUNMLENBQUM7U0FDRixDQUFBO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsT0FBZ0I7UUFDcEIsTUFBTSxZQUFZLEdBQWdCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pGLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJ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