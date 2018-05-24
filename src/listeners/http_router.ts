import { IncomingMessage, ServerResponse } from 'http';
import { Service, Inject } from 'typedi';
import * as FindMyWay from 'find-my-way';
import { LogFactory, Logger } from '@app/log';
import { epglue } from '@app/helpers';
import {
  CONTENT_TYPE_JSON,
  STATUS_OK,
  STATUS_NOT_FOUND,
  STATUS_TEMP_REDIR,
  STATUS_OK_NO_CONTENT,
  PATH_HTTP_404,
  PATH_HTTP_LIBJS,
  PATH_HTTP_OPTS,
  IN_WEBHOOK,
  IN_REDIR,
  IN_PIXEL,
  IN_TRACK,
  IN_INDEP,
  CHANNEL_HTTP_WEBHOOK,
  PATH_HTTP_418,
  STATUS_TEAPOT,
  CHANNEL_HTTP_PIXEL,
  CHANNEL_HTTP_TRACK,
  SERVICE_TRACK,
  CHANNEL_HTTP,
  CHANNEL_HTTP_REDIR
} from '@app/constants';
import {
  QueryParams
} from './http_server';

// === Rounting based on
export interface RouteOn {
  method: string;
  contentType: string;
  query: { [key: string]: any };
  path: string,
  origin: string
}

// === Route structs
export interface RouteParams {
  [key: string]: string; // other params
};

export interface RouteParamsRedir extends RouteParams {
  category: string;
  name: string;
}

export interface RouteParamsWebHook extends RouteParams {
  service: string;
  name: string;
}

export interface RequestHandlerPayload {
  params: RouteParams;
  query: QueryParams;
};

export interface RequestHandlerResult {
  key: string;
  channel: string;
  status: number;
  params?: RouteParams;
  location?: string;
  contentType?: string;
};


export type RequestHandler = (payload: RequestHandlerPayload) => RequestHandlerResult;

export interface RouteResult {
  handler: RequestHandler;
  params: RouteParams | RouteParamsWebHook | RouteParamsRedir;
}


@Service()
export class Router {

  private log: Logger;
  private router: FindMyWay;
  private defaultRoute: RouteResult;

  constructor(logFactory: LogFactory) {
    this.log = logFactory.for(this);
    this.router = new FindMyWay();
    this.setupRoutes();
    console.log(this.router.prettyPrint());
    /** Default route (404) */
    this.defaultRoute = {
      params: {},
      handler: (payload: RequestHandlerPayload) => {
        return <RequestHandlerResult>Object.assign(payload, {
          key: PATH_HTTP_404,
          channel: CHANNEL_HTTP,
          status: STATUS_NOT_FOUND
        });
      }
    }
  }

  /**
   * Find match route, execute and return result
   * @param {routeOn} Request params
   * @returns {RequestHandlerResult}
   */
  route(routeOn: RouteOn): RequestHandlerResult {
    const matchedRoute = <RouteResult>this.router.find(routeOn.method, routeOn.path);
    const useRoute = matchedRoute ? matchedRoute : this.defaultRoute;
    const payload = <RequestHandlerPayload>{
      params: useRoute.params,
      query: routeOn.query
    };
    return useRoute.handler(payload)
  }

  /**
   * Installing defaults routes
   */
  setupRoutes() {

    const teapotHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        key: PATH_HTTP_418,
        channel: CHANNEL_HTTP,
        status: STATUS_TEAPOT
      }
    };

    const optionsHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        key: PATH_HTTP_OPTS,
        channel: CHANNEL_HTTP,
        status: STATUS_OK_NO_CONTENT,
      }
    };

    const trackHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        params: Object.assign({ service: SERVICE_TRACK }, payload.params),
        key: epglue(IN_INDEP, payload.params.name),
        // explicitly set content type because AJAX uses text/plain to avoid options request
        contentType: CONTENT_TYPE_JSON,
        channel: CHANNEL_HTTP_TRACK,
        status: STATUS_OK
      };
    };

    const pixelHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        params: payload.params,
        key: epglue(IN_INDEP, payload.params.name),
        channel: CHANNEL_HTTP_PIXEL,
        status: STATUS_OK
      };
    };

    /**
     * example: http://127.0.0.1:10001/redir/111/a/b?to=https%3A%2F%2Fya.ru
     * @param payload {routeOn}
     */
    const redirHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        params: payload.params,
        key: epglue(IN_REDIR, payload.params.service, payload.params.name),
        location: payload.query.to,
        status: STATUS_TEMP_REDIR,
        channel: CHANNEL_HTTP_REDIR,
      };
    };
    const webhookHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        params: payload.params,
        key: epglue(IN_INDEP, payload.params.service, payload.params.name),
        channel: CHANNEL_HTTP_WEBHOOK,
        status: STATUS_OK
      };
    };

    const libjsHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        key: PATH_HTTP_LIBJS,
        channel: CHANNEL_HTTP,
        status: STATUS_OK
      };
    };

    this.router.options('/track', optionsHandler);
    this.router.options('/wh', optionsHandler);

    this.router.get('/coffee', teapotHandler);
    this.router.get('/lib.js', libjsHandler);
    this.router.get('/img/:projectId/:service/:name', pixelHandler);
    this.router.get('/redir/:projectId/:service/:name', redirHandler);
    this.router.get('/wh/:projectId/:service/:name', webhookHandler);
    this.router.post('/wh/:projectId/:service/:name', webhookHandler);
    this.router.post('/track/:projectId/:name', trackHandler);
  }
}

