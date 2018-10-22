import {
  // IncomingMessage as OrigIncomingMessage,
  IncomingHttpHeaders as OrigIncomingHttpHeaders
} from 'http';

import { HTTPHeaders, HTTPHeader } from '@rockstat/rock-me-ts';

export { HTTPHeader, HTTPHeaders };

import { UrlWithStringQuery } from 'url';
import { HTTPTransportData } from '@app/types/msg';

export type HTTPBodyParams = { [key: string]: any }
export type HTTPQueryParams = { [key: string]: any }


export interface HTTPRequestStruct {
  method: string;
  userAgent?: string;
  contentType?: string;
  realIp: string;
  origin: string;
  referer?: string;
  cookies: { [k: string]: string };
  query: { [k: string]: string };
  pathParts: Array<string | undefined>;
  path: string;
}



// === Rounting based on
export interface RouteOn {
  method: string;
  contentType: string;
  query: { [key: string]: any };
  cookie: { [key: string]: any };
  body: { [key: string]: any };
  path: string;
  origin: string;
  uid: string;
  service: string;
  name: string;
  projectId?: number;
  td: HTTPTransportData
}

export interface HTTPRouteParams {
  service: string;
  name: string;
  projectId: number;
}

export interface HTTPRoutingResult {
  key: string;
  channel: string;
  params: HTTPRouteParams;
  location?: string;
  contentType?: string;
}



// === Response


export type HandledResult = {
  data: any;
  headers: HTTPHeaders;
  statusCode: number;
}
