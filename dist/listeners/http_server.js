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
const http_1 = require("http");
const micro_1 = require("micro");
const typedi_1 = require("typedi");
const url_1 = require("url");
const assert = require("assert");
const cookie = require("cookie");
const qs = require("qs");
const log_1 = require("@app/log");
const lib_1 = require("@app/lib");
const http_router_1 = require("./http_router");
const constants_1 = require("@app/constants");
const helpers_1 = require("@app/helpers");
const helpers_2 = require("@app/helpers");
const statsd_1 = require("@app/lib/metrics/statsd");
const f = (i) => Array.isArray(i) ? i[0] : i;
const parseOpts = { limit: '50kb' };
let HttpServer = class HttpServer {
    constructor(logFactory, configurer) {
        this.options = configurer.httpConfig;
        this.title = configurer.get('name');
        this.identopts = configurer.identify;
        this.uidkey = this.identopts.param;
        this.clientopts = configurer.client;
        this.log = logFactory.for(this);
        this.cookieExpires = new Date(new Date().getTime() + this.identopts.cookieMaxAge * 1000);
    }
    /**
     * Helper for parse body when not GET request
     * @param routeOn
     * @param req
     */
    async parseBody(contentType, req) {
        if (contentType.indexOf('json') >= 0) {
            return await micro_1.json(req, parseOpts);
        }
        const body = await micro_1.text(req, parseOpts);
        return helpers_1.parseQuery(body);
    }
    /**
     * Start listening
     */
    start() {
        const { host, port } = this.options;
        this.log.info('Starting HTTP transport %s:%s', host, port);
        this.httpServer = http_1.createServer((req, res) => {
            this.handle(req, res);
        });
        this.httpServer.listen(this.options.port, this.options.host);
    }
    /**
     * Main request handler
     * @param req
     * @param res
     */
    async handle(req, res) {
        try {
            const requestTime = this.metrics.timenote('http.request');
            assert(typeof req.url === 'string', 'Request url required');
            assert(typeof req.method === 'string', 'Request method required');
            // extracting useful headers
            const { 'user-agent': userAgent, 'content-type': contentType, 'x-real-ip': realIp, 'x-forwarded-for': forwardedFor, origin, referer } = req.headers;
            // parsing url
            const urlParts = url_1.parse(req.url || '');
            const query = urlParts.query ? qs.parse(urlParts.query) : {};
            // parse cookie
            const cookies = cookie.parse(f(req.headers.cookie) || '');
            // transportData.ip = '82.202.204.194';
            // transportData.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36'
            // Data for routing request
            const routeOn = {
                method: req.method || 'unknown',
                contentType: contentType || constants_1.CONTENT_TYPE_PLAIN,
                query: helpers_1.parseQuery(urlParts.query || ''),
                path: urlParts.pathname || '/',
                origin: helpers_1.computeOrigin(origin, referer)
            };
            // HTTP Routing
            // ####################################################
            const handled = this.router.route(routeOn);
            const { status } = handled;
            // ### CORS preflight // Early Response
            if (status === constants_1.STATUS_OK_NO_CONTENT && routeOn.method === constants_1.METHOD_OPTIONS) {
                helpers_1.applyHeaders(res, helpers_1.corsHeaders(routeOn.origin), helpers_1.corsAnswerHeaders(), 
                // additional params for caching responces
                helpers_1.corsAdditionalHeaders());
                return micro_1.send(res, status);
            }
            // ### Teapot // Early Response
            if (status === constants_1.STATUS_TEAPOT) {
                res.setHeader(constants_1.HMyName, this.title);
                res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_PLAIN);
                return micro_1.send(res, status, "I'm a teapot");
            }
            if (status === constants_1.STATUS_OK || status === constants_1.STATUS_TEMP_REDIR) {
                // Handling POST if routed right way!
                const body = (routeOn.method === constants_1.METHOD_POST)
                    ? await this.parseBody(handled.contentType || routeOn.contentType, req)
                    : {};
                // Looking for uid
                const uid = query[this.uidkey] || body[this.uidkey] || cookies[this.uidkey] || this.idGen.userId();
                // transport data to store
                const { remoteAddress } = req.connection;
                const transportData = {
                    ip: f(realIp) || remoteAddress || '127.0.0.1',
                    userAgent: f(userAgent) || 'Unknown',
                    uid: uid
                };
                // Final final message
                const msg = Object.assign({}, body, routeOn.query, handled.params, {
                    key: handled.key,
                    channel: handled.channel,
                    proto: transportData
                });
                // Dispatching: Running enrichers, subscribers, handler
                // ####################################################
                let response = await this.dispatcher.emit(handled.key, msg);
                // Constructing response
                // ####################################################
                const userIdCookie = cookie.serialize(this.identopts.param, transportData.uid, {
                    httpOnly: true,
                    expires: this.cookieExpires
                });
                // Regular response headers
                helpers_1.applyHeaders(res, helpers_1.corsHeaders(routeOn.origin), helpers_1.noCacheHeaders(), helpers_1.cookieHeaders([userIdCookie]));
                // Processing redirect
                if (helpers_2.epchild(constants_1.IN_REDIR, handled.key) && handled.location) {
                    res.setHeader(constants_1.HLocation, handled.location);
                    res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_PLAIN);
                    response = 'Redirecting...';
                }
                // Processing JS client lib
                if (handled.key === constants_1.PATH_HTTP_LIBJS) {
                    res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_JS);
                    response = this.browserLib.prepare(Object.assign({ initialUid: uid }, this.clientopts));
                }
                if (handled.channel === constants_1.CHANNEL_HTTP_PIXEL) {
                    res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_GIF);
                    response = helpers_1.emptyGif;
                }
                const reqTime = requestTime();
                res.setHeader(constants_1.HResponseTime, reqTime);
                micro_1.send(res, handled.status, response);
            }
            else {
                micro_1.send(res, handled.status || constants_1.STATUS_BAD_REQUEST, String(handled.status));
            }
        }
        catch (error) {
            this.log.error(error, 'Error during request handling');
            micro_1.send(res, constants_1.STATUS_INT_ERROR, {} || {});
        }
    }
};
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", http_router_1.Router)
], HttpServer.prototype, "router", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.Dispatcher)
], HttpServer.prototype, "dispatcher", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.IdService)
], HttpServer.prototype, "idGen", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.BrowserLib)
], HttpServer.prototype, "browserLib", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", statsd_1.StatsDMetrics)
], HttpServer.prototype, "metrics", void 0);
HttpServer = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [log_1.LogFactory, lib_1.Configurer])
], HttpServer);
exports.HttpServer = HttpServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlzdGVuZXJzL2h0dHBfc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsK0JBQTZFO0FBQzdFLGlDQUF5RTtBQUN6RSxtQ0FBeUM7QUFDekMsNkJBQXdDO0FBQ3hDLGlDQUFpQztBQUNqQyxpQ0FBaUM7QUFDakMseUJBQXlCO0FBQ3pCLGtDQUE4QztBQUM5QyxrQ0FBeUU7QUFDekUsK0NBQStDO0FBQy9DLDhDQTJCd0I7QUFDeEIsMENBYXNCO0FBUXRCLDBDQUF1QztBQUN2QyxvREFBd0Q7QUFHeEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFxQixFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRSxNQUFNLFNBQVMsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztBQWlDcEMsSUFBYSxVQUFVLEdBQXZCO0lBMkJFLFlBQVksVUFBc0IsRUFBRSxVQUFzQjtRQUN4RCxJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDckMsSUFBSSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQztRQUNyQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1FBQ25DLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztRQUNwQyxJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFaEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJ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