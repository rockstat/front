
// BASE

export interface MessageIdTime {
  id: string;
  time: number;
}

export interface MessageKey {
  key: string;
}

export interface FlexOutgoingMessage extends Partial<MessageIdTime> {
  [key: string]: any;
}

export type IncMsg = { [key: string]: any } & BaseIncomingMessage;

export interface BaseIncomingMessage extends Partial<MessageIdTime> {
  name: string;
  group?: string;
  channel: string;
  uid?: string;
  data: { [key: string]: any }
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
