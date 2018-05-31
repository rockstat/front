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
const rock_me_ts_1 = require("rock-me-ts");
const lib_1 = require("@app/lib");
const http_router_1 = require("./http_router");
const constants_1 = require("@app/constants");
const helpers_1 = require("@app/helpers");
const f = (i) => Array.isArray(i) ? i[0] : i;
const parseOpts = { limit: '50kb' };
let HttpServer = class HttpServer {
    constructor() {
        const config = typedi_1.Container.get(rock_me_ts_1.AppConfig);
        const logger = typedi_1.Container.get(rock_me_ts_1.Logger);
        this.metrics = typedi_1.Container.get(rock_me_ts_1.Meter);
        this.idGen = typedi_1.Container.get(rock_me_ts_1.TheIds);
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
        // ### CORS preflight // Early Response
        if (routeOn.method === constants_1.METHOD_OPTIONS) {
            helpers_1.applyHeaders(res, helpers_1.corsHeaders(routeOn.origin), helpers_1.corsAnswerHeaders(), 
            // additional params for caching responces
            helpers_1.corsAdditionalHeaders());
            return micro_1.send(res, constants_1.STATUS_OK_NO_CONTENT);
        }
        // ### Allow only GET and POST
        if (routeOn.method !== constants_1.METHOD_GET && routeOn.method !== constants_1.METHOD_POST) {
            return micro_1.send(res, constants_1.STATUS_BAD_REQUEST, constants_1.CONTENT_BAD_REQUEST);
        }
        // HTTP Routing
        // ####################################################
        const routed = this.router.route(routeOn);
        // ### Teapot // Early Response
        if (routed.key === constants_1.PATH_HTTP_TEAPOT) {
            res.setHeader(constants_1.HMyName, this.title);
            res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_PLAIN);
            return micro_1.send(res, constants_1.STATUS_TEAPOT, "I'm a teapot");
        }
        if (routed.key === constants_1.PATH_HTTP_404) {
            res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_PLAIN);
            return micro_1.send(res, constants_1.STATUS_NOT_FOUND);
        }
        // Handling POST if routed right way!
        const body = (routeOn.method === constants_1.METHOD_POST)
            ? await this.parseBody(routed.contentType || routeOn.contentType, req)
            : {};
        // Looking for uid
        const uid = query[this.uidkey] || body[this.uidkey] || cookies[this.uidkey] || this.idGen.flake();
        // transport data to store
        const { remoteAddress } = req.connection;
        const transportData = {
            ip: f(realIp) || remoteAddress || '0.0.0.0',
            userAgent: f(userAgent) || 'Absent',
        };
        const userIdCookie = cookie.serialize(this.identopts.param, uid, {
            httpOnly: true,
            expires: this.cookieExpires
        });
        // Regular response headers
        helpers_1.applyHeaders(res, helpers_1.corsHeaders(routeOn.origin), helpers_1.noCacheHeaders(), helpers_1.cookieHeaders([userIdCookie]));
        // Processing JS client lib
        if (routed.key === constants_1.PATH_HTTP_LIBJS) {
            res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_JS);
            const response = this.browserLib.prepare(Object.assign({ initialUid: uid }, this.clientopts));
            return micro_1.send(res, constants_1.STATUS_OK, response);
        }
        // Final final message
        const msg = {
            key: routed.key,
            channel: routed.channel,
            service: routed.params.service,
            name: routed.params.name,
            uid: uid,
            data: Object.assign(body, routeOn.query)
        };
        // Dispatching: Running enrichers, subscribers, handler
        // ####################################################
        let dispatched = await this.dispatch(routed.key, msg);
        // Constructing response
        // ####################################################
        let response;
        switch (dispatched.code) {
            case constants_1.STATUS_OK:
                response = dispatched.result;
                break;
            case constants_1.STATUS_TEMP_REDIR:
                res.setHeader(constants_1.HLocation, dispatched.location);
                response = `Redirecting to ${dispatched.location}...`;
                break;
            case constants_1.STATUS_BAD_REQUEST:
            case constants_1.STATUS_INT_ERROR:
                response = dispatched.error;
                break;
        }
        if (routed.channel === constants_1.CHANNEL_HTTP_PIXEL) {
            res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_GIF);
            response = helpers_1.emptyGif;
        }
        const reqTime = requestTime();
        res.setHeader(constants_1.HResponseTime, reqTime);
        micro_1.send(res, dispatched.code, response);
    }
    async dispatch(key, msg) {
        try {
            return await this.dispatcher.emit(key, msg);
        }
        catch (error) {
            this.log.error(error);
            return {
                error: 'Internal error. Smth wrong.',
                code: constants_1.STATUS_INT_ERROR
            };
        }
    }
};
HttpServer = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], HttpServer);
exports.HttpServer = HttpServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlzdGVuZXJzL2h0dHBfc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsK0JBQTZFO0FBQzdFLGlDQUF5RTtBQUN6RSxtQ0FBb0Q7QUFDcEQsNkJBQXdDO0FBQ3hDLGlDQUFpQztBQUNqQyxpQ0FBaUM7QUFDakMseUJBQXlCO0FBQ3pCLDJDQUE4RDtBQUM5RCxrQ0FBa0Q7QUFDbEQsK0NBQXNDO0FBQ3RDLDhDQThCd0I7QUFDeEIsMENBYXNCO0FBZ0J0QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQXFCLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLE1BQU0sU0FBUyxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBd0JwQyxJQUFhLFVBQVUsR0FBdkI7SUFpQkU7UUFDRSxNQUFNLE1BQU0sR0FBRyxrQkFBUyxDQUFDLEdBQUcsQ0FBNEIsc0JBQVMsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sTUFBTSxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLG1CQUFNLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLGtCQUFLLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsS0FBSyxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLG1CQUFNLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsVUFBVSxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLGdCQUFVLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLGtCQUFTLENBQUMsR0FBRyxDQUFDLG9CQUFNLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsVUFBVSxH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