import { STATUS_OK, STATUS_TEMP_REDIR, STATUS_BAD_REQUEST, STATUS_INT_ERROR } from "@app/constants";

// HTTP messages part


export interface HTTPTransportData {
  ip: string;
  userAgent: string;
}

// BASE



export interface MessageKey {
  key: string;
}

export interface FlexOutgoingMessage extends Partial<MessageIdTime> {
  [key: string]: any;
}

export interface MessageIdTime {
  id: string;
  time: number;
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
  // message payload
  data: { [key: string]: any }
}

export type BaseIncomingMessage = IncomingMessageProps & Partial<MessageIdTime>;
export type IncomingMessage = IncomingMessageProps & MessageIdTime;

type DispatchResults = typeof STATUS_OK | typeof STATUS_TEMP_REDIR | typeof STATUS_BAD_REQUEST | typeof STATUS_INT_ERROR;

export interface DispatchOK {
  code: typeof STATUS_OK;
  result: any;
}

export interface DispatchRedir {
  code: typeof STATUS_TEMP_REDIR;
  location: string;
}

export interface DispatchError {
  code: typeof STATUS_INT_ERROR | typeof STATUS_BAD_REQUEST
  error: string;
}

export type DispatchResult = { [k: string]: any } & (DispatchOK | DispatchRedir | DispatchError);

export interface ClientHttpMessage extends BaseIncomingMessage {
  uid: string;
  ip: string;
  userAgent: string;
}

export interface WebHookMessage extends BaseIncomingMessage {
  service: string;
  name: string;
}


// BUS

export type BusMsgHdr = (key: string, msg: any) => Promise<any>;
export type BusMsgHdrResult = PromiseLike<any>
export type BusMsgHdrsResult = PromiseLike<any[]>


// RPC

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

interface RPCErrorDetails {
  message: string;
  code: number;
  data?: any;
}

export interface RPCResponseError extends RPCBase {
  id: string;
  error: RPCErrorDetails;
}
