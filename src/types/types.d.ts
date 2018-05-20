import { IncomingMessage, ServerResponse } from "http";
import * as Redis from "redis-fast-driver";

type Dictionary<T> = Partial<{ [key: string]: T }>;


interface Dispatcher {
  registerHandler: () => void
  subscribe: () => void
  registerEnricher: () => void

}

export interface EnrichService {
  enrich: (key: string, msg: { [key: string]: any }) => Promise<string | undefined> | undefined;
}


export type RemoteServices = { [key: string]: RemoteService };
export type RemoteService = EnrichService & {
  register: (dispatcher: Dispatcher) => void
}

export type Headers = Array<[string, string | string[]]>;


