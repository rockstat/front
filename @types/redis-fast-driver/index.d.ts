// Type definitions for
// Project:
// Definitions by: Dmitry Rodin <https://github.com/madiedinro>
// TypeScript Version: 2.7


// https://github.com/djanowski/yoredis

/// <reference types="node" />


declare module 'redis-fast-driver' {

  import { EventEmitter } from "events";


  class Redis extends EventEmitter {
    constructor(options: RedisOptions);

    connect(): void;
    reconnect(): void;
    end(): void;
    selectDb(cb: Function): void;
    sendAuth(cb: Function): void;
    rawCall(args: Array<any>, cb: Function): void;
    rawCallAsync(args: Array<any>): Promise<any>
  }

  interface RedisOptions {
      host: string;
      port: number;
      db: number;
      auth: boolean;
      maxRetries: number;
      tryToReconnect: boolean;
      reconnectTimeout: number;
      autoConnect: boolean;
      doNotSetClientName: boolean;
      doNotRunQuitOnEnd: boolean;
    }

  namespace Redis {

  }

  // const RootRedis: Redis.Redis & { Redis: new () => Redis.Redis };

  export = Redis;

}

