import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from "http";

export type Dictionary<T> = Partial<{ [key: string]: T }>;

export type AnyStruct = Partial<{ [key: string]: any | never }>;
