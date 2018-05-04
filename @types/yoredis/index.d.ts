// Type definitions for
// Project:
// Definitions by: Dmitry Rodin <https://github.com/madiedinro>
// TypeScript Version: 2.7


// https://github.com/djanowski/yoredis

/// <reference types="node" />

declare module 'yoredis' {

  interface YoRedisOptions {
    url?: string;
  }

  class YoRedis {
    new(): YoRedis;
    constructor(options: YoRedisOptions);
    call(func: string, ...args: any[]): Promise<any>
    callMany(cmd1: any[], ...cmds: any[]): Promise<any>
  }

  export = YoRedis

}

