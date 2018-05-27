export type Envs = 'dev' | 'prod' | 'stage';
export type MappedType<T> = { [K in keyof T]: T[K] };

// ##### LOGS #####

export interface PinoConfig {
  name?: string;
  safe?: boolean;
  level?: string;
  prettyPrint?: boolean;
}

type Loggers = 'pino'
export interface LoggerConfig {
  use: Loggers;
  pino: PinoConfig;
}

// ##### METRICS #####

export interface StatsDClientConfig {
  prefix?: string;
  tcp?: boolean;
  socketTimeout?: number;
  tags?: { [k: string]: string | number }
}

export interface StatsDUDPConfig extends StatsDClientConfig {
  tcp?: false;
  host: string;
  port: number;
  ipv6?: boolean;
}

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

// ##### REMOTE SERVICES #####

export type RemoteHttpServiceConfig = {
  prefix: string;
  class: string;
  baseUrl: string;
  location: string;
  methods: { [key: string]: string };
  handlers: Array<string>
}

export type RemoteServiceConfig = RemoteHttpServiceConfig;
export type RemoteServicesConfig = { [key: string]: RemoteServiceConfig };


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


// ##### CLICKHOUSE #####

type WriterCHTableOptsType = "engine" | "extend";
type WriterCHTableCols = { [key: string]: any };
type WriterCHTableOpts = { [key in WriterCHTableOptsType]: string };

export type WriterCHTableDefinition = WriterCHTableCols & {
  _options: WriterCHTableOpts;
};

export type WritersConfig = MappedType<'clickhouse' | 'mixpanel'>
export type WriterCHTables = { [key: string]: WriterCHTableDefinition };

export type WriterClickHouseConfig = {
  enabled: boolean;
  dsn: string;
  uploadInterval: number; // seconds
  sync: boolean;
  distribution: { [key: string]: any };// incoming data distribotion among tables, using internal routing key
  base: WriterCHTableCols; // common fields for all tables
  tables: WriterCHTables; // tables definition
};

// ##### REDIS #####

export interface RedisConfig {
  host: string;
  port: number;
  db: number;
  auth: boolean;
  maxRetries: number;
  tryToReconnect: boolean;
  reconnectTimeout: number;
  autoConnect: boolean;
  doNotSetClientName: boolean;
  doNotRunQuitOnEnd: boolean;
}

// ##### RPC #####
export interface RPCConfig {
  name: string;
  listen_all: boolean;
  listen_direct: boolean;
}

// ##### CONFIG ROOT #####

export type Config = {
  name: string;
  env: Envs;
  services: RemoteServicesConfig;
  writers: {
    clickhouse: WriterClickHouseConfig;
  }
  http: HttpConfig;
  redis: RedisConfig;
  websocket: WsConfig;
  identify: IdentifyConfig;
  log: LoggerConfig;
  ipc: object;
  browserLib: { [key in Envs]: BrowserLibConfig };
  client: {
    common: ClientConfig;
  }
  fixtures: any;
  metrics: {
    statsd?: StatsDUDPConfig;
  };
  rpc: RPCConfig;

}

export type ConfigSection = {}
