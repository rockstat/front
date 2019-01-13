import { IncomingMessage, ServerResponse, createServer, Server, OutgoingHttpHeaders } from 'http';
import { send as microSend, sendError, text, json, buffer } from 'micro';
import { Service, Inject, Container } from 'typedi';
import { parse as urlParse } from 'url';
import * as Cookie from 'cookie';
import * as qs from 'qs';
import {
  Meter,
  Logger,
  TheIds,
  AppConfig,
  RESP_REDIRECT,
  RESP_PIXEL,
  RESP_DATA,
  RESP_ERROR,
  response,
  STATUS_NOT_FOUND,
  STATUS_BAD_REQUEST,
  STATUS_INT_ERROR,
  STATUS_TEAPOT,
  BandResponse,
} from '@rockstat/rock-me-ts';
import { StaticData } from '@app/StaticData';
import { Dispatcher } from '@app/Dispatcher';
import {
  IN_GENERIC,
  CHANNEL_HTTP,
  HEADER_RESPONSE_TIME,
  HEADER_CONTENT_TYPE,
  HEADER_CONTENT_LENGTH,
  HEADER_LOCATION,
  HEADER_MY_NAME,
  METHOD_GET,
  METHOD_POST,
  METHOD_OPTIONS,
  CONTENT_TYPE_GIF,
  CONTENT_TYPE_JSON,
  CONTENT_TYPE_JS,
  CONTENT_TYPE_HTML,
  CONTENT_TYPE_PLAIN,
  CONTENT_TYPE_OCTET,
  CHANNEL_HTTP_PIXEL,
} from '@app/constants';
import {
  computeOrigin,
  corsHeaders,
  corsAnswerHeaders,
  secureHeaders,
  noCacheHeaders,
  parseQuery,
  emptyGif,
  cookieHeaders,
  corsAdditionalHeaders,
  isObject,
  autoDomain,
  epglue,
  cleanUid,
  pathParts,
  extractTransportData
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
  Dictionary,
} from '@app/types';

const REQUEST_PAYLOAD_LIMIT = '100kb'
const REQUEST_PARSE_OPTIONS = { limit: REQUEST_PAYLOAD_LIMIT };

const extContentTypeMap: Dictionary<string> = {
  'json': CONTENT_TYPE_JSON,
  'gif': CONTENT_TYPE_GIF,
  'js': CONTENT_TYPE_JS,
  'html': CONTENT_TYPE_HTML
}

const f = (i?: string | string[]) => Array.isArray(i) ? i[0] : i;

@Service()
export class HttpServer {

  httpServer: Server;
  options: HttpConfig;
  identopts: IdentifyConfig;
  clientopts: ClientConfig;
  dispatcher: Dispatcher;
  idGen: TheIds;
  static: StaticData;
  metrics: Meter;
  log: Logger;
  title: string;
  uidParam: string = 'uid';
  uidCookie: string;
  urlMark: string;
  cookieExpires: Date;
  cookieDomain?: string;
  servicesMap: Dictionary<string>

  constructor() {
    const config = Container.get<AppConfig<FrontierConfig>>(AppConfig);
    const logger = Container.get(Logger);
    this.metrics = Container.get(Meter);
    this.idGen = Container.get(TheIds);
    this.dispatcher = Container.get(Dispatcher);
    this.static = Container.get(StaticData);
    this.options = config.http;
    this.title = config.get('name');
    this.identopts = config.identify;
    this.uidCookie = this.identopts.param;
    this.clientopts = config.client.common;
    this.urlMark = config.http.url_mark;
    this.log = logger.for(this);
    this.servicesMap = this.options.sevices_map;
    this.cookieExpires = new Date(new Date().getTime() + this.identopts.cookieMaxAge * 1000);
    this.cookieDomain = this.identopts.cookieDomain === 'auto'
      ? (this.identopts.domain ? '.' + autoDomain(this.identopts.domain) : undefined)
      : this.identopts.cookieDomain

  }

