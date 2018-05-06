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
  IN_CUSTOM,
  IN_INDEP,
  CHANNEL_WEBHOOK
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
  channel?: string;
  params?: RouteParams;
  status: number;
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

    const optionsHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        key: PATH_HTTP_OPTS,
        status: STATUS_OK_NO_CONTENT
      }
    };

    const trackHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        key: epglue(IN_TRACK, payload.query.name),
        contentType: CONTENT_TYPE_JSON,
        status: STATUS_OK
      };
    };

    const pixelHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        key: epglue(IN_PIXEL, payload.query.name),
        status: STATUS_OK
      };
    };

    const redirHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        params: payload.params,
        key: epglue(IN_REDIR, payload.params.category, payload.params.name),
        status: STATUS_TEMP_REDIR
      };
    };
    const webhookHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        params: payload.params,
        channel: CHANNEL_WEBHOOK,
        key: epglue(IN_INDEP, payload.params.service, payload.params.name),
        status: STATUS_OK
      };
    };

    const libjsHandler = function (payload: RequestHandlerPayload): RequestHandlerResult {
      return {
        key: PATH_HTTP_LIBJS,
        status: STATUS_OK
      };
    };

    this.router.get('/lib.js', libjsHandler);
    this.router.get('/img', pixelHandler);
    this.router.options('/track', optionsHandler);
    this.router.post('/track', trackHandler);
    this.router.options('/wh', optionsHandler);
    this.router.options('/webhook', optionsHandler);
    this.router.get('/wh/:service/:name', webhookHandler);
    this.router.post('/wh/:service/:name', webhookHandler);
    this.router.get('/webhook/:projectId/:service/:name', webhookHandler);
    this.router.post('/webhook/:projectId/:service/:name', webhookHandler);
    this.router.get('/redir/:projectId/:category/:name', redirHandler);
  }
}

