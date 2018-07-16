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
const BrowserLib_1 = require("@app/BrowserLib");
const Dispatcher_1 = require("@app/Dispatcher");
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
        this.dispatcher = typedi_1.Container.get(Dispatcher_1.Dispatcher);
        this.browserLib = typedi_1.Container.get(BrowserLib_1.BrowserLib);
        this.options = config.http;
        this.title = config.get('name');
        this.identopts = config.identify;
        this.uidkey = this.identopts.param;
        this.clientopts = config.client.common;
        this.log = logger.for(this);
        this.router = new http_router_1.Router(this.options);
        this.cookieExpires = new Date(new Date().getTime() + this.identopts.cookieMaxAge * 1000);
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
        this.metrics.tick('request');
        assert(typeof req.url === 'string', 'Request url required');
        assert(typeof req.method === 'string', 'Request method required');
        // extracting useful headers
        const { 'user-agent': userAgent, 'content-type': contentType, 'x-real-ip': realIp, 'origin': origin, 'referer': referer } = req.headers;
        // parsing url
        const urlParts = url_1.parse(req.url || '');
        const query = urlParts.query ? qs.parse(urlParts.query) : {};
        // parse cookie
        const cookies = cookie.parse(f(req.headers.cookie) || '');
        // transportData.ip = '82.66.204.194';
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
        // Processing route redsults
        // ####################################################
        // specific tracking logick for web-sdk
        if (routed.params.service === constants_1.SERVICE_TRACK) {
            // override channel for track requests via image
            if (routeOn.query.channel && routeOn.query.channel == 'pixel') {
                routed.channel = constants_1.CHANNEL_HTTP_PIXEL;
            }
            // track json content hack (request dont containt info about content type to prevent options request)
            else {
                routed.channel = constants_1.CHANNEL_HTTP_WEBHOOK;
                routed.contentType = constants_1.CONTENT_TYPE_JSON;
            }
        }
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
        let [error, body] = (routeOn.method === constants_1.METHOD_POST)
            ? await this.parseBody(routed.contentType || routeOn.contentType, req)
            : [undefined, {}];
        // Bad body
        if (error) {
            this.log.error(error);
            res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_PLAIN);
            return micro_1.send(res, constants_1.STATUS_INT_ERROR);
        }
        const validBody = body;
        // Looking for uid
        const uid = query[this.uidkey] || body && validBody && body[this.uidkey] || cookies[this.uidkey] || this.idGen.flake();
        // transport data to store
        const { remoteAddress } = req.connection;
        const transportData = {
            ip: f(realIp) || remoteAddress || '0.0.0.0',
            ua: f(userAgent) || 'Absent',
        };
        // Generating fingerprint
        transportData.fpid = this.idGen.xxhash(`${transportData.ip}:${transportData.ua}`);
        // Preparing UID cookie
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
            projectId: routed.params.projectId,
            uid: uid,
            td: transportData,
            data: Object.assign(body, routeOn.query)
        };
        // Dispatching: Running enrichers, subscribers, handler
        // ####################################################
        let dispatched = await this.dispatch(routed.key, msg);
        // Constructing response
        // ####################################################
        let statusCode = 200;
        let response;
        if (dispatched.error) {
            statusCode = dispatched.errorCode || constants_1.STATUS_INT_ERROR;
            response = dispatched.error;
        }
        else if (dispatched.location) {
            statusCode = constants_1.STATUS_TEMP_REDIR;
            res.setHeader(constants_1.HLocation, dispatched.location);
        }
        else {
            response = dispatched;
        }
        if (routed.channel === constants_1.CHANNEL_HTTP_PIXEL) {
            res.setHeader(constants_1.HContentType, constants_1.CONTENT_TYPE_GIF);
            response = helpers_1.emptyGif;
        }
        const reqTime = requestTime();
        res.setHeader(constants_1.HResponseTime, reqTime);
        micro_1.send(res, statusCode, response || '');
    }
    /**
     * Start message handling
     * @param key internal routing key
     * @param msg message object
     */
    async dispatch(key, msg) {
        try {
            return await this.dispatcher.emit(key, msg);
        }
        catch (error) {
            this.log.warn(error);
            return {
                error: 'Internal error. Smth wrong.',
                errorCode: constants_1.STATUS_INT_ERROR
            };
        }
    }
    /**
     * Helper for parse body when not GET request
     * @param routeOn
     * @param req
     */
    async parseBody(contentType, req) {
        let result;
        try {
            if (contentType.indexOf('json') >= 0) {
                result = await micro_1.json(req, parseOpts);
            }
            else {
                result = helpers_1.parseQuery(await micro_1.text(req, parseOpts));
            }
            return [undefined, helpers_1.isObject(result) ? result : {}];
        }
        catch (error) {
            return [error, undefined];
        }
    }
};
HttpServer = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], HttpServer);
exports.HttpServer = HttpServer;
//# sourceMappingURL=http_server.js.map