import { Envs } from 'rock-me-ts';

export type MappedType<T> = { [K in keyof T]: T[K] };

export { Envs };

// ##### HTTP #####

export interface IdentifyConfig {
  param: string;
  cookieMaxAge: number;
  cookieDomain?: string;
  cookiePath?: string;
}

export interface HTTPServiceMapParams {
  [k: string]: string
}

export type LegacyRoutesConfig = Array<['post' | 'get', string]>;

export interface HttpConfig {
  host: string;
  port: number;
  channels: HTTPServiceMapParams
  routes?: LegacyRoutesConfig
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

// ##### TRACKING #####

export type BrowserLibConfig = {
  file: string;
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


// ##### CONFIG ROOT #####

export type FrontierConfig = {
  name: string;
  env: Envs;
  http: HttpConfig;
  websocket: WsConfig;
  identify: IdentifyConfig;
  static: { [key in Envs]: BrowserLibConfig };
  client: {
    common: ClientConfig;
  }
}

