
/// <reference types="node" />

declare module 'event-pubsub/es6' {

  class EventPubSub {
    constructor(scope?: any);
    on(type: string, handler: (type: string, ...args: any[]) => void, once?: boolean): void;
    once(type: string, handler: (type: string, ...args: any[]) => void): void;
    off(type: string, handler: (type: string, ...args: any[]) => void): void;
    emit(type: string, ...args: any[]): void;
  }

  namespace EventPubSub { }
  export = EventPubSub;

}

