import { IncomingMessage, ServerResponse } from 'http';
import { Service, Inject, Container } from 'typedi';
import * as FindMyWay from 'find-my-way';
import { Logger } from 'rock-me-ts';
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
  PATH_HTTP_TEAPOT,
  STATUS_TEAPOT,
  CHANNEL_HTTP_PIXEL,
  CHANNEL_HTTP_TRACK,
  SERVICE_TRACK,
  CHANNEL_HTTP,
  CHANNEL_HTTP_REDIR,
  OTHER
} from '@app/constants';
import { HTTPRouteParams, RouteOn, HTTPRoutingResult, HTTPQueryParams } from '@app/types';



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
  params: HTTPRouteParams;
  query: HTTPQueryParams;
};




export type RequestHandler = (payload: RequestHandlerPayload) => HTTPRoutingResult;

export interface RouteResult {
  handler: RequestHandler;
  params: {
    [key: string]: string;
  };
}


export class Router {

  private log: Logger;
  private router: FindMyWay;
  private defaultRoute: RouteResult;

  constructor() {
    this.log = Container.get(Logger).for(this);
    this.router = new FindMyWay();
    this.setupRoutes();
    /** Default route (404) */
    this.defaultRoute = {
      params: {},
      handler: (payload: RequestHandlerPayload): HTTPRoutingResult => {
        return Object.assign(payload, {
          params: payload.params,
          key: PATH_HTTP_404,
          channel: CHANNEL_HTTP,
        });
      }
    }
  }

  /**
   * Find match route, execute and return result
   * @param {routeOn} Request params
   * @returns {HTTPRoutingResult}
   */
  route(routeOn: RouteOn): HTTPRoutingResult {
    const matchedRoute = <RouteResult>this.router.find(routeOn.method, routeOn.path);
    const useRoute = matchedRoute ? matchedRoute : this.defaultRoute;
    const params = {
      service: useRoute.params.service || OTHER,
      name: useRoute.params.name || OTHER,
      projectId: useRoute.params.projectId && Number(useRoute.params.projectId) || 0
    }
    const payload: RequestHandlerPayload = {
      params: params,
      query: routeOn.query
    };
    return useRoute.handler(payload)
  }

  /**
   * Installing defaults routes
   */
  setupRoutes() {

    const teapotHandler: RequestHandler = function (payload) {
      return {
        params: payload.params,
        key: PATH_HTTP_TEAPOT,
        channel: CHANNEL_HTTP,
      }
    };

    const trackHandler: RequestHandler = function (payload) {
      payload.params.service = SERVICE_TRACK;
      return {
        params: payload.params,
        key: epglue(IN_INDEP, SERVICE_TRACK, payload.params.name),
        // explicitly set content type because AJAX uses text/plain to avoid options request
        contentType: CONTENT_TYPE_JSON,
        channel: CHANNEL_HTTP_TRACK,
      };
    };

    const pixelHandler: RequestHandler = function (payload) {
      return {
        params: payload.params,
        key: epglue(IN_INDEP, payload.params.service, payload.params.name),
        channel: CHANNEL_HTTP_PIXEL,
      };
    };

    /**
     * example: http://127.0.0.1:10001/redir/111/a/b?to=https%3A%2F%2Fya.ru
     */
    const redirHandler: RequestHandler = function (payload) {
      return {
        params: payload.params,
        key: epglue(IN_REDIR, payload.params.service, payload.params.name),
        channel: CHANNEL_HTTP_REDIR,
      };
    };
    const webhookHandler: RequestHandler = function (payload) {
      return {
        params: payload.params,
        key: epglue(IN_INDEP, payload.params.service, payload.params.name),
        channel: CHANNEL_HTTP_WEBHOOK,
      };
    };

    const libjsHandler = function (payload: RequestHandlerPayload): HTTPRoutingResult {
      return {
        params: { service: OTHER, name: OTHER, projectId: 0 },
        key: PATH_HTTP_LIBJS,
        channel: CHANNEL_HTTP,
      };
    };

    this.registerRoute('get', '/coffee', teapotHandler);
    this.registerRoute('get', '/lib.js', libjsHandler);
    this.registerRoute('get', '/img/:projectId/:service/:name', pixelHandler);
    this.registerRoute('get', '/redir/:projectId/:service/:name', redirHandler);
    this.registerRoute('get', '/wh/:projectId/:service/:name', webhookHandler);
    this.registerRoute('post', '/wh/:projectId/:service/:name', webhookHandler);
    this.registerRoute('post', '/track/:projectId/:name', trackHandler);
  }

  registerRoute(method: 'post' | 'get', path: string, handler: RequestHandler) {
    this.log.info(`Registering route: ${path}`);
    this.router[method](path, handler);
  }

}

