"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const FindMyWay = require("find-my-way");
const rockmets_1 = require("rockmets");
const helpers_1 = require("@app/helpers");
const constants_1 = require("@app/constants");
;
;
;
class Router {
    constructor() {
        this.log = typedi_1.Container.get(rockmets_1.Logger).for(this);
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
}
exports.Router = Router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlzdGVuZXJzL2h0dHBfcm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsbUNBQW9EO0FBQ3BELHlDQUF5QztBQUN6Qyx1Q0FBa0M7QUFDbEMsMENBQXNDO0FBQ3RDLDhDQXNCd0I7QUFpQnZCLENBQUM7QUFlRCxDQUFDO0FBU0QsQ0FBQztBQVdGO0lBTUU7UUFDRSxJQUFJLENBQUMsR0FBRyxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUN2QywwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLFlBQVksR0FBRztZQUNsQixNQUFNLEVBQUUsRUFBRTtZQUNWLE9BQU8sRUFBRSxDQUFDLE9BQThCLEVBQUUsRUFBRTtnQkFDMUMsT0FBNkIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7b0JBQ2xELEdBQUcsRUFBRSx5QkFBYTtvQkFDbEIsT0FBTyxFQUFFLHdCQUFZO29CQUNyQixNQUFNLEVBQUUsNEJBQWdCO2lCQUN6QixDQUFDLENBQUM7WUFDTCxDQUFDO1NBQ0YsQ0FBQTtJQUNILENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQWdCO1FBQ3BCLE1BQU0sWUFBWSxHQUFnQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRixNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FB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