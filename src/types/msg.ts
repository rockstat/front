import { STATUS_OK, STATUS_TEMP_REDIR, STATUS_BAD_REQUEST, STATUS_INT_ERROR } from "@app/constants";

// ###### HTTP messages part


export interface HTTPTransportData {
  ip: string;
  userAgent: string;
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

export interface DispatchResultFields {
  location?: string;
  error?: string;
  errorCode?: number;
}

export type DispatchResult = { [k: string]: any } & DispatchResultFields;

export interface ClientHttpMessage extends BaseIncomingMessage {
  uid: string;
  ip: string;
  userAgent: string;
}

export interface WebHookMessage extends BaseIncomingMessage {
  service: string;
  name: string;
}


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
