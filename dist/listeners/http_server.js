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
