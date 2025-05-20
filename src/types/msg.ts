import { Dictionary } from "./base";

// ###### HTTP messages part


export interface HTTPTransportData {
  ip: string;
  ua?: string;
  // Fingerprint based on ip address and browser user-agent
  fpid?: string;
  host?: string;
  // http referer
  ref?: string;
  // page path
  path?: string;
}

// ###### BASE MESSAGING

export interface MessageIdTime {
  id: string;
  time: number;
}

export interface IncomingMsgData {
  [key: string]: any
}

export interface IncomingMessageProps {
  // dispatching key
  key: string;
  // service identifier
  service: string;
  // service event name identifier
  name: string;
  // extension
  ext?: string;
  // channel name
  channel: string;
  // hz
  projectId?: number;
  // user identifier
  uid?: string;
  // uid param
  uid_param?: string;
  // Transport-specific data
  td?: HTTPTransportData;
  // message payload
  data: IncomingMsgData;
  pancake?: IncomingMsgData;
}


export type BaseIncomingMessage = IncomingMessageProps & Partial<MessageIdTime>;
export type IncomingMessage = IncomingMessageProps & MessageIdTime;
export type BaseIncomingMessageWithBatch = [BaseIncomingMessage, Array<BaseIncomingMessage>];

// ###### BUS

export type BusMsgHdr = (key: string, msg: BaseIncomingMessage) => Promise<any>;

export interface BusBaseEnricher {
  handle: (key: string, msg: BaseIncomingMessage) => Promise<Dictionary<any>>;
}

export type BusMsgHdrResult = PromiseLike<any>
export type BusMsgHdrsResult = PromiseLike<any[]>

export interface ServiceStatusStructRegisterOptions {
  keys: Array<string>
  props: { [k: string]: string }
  alias?: string
}


export interface ServiceStatusStructRegisterItem {
  method: string,
  role: string,
  options: ServiceStatusStructRegisterOptions
}

export interface ServiceStatusStructData {
  name: string,
  app_started: number,
  app_uptime: number,
  app_state: string,
  register: Array<ServiceStatusStructRegisterItem>
}

export interface ServiceStatusStruct {
  type__: 'data',
  statusCode: Number,
  data: ServiceStatusStructData
}