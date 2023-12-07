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
  // channel name
  channel: string;
  // hz
  projectId?: number;
  // user identifier
  uid?: string;
  // Transport-specific data
  td?: HTTPTransportData;
  // message payload
  data: IncomingMsgData;
}

export type BaseIncomingMessage = IncomingMessageProps & Partial<MessageIdTime>;
export type IncomingMessage = IncomingMessageProps & MessageIdTime;


// ###### BUS

export type BusMsgHdr = (key: string, msg: BaseIncomingMessage) => Promise<any>;

export interface BusBaseEnricher {
  handle: (key: string, msg: BaseIncomingMessage) => Promise<Dictionary<any>>;
}

export type BusMsgHdrResult = PromiseLike<any>
export type BusMsgHdrsResult = PromiseLike<any[]>

