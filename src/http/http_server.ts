import { IncomingMessage, ServerResponse, createServer, Server, ServerOptions, OutgoingHttpHeaders } from 'http';
import { parse as urlParse } from 'url';
import * as Cookie from 'cookie';
import * as qs from 'qs';
import { parse as parseQs } from 'qs';
import * as jwt from 'jsonwebtoken';

import * as zlib from 'zlib';
import * as getRawBody from 'raw-body';


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
  HEADER_FORWARDED_HOST,
  HEADER_LOCATION,
  HEADER_MY_NAME,
  METHOD_GET,
  METHOD_POST,
  METHOD_OPTIONS,
  CONTENT_TYPE_GIF,
  CONTENT_TYPE_ICON,
  CONTENT_TYPE_JSON,
  CONTENT_TYPE_JS,
  CONTENT_TYPE_HTML,
  CONTENT_TYPE_PLAIN,
  CONTENT_TYPE_OCTET,
  CHANNEL_HTTP_PIXEL,
  METHOD_PING38,
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
  HTTPServiceParams,
} from '@app/types';

// const REQUEST_PAYLOAD_LIMIT = '100kb'
// const REQUEST_PARSE_OPTIONS = { limit: REQUEST_PAYLOAD_LIMIT };

import { getAppDeps } from '@rockstat/rock-me-ts';
import { cyrb53 } from '@app/helpers/cybr53';

const extContentTypeMap: Dictionary<string> = {
  'json': CONTENT_TYPE_JSON,
  'gif': CONTENT_TYPE_GIF,
  'js': CONTENT_TYPE_JS,
  'html': CONTENT_TYPE_HTML
}

const f = (i?: string | string[]) => Array.isArray(i) ? i[0] : i;

const re_naming = new RegExp('^([a-zA-Z0-9\._-]{1,50})$');

type Query = qs.ParsedQs;
type Cookie = Dictionary<string>;

