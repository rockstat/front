import { IncomingMessage, ServerResponse } from "http";
import * as Redis from "redis-fast-driver";

export type anyobj = { [key: string]: any };

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
  [key: string]: any;
}

type IndepIncomingMessage = { [key: string]: any } & BaseIncomingMessage;

interface BaseIncomingMessage extends Partial<MessageIdTime> {
  name: string;
  group?: string;
  channel?: string;
  uid?: string;
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


export interface EnrichService {
  enrich: (key: string, msg: { [key: string]: any }) => Promise<string | undefined> | undefined;
}


export type RemoteServices = { [key: string]: RemoteService };
export type RemoteService = EnrichService & {
  register: (dispatcher: Dispatcher) => void
}

export type Headers = Array<[string, string | string[]]>;

