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
        console.log(this.router.prettyPrint());
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
                key: helpers_1.epglue(constants_1.IN_INDEP, payload.params.name),
                // explicitly set content type because AJAX uses text/plain to avoid options request
                contentType: constants_1.CONTENT_TYPE_JSON,
                channel: constants_1.CHANNEL_HTTP_TRACK,
            };
        };
        const pixelHandler = function (payload) {
            return {
                params: payload.params,
                key: helpers_1.epglue(constants_1.IN_INDEP, payload.params.name),
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
                key: helpers_1.epglue(constants_1.IN_INDEP, payload.params.service, payload.params.name),
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
        // this.router.options('/track', optionsHandler);
        // this.router.options('/wh', optionsHandler);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlzdGVuZXJzL2h0dHBfcm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsbUNBQW9EO0FBQ3BELHlDQUF5QztBQUN6QywyQ0FBb0M7QUFDcEMsMENBQXNDO0FBQ3RDLDhDQXVCd0I7QUFRdkIsQ0FBQztBQWVELENBQUM7QUFlRjtJQU1FO1FBQ0UsSUFBSSxDQUFDLEdBQUcsR0FBRyxrQkFBUyxDQUFDLEdBQUcsQ0FBQyxtQkFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDdkMsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxZQUFZLEdBQUc7WUFDbEIsTUFBTSxFQUFFLEVBQUU7WUFDVixPQUFPLEVBQUUsQ0FBQyxPQUE4QixFQUFxQixFQUFFO2dCQUM3RCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO29CQUM1QixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07b0JBQ3RCLEdBQUcsRUFBRSx5QkFBYTtvQkFDbEIsT0FBTyxFQUFFLHdCQUFZO2lCQUN0QixDQUFDLENBQUM7WUFDTCxDQUFDO1NBQ0YsQ0FBQTtJQUNILENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQWdCO1FBQ3BCLE1BQU0sWUFBWSxHQUFnQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRixNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxD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