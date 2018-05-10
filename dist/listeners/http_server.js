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
        this.identopts = configurer.identify;
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
        this.log.info('Starting HTTP transport');
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
            // uid
            const uid = query[this.identopts.param] || cookies[this.identopts.param] || this.identifier.userId();
            // transport data to store
            const { remoteAddress } = req.connection;
            const transportData = {
                ip: f(realIp) || remoteAddress || '127.0.0.1',
                userAgent: f(userAgent) || 'Unknown',
                uid: uid
            };
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
            const userIdCookie = cookie.serialize(this.identopts.param, transportData.uid, {
                httpOnly: true,
                expires: this.cookieExpires
            });
            // Processing routes
            const handled = this.router.route(routeOn);
            const { status } = handled;
            // Handling CORS preflight request
            if (status === constants_1.STATUS_OK_NO_CONTENT && routeOn.method === constants_1.METHOD_OPTIONS) {
                helpers_1.applyHeaders(res, helpers_1.corsHeaders(routeOn.origin), helpers_1.corsAnswerHeaders(), 
                // additional params for caching responces
                helpers_1.corsAdditionalHeaders());
                return micro_1.send(res, status);
            }
            if (status === constants_1.STATUS_OK || status === constants_1.STATUS_TEMP_REDIR) {
                // Regular response headers
                helpers_1.applyHeaders(res, helpers_1.corsHeaders(routeOn.origin), helpers_1.noCacheHeaders(), helpers_1.cookieHeaders([userIdCookie]));
                // Parse body if needed
                const body = (routeOn.method === constants_1.METHOD_POST)
                    ? await this.parseBody(handled.contentType || routeOn.contentType, req)
                    : undefined;
                // Final final message
                const msg = Object.assign({}, body, routeOn.query, handled.params, {
                    key: handled.key,
                    proto: transportData
                });
                // Running enrichers, subscribers, handler
                let response = await this.dispatcher.emit(handled.key, msg);
                // Processing redirect
                if (helpers_2.epchild(constants_1.CHANNEL_REDIR, handled.key) && handled.location) {
                    res.setHeader(constants_1.HLocation, handled.location);
                }
                // Processing JS client lib
                if (handled.key === constants_1.PATH_HTTP_LIBJS) {
                    res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_JS);
                    response = this.browserLib.prepare(Object.assign({ initialUid: uid }, this.clientopts));
                }
                if (helpers_2.epchild(constants_1.IN_PIXEL, handled.key)) {
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
], HttpServer.prototype, "identifier", void 0);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlzdGVuZXJzL2h0dHBfc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsK0JBQTZFO0FBQzdFLGlDQUF5RTtBQUN6RSxtQ0FBeUM7QUFDekMsNkJBQXdDO0FBQ3hDLGlDQUFpQztBQUNqQyxpQ0FBaUM7QUFDakMseUJBQXlCO0FBQ3pCLGtDQUE4QztBQUM5QyxrQ0FBeUU7QUFDekUsK0NBQStDO0FBQy9DLDhDQXdCd0I7QUFDeEIsMENBYXNCO0FBUXRCLDBDQUF1QztBQUN2QyxvREFBd0Q7QUFHeEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFxQixFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRSxNQUFNLFNBQVMsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztBQWlDcEMsSUFBYSxVQUFVLEdBQXZCO0lBeUJFLFlBQVksVUFBc0IsRUFBRSxVQUFzQjtRQUN4RCxJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDckMsSUFBSSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDO1FBQ3JDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztRQUNwQyxJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFaEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFRDs7OztPQUlH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