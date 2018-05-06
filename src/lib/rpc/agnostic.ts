import { EventEmitter } from "events";

import { Service, Inject, Container, Token } from "typedi";

import { IdService, Configurer } from "@app/lib";
import { handleSetup } from "@app/helpers/class";
import { Logger, LogFactory } from "@app/log";
import { METHODS } from "http";
import { reject, method } from "bluebird";
import { RPCAdapter } from "@app/lib/rpc/adapter/abstract";
import { RPCConfig, RPCRequest, RPCResponse, RPCResponseError, RPCRequestParams } from "@app/types";
import { SERVICE_KERNEL } from "@app/constants";
import { StatsDMetrics } from "@app/lib/metrics";


// RPC refs
// https://github.com/tedeh/jayson/blob/master/lib/utils.js
// https://github.com/qaap/rpc-websockets/blob/master/src/lib/client.js
// https://github.com/scoin/multichain-node/blob/development/lib/client.js
// http://www.jsonrpc.org/specification

const RPC20 = '2.0';

type RequestHandler<T> = (params: T) => any;

interface RpcMethods {
  [k: string]: RequestHandler<any>;
}

interface RPCWaitingCall {
  resolve: (value?: any | PromiseLike<any>) => void;
  reject: (reason?: any) => void;
  timing: Function;
  timeout: NodeJS.Timer;
}
type RPCWaitingCalls = { [k: string]: RPCWaitingCall | undefined };


@Service()
export class RPCAgnostic {

  @Inject()
  ids: IdService;

  @Inject()
  metrics: StatsDMetrics;

  config: RPCConfig;
  started: boolean = false;
  timeout: number = 3000;
  log: Logger;
  queue: RPCWaitingCalls = {};
  methods: RpcMethods = {};
  adapter: RPCAdapter;

  constructor(config: Configurer, logFactory: LogFactory) {
    this.config = config.get('rpc');
    this.log = logFactory.for(this);
  }

  setup(adapter: RPCAdapter) {
    handleSetup(this);
    this.adapter = adapter;
    this.log.info('started');
  }

  publish(msg: RPCRequest | RPCResponse | RPCResponseError): void {
    if ('method' in msg && msg.method !== undefined) {
      msg.method = `${msg.to}:${msg.method}:${SERVICE_KERNEL}`;
    }
    this.adapter.send(msg.to, msg)
  }

  dispatch = async (msg: RPCResponse | RPCResponseError | RPCRequest): Promise<void> => {
    if ('method' in msg && msg.method !== undefined) {
      const names = msg.method.split(':');
      if (names.length === 3) {
        msg.from = names[0];
        msg.method = names[1];
        msg.to = names[2];
      }
    }
    if ('method' in msg && msg.method !== undefined && msg.to && msg.params !== undefined) {
      this.dispatchRequest(msg).then(res => {
        if (res) {
          this.publish(res);
        }
      })
    }
    else if ('id' in msg && msg.id !== undefined && ('result' in msg || 'error' in msg)) {
      this.dispatchResponse(msg)
    }
  }

  async dispatchResponse(msg: RPCResponse | RPCResponseError): Promise<void> {
    const call = this.queue[msg.id];
    if (call) {
      if (call.timeout) {
        clearTimeout(call.timeout)
      }
      if ('result' in msg && call.resolve) {
        call.timing();
        call.resolve(msg.result);
      }
      if ('error' in msg && call.reject) {
        this.metrics.tick('rpc.error')
        call.reject(msg.error);
      }
      this.queue[msg.id] = undefined;
    }
  }

  async dispatchRequest(msg: RPCRequest): Promise<RPCResponse | RPCResponseError | undefined> {
    const { method, from } = msg;
    try {
      const result = await this.methods[method](msg.params || {});
      if ('id' in msg && msg.id !== undefined) {
        return {
          jsonrpc: RPC20,
          id: msg.id,
          from: SERVICE_KERNEL,
          to: from,
          result: result || null
        }
      }
    } catch (error) {
      return this.wrapError(msg, error);
      this.log.error('handler exec error', error);
    }
  }

  notify(service: string, method: string, params: RPCRequestParams = null): void {
    const msg: RPCRequest = {
      jsonrpc: RPC20,
      from: SERVICE_KERNEL,
      to: service,
      method: method,
      params: params
    }
    this.publish(msg)
  }

  request<T>(service: string, method: string, params: RPCRequestParams = null): Promise<T> {
    return new Promise<any>((resolve, reject) => {
      const id = this.ids.rpcId();
      const msg: RPCRequest = {
        jsonrpc: RPC20,
        from: SERVICE_KERNEL,
        to: service,
        id: id,
        method: method,
        params: params || null
      }
      this.queue[id] = {
        resolve,
        reject,
        timing: this.metrics.timenote('rpc.request', { service, method }),
        timeout: setTimeout(() => {
          const call = this.queue[id];
          if (call) {
            this.queue[id] = undefined;
            call.reject();
          }
        }, this.timeout)
      };
      this.publish(msg)
    })
  }

  register<T>(method: string, func: RequestHandler<T>): void {
    this.methods[method] = func;
  }

  wrapError(msg: RPCRequest, error: Error, code?: number): RPCResponseError | undefined {
    if ('id' in msg && msg.id !== undefined) {
      return {
        id: msg.id,
        from: SERVICE_KERNEL,
        to: msg.from,
        jsonrpc: RPC20,
        error: {
          code: code || 0,
          message: error.message,
          data: error.stack || {}
        }
      }
    }
  }
}
