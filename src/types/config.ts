import { Envs } from '@rockstat/rock-me-ts';

export type MappedType<T> = { [K in keyof T]: T[K] };

export { Envs };

// ##### HTTP #####

export interface IdentifyConfig {
  param: string;
  cookieMaxAge: number;
  cookieDomain?: string;
  cookiePath?: string;
  domain?: string;
}

export interface HTTPServiceMapParams {
  [k: string]: string
}

export interface HTTPServiceParams {
  alias_for: string;
  uid_param?: string;
  collect_cookies?: Array<string>;
}

export interface HttpConfig {
  host: string;
  port: number;
  url_mark: string;
  sevices_map: HTTPServiceMapParams;
  services_params: { [k:string]: HTTPServiceParams }
}

// ##### WEBSOCKET #####


export interface wsDeflateConfig {
  zlibDeflateOptions: {
    chunkSize: number;
    memLevel: number;
    level: number;
  };
  zlibInflateOptions: {
    chunkSize: number;
  };
  clientNoContextTakeover: boolean;
  serverNoContextTakeover: boolean;
  clientMaxWindowBits: number;
  serverMaxWindowBits: number;
  concurrencyLimit: number;
  threshold: number;
}

export interface WsHTTPParams {
  host: string;
  port: number;
}

export interface WsConfig {
  path: string;
  http: WsHTTPParams;
  perMessageDeflate: wsDeflateConfig;
}

// ##### CLIENT #####

export type StaticConfig = {
  lib: string;
}

export type ClientConfig = {
  trackClicks: boolean;
  trackForms: boolean;
  trackActivity: boolean
  cookieDomain: string
  allowSendBeacon: boolean
  allowHTTP: boolean
  allowXHR: boolean
  activateWs: boolean
  wsPort: number
}


// ##### MSG BUS #####

export interface MsgBusConfig {
  enrichers: { [k: string]: Array<string> }
  handlers: { [k: string]: string }
  transformers: { [k: string]: Array<string> }
}


// ##### CONFIG ROOT #####

export type FrontierConfig = {
  name: string;
  version: string;
  env: Envs;
  http: HttpConfig;
  websocket: WsConfig;
  identify: IdentifyConfig;
  static: StaticConfig;
  client: {
    common: ClientConfig;
  };
  bus: MsgBusConfig;
}

