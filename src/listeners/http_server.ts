import { IncomingMessage, ServerResponse, createServer, Server } from 'http';
import { createError, send, sendError, text, json, buffer } from 'micro';
import { Service, Inject, Container } from 'typedi';
import { parse as urlParse } from 'url';
import * as assert from 'assert';
import * as cookie from 'cookie';
import * as qs from 'qs';
import { Meter, Logger, TheIds } from 'rockmets';
import { Configurer, BrowserLib, Dispatcher } from '@app/lib';
import { Router, RouteOn } from './http_router'
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
  HMyName
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
} from '@app/helpers';
import {
  HttpConfig,
  IdentifyConfig,
  ClientConfig,
  Headers,
  ClientHttpMessage,
} from '@app/types';
import { epchild } from '@app/helpers';


const f = (i?: string | string[]) => Array.isArray(i) ? i[0] : i;
const parseOpts = { limit: '50kb' };

export type BodyParams = { [key: string]: any }
export type QueryParams = { [key: string]: any }

export interface TransportData {
  ip: string;
  userAgent: string;
  uid: string;
}


type msg = {
  id: string;
  key: string;
  time: Date;
  channel: string;
  projectId: string;
  name: string
  data: object;
  // redir
  group: string;
  // online + redir
  userAgent: string;
  uid: string;
  ip: string;
  // webhooks
  service: string;
  action: string;
  remote_ip: string;
}

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
    const config = Container.get(Configurer);
    const logger = Container.get(Logger);
    this.metrics = Container.get(Meter);
    this.idGen = Container.get(TheIds);
    this.dispatcher = Container.get(Dispatcher);
    this.router = Container.get(Router);
    this.browserLib = Container.get(BrowserLib);

    this.options = config.httpConfig;
    this.title = config.get('name');
    this.identopts = config.identify;
    this.uidkey = this.identopts.param;
    this.clientopts = config.client;
    this.log = logger.for(this);

    this.cookieExpires = new Date(new Date().getTime() + this.identopts.cookieMaxAge * 1000);
  }

  /**
   * Helper for parse body when not GET request
   * @param routeOn
   * @param req
   */
  async parseBody(contentType: string, req: IncomingMessage): Promise<BodyParams> {

    if (contentType.indexOf('json') >= 0) {
      return <{ [key: string]: any }>await json(req, parseOpts);
    }
    const body = await text(req, parseOpts);
    return parseQuery(body);
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
  async handle(req: IncomingMessage, res: ServerResponse) {

    try {

      const requestTime = this.metrics.timenote('http.request')

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
      const query: Partial<{[k:string]: string}> = urlParts.query ? qs.parse(urlParts.query) : {};

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

      // HTTP Routing
      // ####################################################
      const handled = this.router.route(routeOn);
      const { status } = handled;

      // ### CORS preflight // Early Response
      if (status === STATUS_OK_NO_CONTENT && routeOn.method === METHOD_OPTIONS) {
        applyHeaders(
          res,
          corsHeaders(routeOn.origin),
          corsAnswerHeaders(),
          // additional params for caching responces
          corsAdditionalHeaders()
        );
        return send(res, status);
      }

      // ### Teapot // Early Response
      if (status === STATUS_TEAPOT) {
        res.setHeader(HMyName, this.title);
        res.setHeader(HContentType, CONTENT_TYPE_PLAIN);
        return send(res, status, "I'm a teapot");
      }

      if (status === STATUS_OK || status === STATUS_TEMP_REDIR) {

        // Handling POST if routed right way!
        const body = (routeOn.method === METHOD_POST)
          ? await this.parseBody(handled.contentType || routeOn.contentType, req)
          : {};

        // Looking for uid
        const uid = query[this.uidkey] || body[this.uidkey] || cookies[this.uidkey] || this.idGen.flake();

        // transport data to store
        const { remoteAddress } = req.connection;
        const transportData: TransportData = {
          ip: f(realIp) || remoteAddress || '127.0.0.1',
          userAgent: f(userAgent) || 'Unknown',
          uid: uid
        };


        // Final final message
        const msg: ClientHttpMessage = Object.assign(
          {},
          body,
          routeOn.query,
          handled.params,
          {
            key: handled.key,
            channel: handled.channel,
            proto: transportData
          }
        );

        // Dispatching: Running enrichers, subscribers, handler
        // ####################################################
        let response = await this.dispatcher.emit(handled.key, msg);


        // Constructing response
        // ####################################################


        const userIdCookie = cookie.serialize(
          this.identopts.param,
          transportData.uid,
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



        // Processing redirect
        if (epchild(IN_REDIR, handled.key) && handled.location) {
          res.setHeader(HLocation, handled.location);
          res.setHeader(HContentType, CONTENT_TYPE_PLAIN);
          response = 'Redirecting...';
        }

        // Processing JS client lib
        if (handled.key === PATH_HTTP_LIBJS) {
          res.setHeader(HContentType, CONTENT_TYPE_JS);
          response = this.browserLib.prepare(
            Object.assign(
              { initialUid: uid },
              this.clientopts
            )
          );
        }

        if (handled.channel === CHANNEL_HTTP_PIXEL) {
          res.setHeader(HContentType, CONTENT_TYPE_GIF);
          response = emptyGif;
        }

        const reqTime = requestTime()
        res.setHeader(HResponseTime, reqTime);

        send(res, handled.status, response);

      } else {
        send(res, handled.status || STATUS_BAD_REQUEST, String(handled.status));
      }

    } catch (error) {
      this.log.error(error, 'Error during request handling');
      send(res, STATUS_INT_ERROR, {} || {});
    }
  }
}
