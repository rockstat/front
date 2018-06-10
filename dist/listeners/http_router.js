"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const FindMyWay = require("find-my-way");
const rock_me_ts_1 = require("rock-me-ts");
const helpers_1 = require("@app/helpers");
const constants_1 = require("@app/constants");
;
;
class Router {
    constructor() {
        this.log = typedi_1.Container.get(rock_me_ts_1.Logger).for(this);
        this.router = new FindMyWay();
        this.setupRoutes();
        /** Default route (404) */
        this.defaultRoute = {
            params: {},
            handler: (payload) => {
                return Object.assign(payload, {
                    params: payload.params,
                    key: constants_1.PATH_HTTP_404,
                    channel: constants_1.CHANNEL_HTTP,
                });
            }
        };
    }
    /**
     * Find match route, execute and return result
     * @param {routeOn} Request params
     * @returns {HTTPRoutingResult}
     */
    route(routeOn) {
        const matchedRoute = this.router.find(routeOn.method, routeOn.path);
        const useRoute = matchedRoute ? matchedRoute : this.defaultRoute;
        const params = {
            service: useRoute.params.service || constants_1.OTHER,
            name: useRoute.params.name || constants_1.OTHER,
            projectId: useRoute.params.projectId && Number(useRoute.params.projectId) || 0
        };
        const payload = {
            params: params,
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
                params: payload.params,
                key: constants_1.PATH_HTTP_TEAPOT,
                channel: constants_1.CHANNEL_HTTP,
            };
        };
        const trackHandler = function (payload) {
            payload.params.service = constants_1.SERVICE_TRACK;
            return {
                params: payload.params,
                key: helpers_1.epglue(constants_1.IN_GENERIC, constants_1.SERVICE_TRACK, payload.params.name),
                // explicitly set content type because AJAX uses text/plain to avoid options request
                contentType: constants_1.CONTENT_TYPE_JSON,
                channel: constants_1.CHANNEL_HTTP_TRACK,
            };
        };
        const pixelHandler = function (payload) {
            return {
                params: payload.params,
                key: helpers_1.epglue(constants_1.IN_GENERIC, payload.params.service, payload.params.name),
                channel: constants_1.CHANNEL_HTTP_PIXEL,
            };
        };
        /**
         * example: http://127.0.0.1:10001/redir/111/a/b?to=https%3A%2F%2Fya.ru
         */
        const redirHandler = function (payload) {
            return {
                params: payload.params,
                key: helpers_1.epglue(constants_1.IN_REDIR, payload.params.service, payload.params.name),
                channel: constants_1.CHANNEL_HTTP_REDIR,
            };
        };
        const webhookHandler = function (payload) {
            return {
                params: payload.params,
                key: helpers_1.epglue(constants_1.IN_GENERIC, payload.params.service, payload.params.name),
                channel: constants_1.CHANNEL_HTTP_WEBHOOK,
            };
        };
        const libjsHandler = function (payload) {
            return {
                params: { service: constants_1.OTHER, name: constants_1.OTHER, projectId: 0 },
                key: constants_1.PATH_HTTP_LIBJS,
                channel: constants_1.CHANNEL_HTTP,
            };
        };
        this.registerRoute('get', '/coffee', teapotHandler);
        this.registerRoute('get', '/lib.js', libjsHandler);
        this.registerRoute('get', '/img/:projectId/:service/:name', pixelHandler);
        this.registerRoute('get', '/redir/:projectId/:service/:name', redirHandler);
        this.registerRoute('get', '/wh/:projectId/:service/:name', webhookHandler);
        this.registerRoute('post', '/wh/:projectId/:service/:name', webhookHandler);
        this.registerRoute('post', '/track/:projectId/:name', trackHandler);
    }
    registerRoute(method, path, handler) {
        this.log.info(`Registering route: ${path}`);
        this.router[method](path, handler);
    }
}
exports.Router = Router;
//# sourceMappingURL=http_router.js.map