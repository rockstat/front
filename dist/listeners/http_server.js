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
            // Handling CORS preflight request
            if (status === constants_1.STATUS_TEAPOT) {
                res.setHeader(constants_1.HMyName, this.title);
                res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_PLAIN);
                return micro_1.send(res, status, "I'm a teapot");
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
                if (handled.channel === constants_1.CHANNEL_PIXEL) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlzdGVuZXJzL2h0dHBfc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsK0JBQTZFO0FBQzdFLGlDQUF5RTtBQUN6RSxtQ0FBeUM7QUFDekMsNkJBQXdDO0FBQ3hDLGlDQUFpQztBQUNqQyxpQ0FBaUM7QUFDakMseUJBQXlCO0FBQ3pCLGtDQUE4QztBQUM5QyxrQ0FBeUU7QUFDekUsK0NBQStDO0FBQy9DLDhDQTJCd0I7QUFDeEIsMENBYXNCO0FBUXRCLDBDQUF1QztBQUN2QyxvREFBd0Q7QUFHeEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFxQixFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRSxNQUFNLFNBQVMsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztBQWlDcEMsSUFBYSxVQUFVLEdBQXZCO0lBMEJFLFlBQVksVUFBc0IsRUFBRSxVQUFzQjtRQUN4RCxJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDckMsSUFBSSxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQztRQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7UUFDcEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWhDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENB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