  /**
   * Start listening
   */
  start() {
    const { host, port } = this.options;
    this.log.info('Starting HTTP transport %s:%s', host, port);
    this.log.info({ finalCookieDomain: this.cookieDomain, ...this.identopts }, 'Indentify options');
    this.httpServer = createServer((req, res) => {
      const requestTime = this.metrics.timenote('http.request')
      this.metrics.tick('http.request')
      this.handle(req)
        .then((result: BandResponse) => {
          const reqTime = requestTime();
          this.send(res, result, reqTime)
        })
        .catch(exc => {
          console.error('exception caused >> ', exc);
        })
    });
    this.httpServer.listen(this.options.port, this.options.host);
  }


  private send(res: ServerResponse, resp: BandResponse, reqTime: number) {
    resp.headers.push([HEADER_RESPONSE_TIME, reqTime])
    let raw: string | Buffer = '';
    let contentType: string = CONTENT_TYPE_PLAIN;
    const { headers, ...rest } = resp;

    if (resp.native__) {
      raw = JSON.stringify(rest);
    } else {

      if (rest.type__ === RESP_DATA) {
        // overiide null values with empty string
        if (rest.data === null) {
          rest.data = '';
        }
        // Object or Buffer or Array...
        else if (typeof rest.data === 'object') {
          // buffer -> raw data
          if (rest.data instanceof Buffer) {
            contentType = rest.contentType || CONTENT_TYPE_OCTET;
            raw = rest.data;
          }
          // Object or Array -> need to serialize
          else {
            contentType = CONTENT_TYPE_JSON;
            raw = JSON.stringify(rest.data);
          }
        }
        // Raw string responses
        else {
          raw = String(rest.data);
        }
      }

      if (rest.type__ === RESP_REDIRECT) {
        raw = '';
        contentType = CONTENT_TYPE_PLAIN;
        headers.push([HEADER_LOCATION, rest.location]);
      }

      if (rest.type__ === RESP_PIXEL) {
        raw = emptyGif;
        contentType = CONTENT_TYPE_GIF;
      }

      if (rest.type__ === RESP_ERROR) {
        raw = JSON.stringify({ message: rest.errorMessage });
        contentType = CONTENT_TYPE_JSON;
      }
      headers.push([HEADER_CONTENT_TYPE, contentType])
      headers.push([HEADER_CONTENT_LENGTH, Buffer.byteLength(raw)])
    }

    for (const [h, v] of resp.headers) {
      res.setHeader(h, v);
    }
    res.statusCode = resp.statusCode;
    res.end(raw);
  }

  /**
   * Main request handler
   * @param req
   * @param res
   */
  private async handle(req: IncomingMessage): Promise<BandResponse> {

    if (!req.url || !req.method) {
      console.error(Error('Request url/method not present'))
      return response.error({ statusCode: STATUS_BAD_REQUEST })
    }

    if (!req.connection.remoteAddress) {
      console.error(Error('Connection remote addr not present'))
      return response.error({ statusCode: STATUS_INT_ERROR })
    }

    // extracting useful headers
    const {
      'content-type': ContentTypeHeader,
      'origin': originHeader,
      'referer': refererHeader
    } = req.headers;

    // parsing url
    const urlParts = urlParse(req.url);
    const query: Dictionary<string> = urlParts.query ? qs.parse(urlParts.query) : {};
    const urlPath = urlParts.pathname || ''
    const { native, ...parsedPath } = pathParts(urlPath, this.urlMark);
    
    // parse cookie
    const cookie: Dictionary<string> = Cookie.parse(f(req.headers.cookie) || '');
    const [urlService, urlName, urlProjectId] = parsedPath.parts;
    
    // Handling POST if routed right way!
    const contentType = parsedPath.ext && extContentTypeMap[parsedPath.ext] || ContentTypeHeader || '';

    let body: HTTPBodyParams = {};
    if (req.method === METHOD_POST) {
      const [err, pBody] = await this.parseBody(req, contentType);
      // Bad body
      if (err) {
        this.log.error(err);
        return response.error({ statusCode: STATUS_BAD_REQUEST })
      }
      body = pBody || {};
    }

    const uid = (
      cleanUid(query[this.uidParam]) ||
      cleanUid(body && body[this.uidParam]) ||
      cleanUid(cookie[this.uidCookie]) ||
      this.idGen.flake()
    )

    const transportData = extractTransportData(req);

    // Data for routing request
    const routeOn: RouteOn = {
      method: req.method,
      contentType,
      query,
      cookie,
      body,
      uid,
      path: urlPath,
      service: query.service || body.service || (urlService && this.servicesMap[urlService]) || urlService,
      name: urlName || query.name || body.name,
      projectId: Number(urlProjectId || query.projectId || body.projectId || 0),
      origin: computeOrigin(originHeader, refererHeader),
      td: transportData
    };

    const routed = await this.route(routeOn)
    routed.native__ = native;

    routed.headers.push(
      ...secureHeaders(),
      ...corsHeaders(routeOn.origin),
      ...noCacheHeaders(),
      ...cookieHeaders([this.prepareUidCookie(uid)])
    )
    return routed;

  }

