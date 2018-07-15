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
    constructor(options) {
        this.router = new FindMyWay();
        this.serviceMap = options.channels;
        this.customRoutes = options.routes;
        this.log = typedi_1.Container.get(rock_me_ts_1.Logger).for(this);
        this.metrics = typedi_1.Container.get(rock_me_ts_1.Meter);
        this.setupRoutes();
        // Default route (404)
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
        const teapotHandler = (payload) => {
            return {
                params: payload.params,
                key: constants_1.PATH_HTTP_TEAPOT,
                channel: constants_1.CHANNEL_HTTP,
            };
        };
        // const pixelHandler: RequestHandler = (payload) => {
        //   this.metrics.tick('request.pixel');
        //   return {
        //     params: payload.params,
        //     key: epglue(IN_GENERIC, payload.params.service, payload.params.name),
        //     channel: CHANNEL_HTTP_PIXEL,
        //   };
        // };
        // /**
        //  * example: http://127.0.0.1:10001/redir/111/a/b?to=https%3A%2F%2Fya.ru
        //  */
        // const redirHandler: RequestHandler = (payload) => {
        //   this.metrics.tick('request.redir');
        //   return {
        //     params: payload.params,
        //     key: epglue(IN_REDIR, payload.params.service, payload.params.name),
        //     channel: CHANNEL_HTTP_REDIR,
        //   };
        // };
        // const webhookHandler: RequestHandler = (payload) => {
        //   this.metrics.tick('request.wh');
        //   return {
        //     params: payload.params,
        //     key: epglue(IN_GENERIC, payload.params.service, payload.params.name),
        //     channel: CHANNEL_HTTP_WEBHOOK,
        //   };
        // };
        const libjsHandler = (payload) => {
            this.metrics.tick('request.jslib');
            return {
                params: { service: constants_1.OTHER, name: constants_1.OTHER, projectId: 0 },
                key: constants_1.PATH_HTTP_LIBJS,
                channel: constants_1.CHANNEL_HTTP,
            };
        };
        const genericHandler = (payload) => {
            this.metrics.tick('request.generic');
            const { service, name } = payload.params;
            const msgChannel = this.serviceMap[service] !== undefined
                ? this.serviceMap[service]
                : constants_1.CHANNEL_HTTP;
            const routeChannel = msgChannel === constants_1.CHANNEL_HTTP_REDIR
                ? constants_1.IN_REDIR
                : constants_1.IN_GENERIC;
            return {
                params: payload.params,
                key: helpers_1.epglue(routeChannel, service, name),
                channel: msgChannel,
            };
        };
        this.registerRoute('get', `/coffee`, teapotHandler);
        this.registerRoute('get', `/lib.js`, libjsHandler);
        this.registerRoute('get', `/:service/:name`, genericHandler);
        this.registerRoute('get', `/:service/:name/:projectId`, genericHandler);
        this.registerRoute('post', `/:service/:name`, genericHandler);
        this.registerRoute('post', `/:service/:name/:projectId`, genericHandler);
        if (this.customRoutes) {
            for (const [method, path] of this.customRoutes) {
                this.registerRoute(method, path, genericHandler);
            }
        }
    }
    registerRoute(method, path, handler) {
        this.log.info(`Registering route: ${path}`);
        this.router[method](path, handler);
    }
}
exports.Router = Router;
//# sourceMappingURL=http_router.js.map