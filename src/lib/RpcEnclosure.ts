// import { } from "bluebird";
import { Service, Inject, Container, Token } from "typedi";
import { IdGenShowFlake, Configurer } from "@app/lib";
import { handleSetup } from "@app/helpers/class";
import { RedisClient } from "@app/lib/RedisClient";
import { Logger, LogFactory } from "@app/log";
import { METHODS } from "http";
import { reject } from "bluebird";
import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from "constants";

// RPC refs
// https://github.com/tedeh/jayson/blob/master/lib/utils.js
// https://github.com/qaap/rpc-websockets/blob/master/src/lib/client.js
// https://github.com/scoin/multichain-node/blob/development/lib/client.js
// http://www.jsonrpc.org/specification

type RPCParams = { [k: string]: any };
type RequestHandler<T> = (params: T) => any;

type RPCId = string
type RPC20 = '2.0'

export interface RPCRequest {
  jsonrpc: "2.0";
  method: string;
  params: any;
  id?: RPCId;
  _from?: string;
}

export interface RPCResponse {
  jsonrpc: RPC20;
  result: any;
  method?: string;
  id?: RPCId;
}

export interface RPCResponseError {
  jsonrpc: RPC20;
  id?: RPCId;
  result?: any;
  method?: string;
  error: RPCError;
}

interface RPCError {
  message: string;
  code: number;
  data?: any;
}

interface RpcHandlers {
  [k: string]: RequestHandler<any>;
}
export const redisSub = new Token<RedisClient>();
export const redisPub = new Token<RedisClient>();


@Service()
export class RPCEnclosure {

  started: boolean = false;
  name: string = 'kernel';
  timeout: number = 10000;
  queue: {
    [k: string]: {
      resolve: (value?: any | PromiseLike<any>) => void,
      reject: (reason?: any) => void,
      timeout: NodeJS.Timer
    } | undefined
  } = {};

  methods: RpcHandlers = {};
  log: Logger;

  @Inject()
  logFactory: LogFactory

  rsub: RedisClient;
  rpub: RedisClient;

  @Inject()
  configurer: Configurer

  @Inject()
  idGen: IdGenShowFlake;

  setup() {
    handleSetup(this);
    this.log = this.logFactory.for(this);

    Container.set(redisSub, new RedisClient())
    Container.set(redisPub, new RedisClient())


    this.rsub = Container.get(redisSub);
    this.rsub.setup();
    this.rsub.on('connect', () => {
      this.rsub.subscribe('kernel', this.redisMsg);
    })

    this.rpub = Container.get(redisPub);
    this.rpub.setup();
  }

  private decodeEnvelope(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch (error) {
      this.log.error('Redis decode payload error', error);
      return;
    }
  }

  private encodeEnvelope(data: any): string | void {
    try {
      return JSON.stringify(data);
    } catch (error) {
      this.log.error('Redis encode payload error', error);
      return;
    }
  }

  publish(channel: string, msg: RPCRequest | RPCResponse | RPCResponseError): void {
    this.log.debug('\n <---', msg)
    this.rpub.publish(channel, this.encodeEnvelope(msg));
  }

  redisMsg = (redismsg: Array<string>) => {

    if (redismsg[0] === 'message' || redismsg[0] === 'pmessage') {

      const raw = redismsg[redismsg.length - 1];
      const msg = this.decodeEnvelope(raw);

      this.log.debug('\n --> ', msg);

      if (msg && msg.jsonrpc && msg.method && msg.params !== undefined) {

        const names = msg.method.split(':'); ''
        if (names.length === 3 && this.methods[names[1]]) {
          msg._from = names[2];
          msg.method = names[1]
          this.dispatchRequest(msg).then(res => {
            if (res) {
              this.publish(names[2], res);
            }
          })
        }
      }

      if (msg && msg.jsonrpc && msg.result !== undefined) {
        this.dispatchResponse(msg)
      }
    } else {
      this.log.warn('unhandled cmd', redismsg);
    }
  }

  async dispatch(envelope: RPCResponse): Promise<void> {

  }

  async dispatchResponse(msg: RPCResponse): Promise<void> {
    // handling RPC Response object
    if (msg.id) {
      const node = this.queue[msg.id];
      if (node) {
        if (node.resolve) {
          node.resolve(msg.result)
        }
        if (node.timeout) {
          clearTimeout(node.timeout)
        }
        this.queue[msg.id] = undefined;
      }
    }
  }


  async dispatchRequest(envelope: RPCRequest): Promise<RPCResponse | RPCResponseError> {
    const { method } = envelope;
    try {
      const result = await this.methods[method](envelope.params || {});
      const msg: RPCResponse = {
        jsonrpc: '2.0',
        method: method,
        result: result || null,
        id: envelope.id
      }
      return msg;
    } catch (error) {
      return this.wrapError(error);
      this.log.error('handler exec error', error);
    }
  }


  // private wrap(method: string, params?: RPCParams): RPCEnvelope {

  // }

  request<T>(service: string, method: string, params?: { [k: string]: any }): Promise<T> {
    return new Promise<any>((resolve, reject) => {

      const rpcId = this.idGen.take();
      const envelope: RPCRequest = {
        jsonrpc: "2.0",
        id: rpcId,
        method: `${service}:${method}:${this.name}`,
        params: params || null
      }

      this.queue[rpcId] = {
        resolve,
        reject,
        timeout: setTimeout(() => {
          const func = this.queue[rpcId];
          if (func) {
            this.queue[rpcId] = undefined;
            func.reject();
          }
        }, this.timeout)
      };
      this.publish(service, envelope)
    })
  }

  register<T>(method: string, func: RequestHandler<T>): void {
    this.methods[method] = func;
  }

  wrapError(error: Error, code?: number): RPCResponseError {
    return {
      id: "0",
      jsonrpc: "2.0",
      error: {
        code: code || 0,
        message: error.message,
        data: error.stack || {}
      }
    }
  }
}
