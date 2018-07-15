import { IncomingMessage, ServerResponse } from 'http';
import { Service, Inject, Container } from 'typedi';
import * as FindMyWay from 'find-my-way';
import { Logger, Meter } from 'rock-me-ts';
import { epglue } from '@app/helpers';
import {
  PATH_HTTP_404,
  PATH_HTTP_LIBJS,
  IN_REDIR,
  IN_GENERIC,
  CHANNEL_HTTP_WEBHOOK,
  PATH_HTTP_TEAPOT,
  CHANNEL_HTTP_PIXEL,
  CHANNEL_HTTP,
  CHANNEL_HTTP_REDIR,
  OTHER
} from '@app/constants';
import {
  HTTPRouteParams,
  RouteOn,
  HTTPRoutingResult,
  HTTPQueryParams,
  HttpConfig,
  HTTPServiceMapParams,
  LegacyRoutesConfig
} from '@app/types';
import { throws } from 'assert';


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
  private metrics: Meter;
  private prefix: string;
  private customRoutes?: LegacyRoutesConfig;
  private serviceMap: HTTPServiceMapParams

  constructor(options: HttpConfig) {
    this.router = new FindMyWay();
    this.serviceMap = options.channels;
    this.customRoutes = options.routes;
    this.log = Container.get(Logger).for(this);
    this.metrics = Container.get(Meter);
    this.setupRoutes();
    // Default route (404)
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

    const teapotHandler: RequestHandler = (payload) => {
      return {
        params: payload.params,
        key: PATH_HTTP_TEAPOT,
        channel: CHANNEL_HTTP,
      }
    };

    // const pixelHandler: RequestHandler = (payload) => {
    //   this.metrics.tick('request.pixel');
    //   return {
    //     params: payload.params,
    //     key: epglue(IN_GENERIC, payload.params.service, payload.params.name),
    //     channel: CHANNEL_HTTP_PIXEL,
    //   };
    // };

    // /**
    //  * example: http://127.0.0.1:10001/redir/111/a/b?to=https%3A%2F%2Fya.ru
    //  */
    // const redirHandler: RequestHandler = (payload) => {
    //   this.metrics.tick('request.redir');
    //   return {
    //     params: payload.params,
    //     key: epglue(IN_REDIR, payload.params.service, payload.params.name),
    //     channel: CHANNEL_HTTP_REDIR,
    //   };
    // };

    // const webhookHandler: RequestHandler = (payload) => {
    //   this.metrics.tick('request.wh');
    //   return {
    //     params: payload.params,
    //     key: epglue(IN_GENERIC, payload.params.service, payload.params.name),
    //     channel: CHANNEL_HTTP_WEBHOOK,
    //   };
    // };


    const libjsHandler: RequestHandler = (payload) => {
      this.metrics.tick('request.jslib');
      return {
        params: { service: OTHER, name: OTHER, projectId: 0 },
        key: PATH_HTTP_LIBJS,
        channel: CHANNEL_HTTP,
      };
    };

    const genericHandler: RequestHandler = (payload) => {
      this.metrics.tick('request.generic');
      const { service, name } = payload.params;
      const msgChannel = this.serviceMap[service] !== undefined
        ? this.serviceMap[service]
        : CHANNEL_HTTP
      const routeChannel = msgChannel === CHANNEL_HTTP_REDIR
        ? IN_REDIR
        : IN_GENERIC
      return {
        params: payload.params,
        key: epglue(routeChannel, service, name),
        channel: msgChannel,
      };
    };

    this.registerRoute('get', `/coffee`, teapotHandler);
    this.registerRoute('get', `/lib.js`, libjsHandler);

    this.registerRoute('get', `/:service/:name`, genericHandler);
    this.registerRoute('get', `/:service/:name/:projectId`, genericHandler);
    this.registerRoute('post', `/:service/:name`, genericHandler);
    this.registerRoute('post', `/:service/:name/:projectId`, genericHandler);

    if (this.customRoutes) {
      for (const [method, path] of this.customRoutes) {
        this.registerRoute(method, path, genericHandler);
      }
    }
  }

  registerRoute(method: 'post' | 'get', path: string, handler: RequestHandler) {
    this.log.info(`Registering route: ${path}`);
    this.router[method](path, handler);
  }

}

