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
const rockmets_1 = require("rockmets");
const lib_1 = require("@app/lib");
const http_router_1 = require("./http_router");
const constants_1 = require("@app/constants");
const helpers_1 = require("@app/helpers");
const helpers_2 = require("@app/helpers");
const f = (i) => Array.isArray(i) ? i[0] : i;
const parseOpts = { limit: '50kb' };
let HttpServer = class HttpServer {
    constructor() {
        const config = typedi_1.Container.get(rockmets_1.AppConfig);
        const logger = typedi_1.Container.get(rockmets_1.Logger);
        this.metrics = typedi_1.Container.get(rockmets_1.Meter);
        this.idGen = typedi_1.Container.get(rockmets_1.TheIds);
        this.dispatcher = typedi_1.Container.get(lib_1.Dispatcher);
        this.router = typedi_1.Container.get(http_router_1.Router);
        this.browserLib = typedi_1.Container.get(lib_1.BrowserLib);
        this.options = config.http;
        this.title = config.get('name');
        this.identopts = config.identify;
        this.uidkey = this.identopts.param;
        this.clientopts = config.client.common;
        this.log = logger.for(this);
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
                const uid = query[this.uidkey] || body[this.uidkey] || cookies[this.uidkey] || this.idGen.flake();
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
HttpServer = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], HttpServer);
exports.HttpServer = HttpServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlzdGVuZXJzL2h0dHBfc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsK0JBQTZFO0FBQzdFLGlDQUF5RTtBQUN6RSxtQ0FBb0Q7QUFDcEQsNkJBQXdDO0FBQ3hDLGlDQUFpQztBQUNqQyxpQ0FBaUM7QUFDakMseUJBQXlCO0FBQ3pCLHVDQUE0RDtBQUM1RCxrQ0FBa0Q7QUFDbEQsK0NBQStDO0FBQy9DLDhDQTJCd0I7QUFDeEIsMENBYXNCO0FBU3RCLDBDQUF1QztBQUd2QyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQXFCLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLE1BQU0sU0FBUyxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBaUNwQyxJQUFhLFVBQVUsR0FBdkI7SUFpQkU7UUFDRSxNQUFNLE1BQU0sR0FBRyxrQkFBUyxDQUFDLEdBQUcsQ0FBMEIsb0JBQVMsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sTUFBTSxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFNLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLGdCQUFLLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsS0FBSyxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLGlCQUFNLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsVUFBVSxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLGdCQUFVLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLG9CQUFNLENBQUMsQ0FBQztRQUNwQyxJQUFJ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