import { IncomingMessage, ServerResponse, createServer, Server } from 'http';
import { createError, send, sendError, text, json, buffer } from 'micro';
import { Service, Inject, Container } from 'typedi';
import { parse as urlParse } from 'url';
import * as assert from 'assert';
import * as cookie from 'cookie';
import * as qs from 'qs';
import { Meter, Logger, TheIds, AppConfig } from 'rock-me-ts';
import { BrowserLib } from '@app/BrowserLib';
import { Dispatcher } from '@app/Dispatcher';
import { Router } from './http_router'
import {
  CONTENT_TYPE_GIF,
  CONTENT_TYPE_PLAIN,
  HContentType,
  HLocation,
  ResponseGif,
  ResponseRedir,
  AbsentRedir,
  STATUS_OK,
  STATUS_NOT_FOUND,
  STATUS_BAD_REQUEST,
  STATUS_INT_ERROR,
  STATUS_TEMP_REDIR,
  STATUS_OK_NO_CONTENT,
  METHOD_GET,
  METHOD_POST,
  METHOD_OPTIONS,
  CHANNEL_HTTP_REDIR,
  CHANNEL_HTTP_PIXEL,
  PATH_HTTP_LIBJS,
  IN_PIXEL,
  CONTENT_TYPE_JSON,
  CONTENT_TYPE_JS,
  HResponseTime,
  IN_REDIR,
  STATUS_TEAPOT,
  HMyName,
  CONTENT_BAD_REQUEST,
  PATH_HTTP_TEAPOT,
  PATH_HTTP_404,
  SERVICE_TRACK
} from '@app/constants';
import {
  computeOrigin,
  corsHeaders,
  corsAnswerHeaders,
  secureHeaders,
  noCacheHeaders,
  parseQuery,
  emptyGif,
  isCTypeJson,
  isCTypeUrlEnc,
  cookieHeaders,
  applyHeaders,
  corsAdditionalHeaders,
  isObject,
} from '@app/helpers';
import {
  HttpConfig,
  IdentifyConfig,
  ClientConfig,
  FrontierConfig,
  HTTPBodyParams,
  RouteOn,
  BaseIncomingMessage,
  HTTPTransportData,
  DispatchResult,
} from '@app/types';
import { epchild } from '@app/helpers';


const f = (i?: string | string[]) => Array.isArray(i) ? i[0] : i;
const parseOpts = { limit: '50kb' };

@Service()
export class HttpServer {

  httpServer: Server;
  options: HttpConfig;
  identopts: IdentifyConfig;
  clientopts: ClientConfig;
  router: Router;
  dispatcher: Dispatcher;
  idGen: TheIds;
  browserLib: BrowserLib;
  metrics: Meter;
  log: Logger;
  title: string;
  uidkey: string;

  cookieExpires: Date;

  constructor() {
    const config = Container.get<AppConfig<FrontierConfig>>(AppConfig);
    const logger = Container.get(Logger);
    this.metrics = Container.get(Meter);
    this.idGen = Container.get(TheIds);
    this.dispatcher = Container.get(Dispatcher);
    this.browserLib = Container.get(BrowserLib);

    this.options = config.http;
    this.title = config.get('name');
    this.identopts = config.identify;
    this.uidkey = this.identopts.param;
    this.clientopts = config.client.common;
    this.log = logger.for(this);

    this.router = new Router(this.options);

    this.cookieExpires = new Date(new Date().getTime() + this.identopts.cookieMaxAge * 1000);
  }


  /**
   * Start listening
   */
  start() {
    const { host, port } = this.options;
    this.log.info('Starting HTTP transport %s:%s', host, port);
    this.httpServer = createServer((req, res) => {
      this.handle(req, res);
    });
    this.httpServer.listen(this.options.port, this.options.host);
  }

