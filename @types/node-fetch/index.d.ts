// Type definitions for node-fetch v2.1.1
// Project: https://github.com/bitinn/node-fetch
// Definitions by: Dmitry Rodin <https://github.com/madiedinro>
// Based on https://github.com/torstenwerner
///<reference types="node" />

declare module 'node-fetch' {

  import { Agent } from "http";

  export class Request extends Body {
    constructor(input: string | Request, init?: RequestInit);
    method: string;
    url: string;
    headers: Headers;
    referrer: string;
    redirect: RequestRedirect;
    clone: Request;

    //node-fetch extensions to the whatwg/fetch spec
    compress: boolean;
    agent?: Agent;
    counter: number;
    follow: number;

    hostname: string;
    protocol: string;
    port?: number;
    timeout: number;
    size: number;
  }

  interface RequestInit {
    //whatwg/fetch standard options
    method?: string;
    headers?: HeaderInit | { [index: string]: string };
    body?: BodyInit;
    redirect?: RequestRedirect;

    //node-fetch extensions
    timeout?: number; //=0 req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies)
    compress?: boolean; //=true support gzip/deflate content encoding. false to disable
    size?: number; //=0 maximum response body size in bytes. 0 to disable
    agent?: Agent; //=null http.Agent instance, allows custom proxy, certificate etc.
    follow?: number; //=20 maximum redirect count. 0 to not follow redirect
    //node-fetch does not support mode, cache or credentials options
  }

  type RequestMode = "same-origin" | "no-cors" | "cors";
  type RequestRedirect = "follow" | "error" | "manual";
  type RequestCredentials = "omit" | "same-origin" | "include";
  type RequestCache =
    "default" | "no-store" | "reload" | "no-cache" |
    "force-cache" | "only-if-cached";

  export class Headers {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | undefined | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    forEach(callback: (value: string, name: string, thisArg?: any) => void, thisArg?: any): void;
    raw(): object;
    keys: Iterator<string>
    values: Iterator<string>
  }

  export class Body {
    bodyUsed: boolean;
    body: NodeJS.ReadableStream;
    arrayBuffer: Promise<ArrayBuffer>;
    blob: Promise<Blob>
    timeout: number;
    size: number;
    buffer(): Promise<Buffer>;
    json(): Promise<any>;
    json<T>(): Promise<T>;
    text(): Promise<string>;
    textConverted: Promise<string>;
  }

  export class Response extends Body {
    constructor(body?: BodyInit, opts?: ResponseInit);
    static error(): Response;
    static redirect(url: string, status: number): Response;
    type: ResponseType;
    url: string;
    status: number;
    ok: boolean;
    size: number;
    statusText: string;
    timeout: number;
    headers: Headers;
    clone(): Response;
  }

  export class FetchError extends Error {
    constructor(message: string, type: string, systemError?: Error)
    name: string;
    message: string;
    type: string;
    code: number;
    errno: number;
  }

  type ResponseType = "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect";

  interface ResponseInit {
    status: number;
    url: string;
    statusText?: string;
    headers?: HeaderInit;
  }

  type HeaderInit = Headers | Array<string>;
  type BodyInit = ArrayBuffer | ArrayBufferView | string | NodeJS.ReadableStream;
  type RequestInfo = Request | string;

  export default function fetch(url: string | Request, init?: RequestInit): Promise<Response>;
}
