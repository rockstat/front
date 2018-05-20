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
        const teapotHandler = function (payload) {
            return {
                key: constants_1.PATH_HTTP_418,
                status: constants_1.STATUS_TEAPOT
            };
        };
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
                key: helpers_1.epglue(constants_1.IN_INDEP, payload.params.name),
                channel: constants_1.CHANNEL_PIXEL,
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
                key: helpers_1.epglue(constants_1.IN_REDIR, payload.params.category, payload.params.name),
                status: constants_1.STATUS_TEMP_REDIR,
                location: payload.query.to
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
        this.router.get('/coffee', teapotHandler);
        this.router.get('/lib.js', libjsHandler);
        this.router.get('/img/:projectId/:service/:name', pixelHandler);
        this.router.get('/redir/:projectId/:category/:name', redirHandler);
        this.router.options('/track', optionsHandler);
        this.router.post('/track', trackHandler);
        this.router.options('/wh', optionsHandler);
        this.router.options('/webhook', optionsHandler);
        this.router.get('/wh/:service/:name', webhookHandler);
        this.router.post('/wh/:service/:name', webhookHandler);
        this.router.get('/webhook/:projectId/:service/:name', webhookHandler);
        this.router.post('/webhook/:projectId/:service/:name', webhookHandler);
    }
};
Router = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [log_1.LogFactory])
], Router);
exports.Router = Router;