// @Service()
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
  // servicesMap: Dictionary<string>
  servicesParams: { [k: string]: HTTPServiceParams }

  constructor(dispatcher: Dispatcher) {
    // const config = Container.get<AppConfig<FrontierConfig>>(AppConfig);
    const config: AppConfig<FrontierConfig> = getAppDeps().getDep('config')
    // const logger = Container.get<Logger>(Logger);
    // this.metrics = Container.get(Meter);
    this.metrics = getAppDeps().getDep('meter');
    // this.idGen = Container.get(TheIds);
    this.idGen = getAppDeps().getDep('ids');

    // this.dispatcher = Container.get(Dispatcher);
    this.dispatcher = dispatcher;

    // Container.set(StaticData, );

    this.static = new StaticData()
    this.options = config.http;
    this.title = config.get('name');
    this.identopts = config.identify;
    this.uidCookie = this.identopts.param;
    this.clientopts = config.client.common;
    this.urlMark = config.http.url_mark;
    this.log = getAppDeps().getDep('log').for(this);

    this.servicesParams = this.options.services_params || [];

    for (let [k, v] of Object.entries(this.options.sevices_map)) {
      this.servicesParams[k] = {
        alias_for: v
      }
    }
    // this.servicesMap = this.options.sevices_map;

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
    const httpServerOptions: ServerOptions = {
      connectionsCheckingInterval: 15000,
      keepAlive: true,
      keepAliveTimeout: 5000,
      requestTimeout: 5000
    };

    this.httpServer = createServer(httpServerOptions, (req, res) => {
      const requestTime = this.metrics.timenote('http.request');
      this.metrics.tick('http.request');
      this.handle(req)
        .then((result: BandResponse) => {
          const reqTime = requestTime();
          this.send(res, result, reqTime);
        })
        .catch(exc => {
          this.log.error(exc, 'exception caused | handle exec at start');
          const reqTime = requestTime();
          this.send(res, response.error({ statusCode: STATUS_INT_ERROR }), reqTime);
        })
    });
    this.httpServer.listen(this.options.port, this.options.host);
  }


  private send(res: ServerResponse, resp: BandResponse, reqTime: number) {
    resp.headers.push([HEADER_RESPONSE_TIME, reqTime])
    let raw: string | Buffer = '';
    let contentType: string = CONTENT_TYPE_JSON;
    const { headers, ...rest } = resp;

    if (resp.native__) {
      raw = JSON.stringify(rest);
      headers.push([HEADER_CONTENT_TYPE, contentType])
      headers.push([HEADER_CONTENT_LENGTH, Buffer.byteLength(raw)])
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
        contentType = CONTENT_TYPE_HTML;
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

    // parsing url
    const urlParts = urlParse(req.url);
    let query: Query = urlParts.query ? qs.parse(urlParts.query) : {};
    const urlPath = urlParts.pathname || ''
    const { native, ...parsedPath } = pathParts(urlPath, this.urlMark);
    const [urlService, urlName, urlProjectId] = parsedPath.parts;


    if (re_naming.exec(urlService) === null || re_naming.exec(urlName) === null) {
      this.metrics.tick('http.handle_illegal_names');
      return response.error({ statusCode: STATUS_BAD_REQUEST });
    }

    // parse cookie
    const cookie: Cookie = Cookie.parse(f(req.headers.cookie) || '');
    // pancake
    const pancake: { [k: string]: any } = {};


    // Prerouting 
    const urlServiceParams = this.servicesParams[urlService || 'no_fcuking_way'];

    // extracting useful headers
    const {
      'content-type': ContentTypeHeader,
      'content-encoding': ContentEncoding,
      'origin': originHeader,
      'referer': refererHeader
    } = req.headers;
    let dig = undefined;

    // custom url settings

    if (urlServiceParams) {
      if (urlServiceParams.dig) {

        if (!query.dig) {
          this.metrics.tick('http.request_no_dig_required')
          return response.error({ statusCode: STATUS_BAD_REQUEST })
        }

        if (urlServiceParams.url_check_websdk) {
          let draft_query_dig = Math.floor(Number(query.dig));
          if (!(draft_query_dig !== Infinity && String(draft_query_dig) === query.dig && draft_query_dig >= 0)) {
            this.metrics.tick('http.request_hueviy_dig')
            return response.error({ statusCode: STATUS_BAD_REQUEST })
          }
        }

        dig = Number(query.dig)

      }


    }
    // getting service/action from url path


    // Handling POST if routed right way!
    const contentType = parsedPath.ext && extContentTypeMap[parsedPath.ext]
      || ContentTypeHeader
      || '';




    // Preparing post data
    let body: HTTPBodyParams | undefined = {};
    if (req.method === METHOD_POST) {
      // const [err, pBody] = await this.parseBody(req, contentType);
      body = await this.parseBody(req, contentType, ContentEncoding, dig);
      if (!body) {
        this.metrics.tick('http.request_no_body')
        return response.error({ statusCode: STATUS_BAD_REQUEST })
      }
    }


    // Prerouting 
    const service = query.service || body.service || (urlServiceParams && urlServiceParams.alias_for) || urlService;
    const name = urlName || query.name || body.name;
    const uidParam = urlServiceParams && urlServiceParams.uid_param || this.uidParam;
    const projectId = Number(urlProjectId || query.projectId || body.projectId || 0);


    // pancakes

    if (urlServiceParams) {

      if (urlServiceParams.collect_cookies) {
        for (const k of urlServiceParams.collect_cookies) {
          if (cookie[k]) {
            pancake[k] = cookie[k];
          }
        }
      }

      if (urlServiceParams.action_params && urlServiceParams.action_params[name]) {
        const nameParams = urlServiceParams.action_params[name];
        // console.log(nameParams);
        if (nameParams.collect_all_cookies) {
          for (const [k, v] of Object.entries(cookie)) {
            if (nameParams.remove_cookies[k]) {
              continue;
            }
            if (nameParams.jwt_decode && nameParams.jwt_decode[k]) {
              try {
                const token = jwt.decode(String(v));
                pancake[k] = token;

              } catch (e) {
                this.log.error(e, 'jwt decode error');
              }
            } else {
              pancake[k] = v;
            }
          }

        }

        // if(nameParams.jwt_decode){
        //   for (const [k, v] of Object.entries(nameParams.jwt_decode)){
        //     console.log(k, v);
        //     console.log(cookie[k])
        //     if(cookie[k]){
        //       const token = jwt.decode(String(cookie[k]));
        //       pancake[k] = token;
        //       console.log(token)
        //     }

        //   }
        // }


      }
    }


    // uid
    const uid = (
      cleanUid(query[uidParam]) ||
      cleanUid(body && body[uidParam]) ||
      cleanUid(cookie[uidParam]) ||
      this.idGen.flake()
    )

    const transportData = extractTransportData(req);

    // Data for routing request
    const routeOn: RouteOn = {
      method: req.method,
      contentType,
      query,
      cookie,
      pancake,
      body,
      uid,
      uidParam,
      path: urlPath,
      service,
      name,
      projectId,
      origin: computeOrigin(originHeader, refererHeader),
      td: transportData
    };

    // Routing request (choose handler and handle)

    const routed = await this.route(routeOn)
    routed.native__ = native;

    routed.headers.push(
      ...secureHeaders(),
      ...corsHeaders(routeOn.origin),
      ...noCacheHeaders(),
      ...cookieHeaders([this.prepareUidCookie(routeOn)])
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

    // ### Coffe test
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

    // ### Index
    if (routeOn.path === '/') {
      return response.data({
        data: this.static.getItem('index'),
        contentType: CONTENT_TYPE_HTML
      });
    }

    if (routeOn.path === '/favicon.ico') {
      return response.data({
        data: this.static.getItem('favicon'),
        contentType: CONTENT_TYPE_ICON
      });
    }

    // ### Send request to BUS
    if (routeOn.service && routeOn.name) {
      const key = epglue(IN_GENERIC, routeOn.service, routeOn.name);
      let additional_data = {};

      // // Dirty hack | cookie collection
      // if (routeOn.name === METHOD_PING38) {
      //   this.log.info('ping38');
      //   additional_data = { data: { ...routeOn.cookie } };
      // }

      const msg: BaseIncomingMessage = {
        key,
        channel: routeOn.contentType.includes('image') ? CHANNEL_HTTP_PIXEL : CHANNEL_HTTP,
        service: routeOn.service,
        name: routeOn.name,
        projectId: routeOn.projectId,
        uid_param: routeOn.uidParam,
        uid: routeOn.uid,
        td: routeOn.td,
        data: { ...routeOn.body, ...routeOn.query, ...additional_data },
        pancake: routeOn.pancake
      }
      return await this.dispatcher.dispatch(key, msg);
    }

    // ### 404
    this.log.debug(routeOn, '404 request');
    return response.error({ statusCode: STATUS_NOT_FOUND })

  }

  /**
   * prepare UID cookie
   * @param uid
   */
  private prepareUidCookie(ro: RouteOn) {
    return Cookie.serialize(
      ro.uidParam,
      ro.uid || '0',
      {
        httpOnly: true,
        secure: true,
        expires: this.cookieExpires,
        path: this.identopts.cookiePath,
        domain: ro.td.host || this.cookieDomain,
        sameSite: 'none'
      }
    )
  }



  /**
   * Helper for parse body when not GET request
   * @param routeOn
   * @param req
   */
  private async parseBody(req: IncomingMessage, contentType?: string, contentEncoding?: string, dig?: number): Promise<HTTPBodyParams | undefined> {
    let result: HTTPBodyParams = {};

    // let data = await text(req);

    // let data_buf = await handle_buffer(req);
    let stream;
    let data;

    if (contentEncoding === 'gzip') {
      stream = req.pipe(zlib.createGunzip());
    } else {
      stream = req;
    }

    try {
      // length: !stream && req.headers['content-length'],
      // https://github.com/expressjs/body-parser/blob/master/index.js#L80
      // https://github.com/expressjs/body-parser/tree/master
      
      data = await getRawBody(stream, { limit: '1mb', encoding: 'utf-8' })
    } catch (e) {
      console.error(e)
    }

    // console.log(data);

    if (!data) {
      this.log.warn('!data');
      return;
    }

    if (dig) {
      const dig2 = cyrb53(data);
      if (dig !== dig2) {
        this.log.warn('!data');
        this.log.info({ dig, dig2 }, 'DIGS not eq');
        return;
      }
    }

    try {
      if (!contentType || !contentType.includes('json')) {
        result = parseQs(data);
      } else {
        result = JSON.parse(data);
        if (Array.isArray(result)) {
          result = {
            data: result
          }
        }
      }
      // console.log(result)
    } catch (e) {
      this.log.error('parse err', { e, data });
      return result;
    }

    return result;
  }


}

