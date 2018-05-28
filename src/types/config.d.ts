import { Envs } from 'rockmets';

export type MappedType<T> = { [K in keyof T]: T[K] };

export { Envs };

// ##### HTTP #####

export interface IdentifyConfig {
  param: string;
  cookieMaxAge: number;
}

export interface HttpConfig {
  host: string;
  port: number;
}

export interface HttpsConfig extends HttpConfig {
  certFile: string;
  keyFile: string;
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

export interface WsConfig {
  path: string;
  http: HttpConfig;
  https: HttpsConfig;
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

export type KernelConfig = {
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

