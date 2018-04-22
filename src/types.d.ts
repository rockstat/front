import { IncomingMessage, ServerResponse } from "http";

export type anyobj = { [key: string]: any };
export type MappedType<T> = { [K in keyof T]: T[K] };
export type Envs = 'dev' | 'prod' | 'stage';


type Dictionary<T> = Partial<{ [key: string]: T }>;


interface Dispatcher {
  registerHandler: () => void
  subscribe: () => void
  registerEnricher: () => void

}

/**
 * Messages
 */
interface MessageIdTime {
  id: string;
  time: Date;
}

interface MessageKey {
  key: string;
}

interface FlexOutgoingMessage extends Partial<MessageIdTime> {
  // data: { [key: string]: any };
  [key: string]: any;
}

interface BaseIncomingMessage extends Partial<MessageIdTime> {
  name: string;
  data: { [key: string]: any }
}

interface ClientHttpMessage extends BaseIncomingMessage {
  uid: string;
  ip: string;
  userAgent: string;
}

interface WebHookMessage extends BaseIncomingMessage {
  service: string;
  name: string;
}

interface WebHookMessage extends BaseIncomingMessage {
  service: string;
  action: string;
}

/**
 * Configs
 */
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
  https: HttpsConfig;
  perMessageDeflate: wsDeflateConfig;
}

export type RemoteHttpServiceConfig = {
  prefix: string;
  class: string;
  baseUrl: string;
  location: string;
  methods: { [key: string]: string };
  handlers: Array<string>
}

export type BrowserLibConfig = {
  file: string;
}

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

export interface TypeOrmConfig {
  entities: Array<Object>;
  [key: string]: any;
}

export type RemoteServiceConfig = RemoteHttpServiceConfig;
export type RemoteServicesConfig = { [key: string]: RemoteServiceConfig };
export type Config = {
  env: Envs;
  services: RemoteServicesConfig;
  writers: {
    clickhouse: WriterClickHouseConfig;
  }
  http: HttpConfig;
  websocket: WsConfig;
  identify: IdentifyConfig;
  log: LoggerConfig;
  ipc: object;
  browserLib: { [key in Envs]: BrowserLibConfig };
  client: {
    common: ClientConfig;
  }
  typeorm: TypeOrmConfig;
  fixtures: any;
}

export interface EnrichService {
  enrich: (key: string, msg: { [key: string]: any }) => Promise<string | undefined> | undefined;
}


export type RemoteServices = { [key: string]: RemoteService };
export type RemoteService = EnrichService & {
  register: (dispatcher: Dispatcher) => void
}



export type Headers = Array<[string, string | string[]]>;