  /**
   * Main request handler
   * @param req
   * @param res
   */
  private async handle(req: IncomingMessage, res: ServerResponse) {
    const requestTime = this.metrics.timenote('http.request')
    this.metrics.tick('request')

    assert(typeof req.url === 'string', 'Request url required');
    assert(typeof req.method === 'string', 'Request method required');

    // extracting useful headers
    const {
      'user-agent': userAgent,
      'content-type': contentType,
      'x-real-ip': realIp,
      'x-forwarded-for': forwardedFor,
      origin,
      referer
    } = req.headers;

    // parsing url
    const urlParts = urlParse(req.url || '');
    const query: Partial<{ [k: string]: string }> = urlParts.query ? qs.parse(urlParts.query) : {};

    // parse cookie
    const cookies = cookie.parse(f(req.headers.cookie) || '');

    // transportData.ip = '82.202.204.194';
    // transportData.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36'

    // Data for routing request
    const routeOn: RouteOn = {
      method: req.method || 'unknown',
      contentType: contentType || CONTENT_TYPE_PLAIN,
      query: parseQuery(urlParts.query || ''),
      path: urlParts.pathname || '/',
      origin: computeOrigin(origin, referer)
    };

    // ### CORS preflight // Early Response
    if (routeOn.method === METHOD_OPTIONS) {
      applyHeaders(
        res,
        corsHeaders(routeOn.origin),
        corsAnswerHeaders(),
        // additional params for caching responces
        corsAdditionalHeaders()
      );
      return send(res, STATUS_OK_NO_CONTENT);
    }

    // ### Allow only GET and POST
    if (routeOn.method !== METHOD_GET && routeOn.method !== METHOD_POST) {
      return send(res, STATUS_BAD_REQUEST, CONTENT_BAD_REQUEST);
    }

    // HTTP Routing
    // ####################################################

    // track json content hack (request dont containt info about content type to prevent options request)
    const routed = this.router.route(routeOn);
    if (routed.params.service === SERVICE_TRACK) {
      routed.contentType = CONTENT_TYPE_JSON;
    }

    // ### Teapot // Early Response
    if (routed.key === PATH_HTTP_TEAPOT) {
      res.setHeader(HMyName, this.title);
      res.setHeader(HContentType, CONTENT_TYPE_PLAIN);
      return send(res, STATUS_TEAPOT, "I'm a teapot");
    }

    if (routed.key === PATH_HTTP_404) {
      res.setHeader(HContentType, CONTENT_TYPE_PLAIN);
      return send(res, STATUS_NOT_FOUND);
    }

    // Handling POST if routed right way!
    let [error, body] = (routeOn.method === METHOD_POST)
      ? await this.parseBody(routed.contentType || routeOn.contentType, req)
      : [undefined, {}];
    // Bad body
    if (error) {
      this.log.error(error);
      res.setHeader(HContentType, CONTENT_TYPE_PLAIN);
      return send(res, STATUS_INT_ERROR);
    }

    const validBody = body;
    // Looking for uid
    const uid = query[this.uidkey] || body && validBody && body[this.uidkey] || cookies[this.uidkey] || this.idGen.flake();

    // transport data to store
    const { remoteAddress } = req.connection;
    const transportData: HTTPTransportData = {
      ip: f(realIp) || remoteAddress || '0.0.0.0',
      ua: f(userAgent) || 'Absent',
    };

    const userIdCookie = cookie.serialize(
      this.identopts.param,
      uid,
      {
        httpOnly: true,
        expires: this.cookieExpires
      }
    )

    // Regular response headers
    applyHeaders(
      res,
      corsHeaders(routeOn.origin),
      noCacheHeaders(),
      cookieHeaders([userIdCookie])
    );

    // Processing JS client lib
    if (routed.key === PATH_HTTP_LIBJS) {
      res.setHeader(HContentType, CONTENT_TYPE_JS);
      const response = this.browserLib.prepare(
        Object.assign(
          { initialUid: uid },
          this.clientopts
        )
      );
      return send(res, STATUS_OK, response);
    }

    // Final final message
    const msg: BaseIncomingMessage = {
      key: routed.key,
      channel: routed.channel,
      service: routed.params.service,
      name: routed.params.name,
      projectId: routed.params.projectId,
      uid: uid,
      td: transportData,
      data: Object.assign(body, routeOn.query)
    }

    // Dispatching: Running enrichers, subscribers, handler
    // ####################################################
    let dispatched = await this.dispatch(routed.key, msg);

    // Constructing response
    // ####################################################

    let statusCode = 200;
    let response;

    if (dispatched.error) {
      statusCode = dispatched.errorCode || STATUS_INT_ERROR;
      response = dispatched.error;
    } else if (dispatched.location) {
      statusCode = STATUS_TEMP_REDIR;
      res.setHeader(HLocation, dispatched.location);
    } else {
      response = dispatched;
    }

    if (routed.channel === CHANNEL_HTTP_PIXEL) {
      res.setHeader(HContentType, CONTENT_TYPE_GIF);
      response = emptyGif;
    }

    const reqTime = requestTime()
    res.setHeader(HResponseTime, reqTime);

    send(res, statusCode, response || '');

  }

  /**
   * Start message handling
   * @param key internal routing key
   * @param msg message object
   */
  private async dispatch(key: string, msg: BaseIncomingMessage): Promise<DispatchResult> {
    try {
      return await this.dispatcher.emit(key, msg);
    } catch (error) {
      this.log.warn(error);
      return {
        error: 'Internal error. Smth wrong.',
        errorCode: STATUS_INT_ERROR
      }
    }
  }

  /**
   * Helper for parse body when not GET request
   * @param routeOn
   * @param req
   */
  private async parseBody(contentType: string, req: IncomingMessage): Promise<[undefined, HTTPBodyParams] | [Error, undefined]> {
    let result: HTTPBodyParams;
    try {
      if (contentType.indexOf('json') >= 0) {
        result = await json(req, parseOpts);
      } else {
        result = parseQuery(await text(req, parseOpts));
      }
      return [undefined, isObject(result) ? result : {}];
    } catch (error) {
      return [error, undefined];
    }
  }

}