  private async route(routeOn: RouteOn): Promise<BandResponse> {

    // ### CORS preflight // Early Response
    if (routeOn.method === METHOD_OPTIONS) {
      return response.data({
        headers: [
          ...corsHeaders(routeOn.origin),
          ...corsAnswerHeaders(),
          ...corsAdditionalHeaders(),
        ],
        data: null
      })
    }

    // ### Allow only GET and POST
    if (routeOn.method !== METHOD_GET && routeOn.method !== METHOD_POST) {
      return response.error({ statusCode: STATUS_BAD_REQUEST });
    }

    // ### Allow only GET and POST
    if (routeOn.path === '/coffee') {
      return response.error({
        statusCode: STATUS_TEAPOT,
        headers: [
          [HEADER_MY_NAME, this.title],
        ]
      });
    }

    // ### Allow only GET and POST
    if (routeOn.path === '/lib.js') {
      return response.data({
        data: this.static.prepareLib({ initialUid: routeOn.uid, urlMark: this.urlMark, ...this.clientopts }),
        contentType: CONTENT_TYPE_JS
      });
    }

    // ### Send request to BUS
    if (routeOn.service && routeOn.name) {
      const key = epglue(IN_GENERIC, routeOn.service, routeOn.name);
      const msg: BaseIncomingMessage = {
        key,
        channel: routeOn.contentType.includes('image') ? CHANNEL_HTTP_PIXEL : CHANNEL_HTTP,
        service: routeOn.service,
        name: routeOn.name,
        projectId: routeOn.projectId,
        uid: routeOn.uid,
        td: routeOn.td,
        data: { ...routeOn.body, ...routeOn.query }
      }
      return await this.dispatcher.dispatch(key, msg);
    }

    // ### 404
    this.log.debug('404 request');
    return response.error({ statusCode: STATUS_NOT_FOUND })

  }

  /**
   * prepare UID cookie
   * @param uid 
   */
  private prepareUidCookie(uid: string) {
    return Cookie.serialize(
      this.identopts.param,
      uid,
      {
        httpOnly: true,
        expires: this.cookieExpires,
        path: this.identopts.cookiePath,
        domain: this.cookieDomain
      }
    )
  }

  /**
   * Helper for parse body when not GET request
   * @param routeOn
   * @param req
   */
  private async parseBody(req: IncomingMessage, contentType?: string): Promise<[undefined, HTTPBodyParams] | [Error, undefined]> {
    let result: HTTPBodyParams;
    try {
      if (!contentType || !contentType.includes('json')) {
        result = parseQuery(await text(req, REQUEST_PARSE_OPTIONS));
      } else {
        result = await json(req, REQUEST_PARSE_OPTIONS);
      }
      return [undefined, isObject(result) ? result : {}];
    } catch (error) {
      return [error, undefined];
    }
  }

}
