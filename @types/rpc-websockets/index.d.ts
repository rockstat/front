// Type definitions for
// Project:
// Definitions by: Dmitry Rodin <https://github.com/madiedinro>

// https://github.com/qaap/rpc-websockets/blob/master/src/lib/client.js

/// <reference types="node" />


declare module 'rpc-websockets' {

  import { EventEmitter } from "events";

  interface ClientConfig {
    autoconnect?: boolean;
    reconnect?: boolean;
    reconnect_interval?: number;
    max_reconnects?: number
  }

  export class Client extends EventEmitter {
    constructor(address: string, options?: ClientConfig);

    call(method: string, params: object | Array<any>, timeout?: number, ws_opts?: object): Promise<any>;
    notify(method: string, params?: object | Array<any>): Promise<any>;
    subscribe(event: string): Promise<any>;
    unsubscribe(event: string): Promise<any>;
  }

}
