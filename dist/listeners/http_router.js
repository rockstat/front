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
                    channel: constants_1.CHANNEL_HTTP,
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
        const teapotHandler = function (payload) {
            return {
                key: constants_1.PATH_HTTP_418,
                channel: constants_1.CHANNEL_HTTP,
                status: constants_1.STATUS_TEAPOT
            };
        };
        const optionsHandler = function (payload) {
            return {
                key: constants_1.PATH_HTTP_OPTS,
                channel: constants_1.CHANNEL_HTTP,
                status: constants_1.STATUS_OK_NO_CONTENT,
            };
        };
        const trackHandler = function (payload) {
            return {
                params: Object.assign({ service: constants_1.SERVICE_TRACK }, payload.params),
                key: helpers_1.epglue(constants_1.IN_INDEP, payload.params.name),
                // explicitly set content type because AJAX uses text/plain to avoid options request
                contentType: constants_1.CONTENT_TYPE_JSON,
                channel: constants_1.CHANNEL_HTTP_TRACK,
                status: constants_1.STATUS_OK
            };
        };
        const pixelHandler = function (payload) {
            return {
                params: payload.params,
                key: helpers_1.epglue(constants_1.IN_INDEP, payload.params.name),
                channel: constants_1.CHANNEL_HTTP_PIXEL,
                status: constants_1.STATUS_OK
            };
        };
        /**
         * example: http://127.0.0.1:10001/redir/111/a/b?to=https%3A%2F%2Fya.ru
         * @param payload {routeOn}
         */
        const redirHandler = function (payload) {
            return {
                params: payload.params,
                key: helpers_1.epglue(constants_1.IN_REDIR, payload.params.service, payload.params.name),
                location: payload.query.to,
                status: constants_1.STATUS_TEMP_REDIR,
                channel: constants_1.CHANNEL_HTTP_REDIR,
            };
        };
        const webhookHandler = function (payload) {
            return {
                params: payload.params,
                key: helpers_1.epglue(constants_1.IN_INDEP, payload.params.service, payload.params.name),
                channel: constants_1.CHANNEL_HTTP_WEBHOOK,
                status: constants_1.STATUS_OK
            };
        };
        const libjsHandler = function (payload) {
            return {
                key: constants_1.PATH_HTTP_LIBJS,
                channel: constants_1.CHANNEL_HTTP,
                status: constants_1.STATUS_OK
            };
        };
        this.router.options('/track', optionsHandler);
        this.router.options('/wh', optionsHandler);
        this.router.get('/coffee', teapotHandler);
        this.router.get('/lib.js', libjsHandler);
        this.router.get('/img/:projectId/:service/:name', pixelHandler);
        this.router.get('/redir/:projectId/:service/:name', redirHandler);
        this.router.get('/wh/:projectId/:service/:name', webhookHandler);
        this.router.post('/wh/:projectId/:service/:name', webhookHandler);
        this.router.post('/track/:projectId/:name', trackHandler);
    }
};
Router = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [log_1.LogFactory])
], Router);
exports.Router = Router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlzdGVuZXJzL2h0dHBfcm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQ0EsbUNBQXlDO0FBQ3pDLHlDQUF5QztBQUN6QyxrQ0FBOEM7QUFDOUMsMENBQXNDO0FBQ3RDLDhDQXNCd0I7QUFpQnZCLENBQUM7QUFlRCxDQUFDO0FBU0QsQ0FBQztBQVlGLElBQWEsTUFBTSxHQUFuQjtJQU1FLFlBQVksVUFBc0I7UUFDaEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDdkMsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxZQUFZLEdBQUc7WUFDbEIsTUFBTSxFQUFFLEVBQUU7WUFDVixPQUFPLEVBQUUsQ0FBQyxPQUE4QixFQUFFLEVBQUU7Z0JBQzFDLE9BQTZCLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO29CQUNsRCxHQUFHLEVBQUUseUJBQWE7b0JBQ2xCLE9BQU8sRUFBRSx3QkFBWTtvQkFDckIsTUFBTSxFQUFFLDRCQUFnQjtpQkFDekIsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztTQUNGLENBQUE7SUFDSCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxPQUFnQjtRQUNwQixNQUFNLFlBQVksR0FBZ0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakYsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FB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