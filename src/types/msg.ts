import { STATUS_OK, STATUS_TEMP_REDIR, STATUS_BAD_REQUEST, STATUS_INT_ERROR } from "@rockstat/rock-me-ts";

// ###### HTTP messages part


export interface HTTPTransportData {
  ip: string;
  ua?: string;
  // Fingerprint based on ip address and browser user-agent
  fpid?: string;
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


export interface ClientHttpMessage extends BaseIncomingMessage {
  uid: string;
  ip: string;
  userAgent: string;
}

export interface WebHookMessage extends BaseIncomingMessage {
  service: string;
  name: string;
}


export type BaseIncomingMessage = IncomingMessageProps & Partial<MessageIdTime>;
export type IncomingMessage = IncomingMessageProps & MessageIdTime;


// ###### BUS

export type BusMsgHdr = (key: string, msg: any) => Promise<any>;
export type BusMsgHdrResult = PromiseLike<any>
export type BusMsgHdrsResult = PromiseLike<any[]>


// ###### RPC

export interface RPCBase {
  jsonrpc: '2.0';
  to: string;
  from: string;
}

export type RPCRequestParams = { [k: string]: any } | null;

export interface RPCRequest extends RPCBase {
  id?: string;
  method: string;
  params: RPCRequestParams;
}

export interface RPCResponse extends RPCBase {
  id: string;
  result: any;
}

export interface RPCErrorDetails {
  message: string;
  code: number;
  data?: any;
}

export interface RPCResponseError extends RPCBase {
  id: string;
  error: RPCErrorDetails;
}
