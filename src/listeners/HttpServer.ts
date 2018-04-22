import { IncomingMessage, ServerResponse, createServer, Server } from 'http';
import { createError, send, sendError, text, json, buffer } from 'micro';
import { Service, Inject } from 'typedi';
import { parse as urlParse } from 'url';
import * as assert from 'assert';
import * as cookie from 'cookie';
import * as qs from 'qs';
import { LogFactory, Logger } from '@app/log';
import { Indentifier, Configurer, BrowserLib, Dispatcher } from '@app/lib';
import { Router, RouteOn } from './Router'
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
  CHANNEL_REDIR,
  CHANNEL_PIXEL,
  PATH_HTTP_LIBJS,
  IN_PIXEL,
  CONTENT_TYPE_JSON,
  CONTENT_TYPE_JS,
  HResponseTime
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

export type BodyParams = { [key: string]: string }
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
  log: Logger;

  @Inject()
  router: Router;

  @Inject()
  dispatcher: Dispatcher;

  @Inject()
  identifier: Indentifier;

  @Inject()
  browserLib: BrowserLib;

  cookieExpires: Date;

  constructor(logFactory: LogFactory, configurer: Configurer) {
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
    this.log.info('Starting HTTP transport');

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

      const startAt = process.hrtime()

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
      const query = urlParts.query ? qs.parse(urlParts.query) : {};

      // parse cookie
      const cookies = cookie.parse(f(req.headers.cookie) || '');

      // uid
      const uid = query[this.identopts.param] || cookies[this.identopts.param] || this.identifier.userId();

      // transport data to store
      const { remoteAddress } = req.connection;
      const transportData: TransportData = {
        ip: f(realIp) || remoteAddress || '127.0.0.1',
        userAgent: f(userAgent) || 'Unknown',
        uid: uid
      };

      transportData.ip = '82.202.204.194';
      transportData.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36'

      // Data for routing request
      const routeOn: RouteOn = {
        method: req.method || 'unknown',
        contentType: contentType || CONTENT_TYPE_PLAIN,
        query: parseQuery(urlParts.query || ''),
        path: urlParts.pathname || '/',
        origin: computeOrigin(origin, referer)
      };
      const userIdCookie = cookie.serialize(
        this.identopts.param,
        transportData.uid,
        {
          httpOnly: true,
          expires: this.cookieExpires
        }
      )

      // Processing routes
      const handled = this.router.route(routeOn);
      const { status } = handled;

      // Handling CORS preflight request
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


      if (status === STATUS_OK || status === STATUS_TEMP_REDIR) {
        // Regular response headers
        applyHeaders(
          res,
          corsHeaders(routeOn.origin),
          noCacheHeaders(),
          cookieHeaders([userIdCookie])
        );

        // Parse body if needed
        const body = (routeOn.method === METHOD_POST)
          ? await this.parseBody(handled.contentType || routeOn.contentType, req)
          : undefined;

        // Final final message
        const msg: ClientHttpMessage = Object.assign(
          {},
          body,
          routeOn.query,
          handled.params,
          transportData,
          { key: handled.key }
        );

        // Running enrichers, subscribers, handler
        let response = await this.dispatcher.emit(handled.key, msg);


        console.log('resp: '+response);

        // Processing redirect
        if (epchild(CHANNEL_REDIR, handled.key) && handled.location) {
          res.setHeader(HLocation, handled.location);
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

        if (epchild(IN_PIXEL, handled.key)) {
          res.setHeader(HContentType, CONTENT_TYPE_GIF);
          response = emptyGif;
        }

        const startAtOffset = process.hrtime(startAt)
        const executionMs = startAtOffset[0] * 1e3 + startAtOffset[1] * 1e-6
        res.setHeader(HResponseTime, executionMs);

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
