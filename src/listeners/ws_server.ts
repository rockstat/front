import { createServer as createHTTPSServer, Server as HTTPSServer } from 'https';
import { IncomingMessage } from 'http';
import { readFileSync, stat } from 'fs';
import { Socket } from 'net';
import { Service, Inject, Container } from 'typedi';
import * as WebSocket from 'ws';
import { Logger, TheIds, AppConfig } from "rock-me-ts";
import { Dispatcher } from '@app/lib';
import {
  HttpsConfig,
  WsConfig,
  Dictionary,
  BaseIncomingMessage,
  HttpConfig,
  FrontierConfig,
  IncomingMsgData,
  AnyStruct,
  DispatchResult,
} from '@app/types';
import {
  isObject, isString, isEmptyString, epglue, epchild
} from '@app/helpers';
import { parse as urlParse } from 'url';
import {
  OUT_WEBSOCK,
  CMD_WEBSOCK_ADD_GROUP,
  OUT_WEBSOCK_BROADCAST,
  STRING,
  CMD_WEBSOCK,
  IN_WEBSOCK_HELLO,
  IN_WEBSOCK,
  IN_GENERIC,
  CHANNEL_WEBSOCK,
  ERROR_NOT_OBJECT,
  STATUS_INT_ERROR,
  ERROR_ABSENT_DATA,
} from '@app/constants';

interface SockState {
  uid: string;
  authorized: boolean;
  touch: number;
  groups: Set<string>;
}

interface SockLookup {
  socket: WebSocket;
  state: SockState
}

interface AddToGroupPayload {

  uid: string;
  group: string;

}

export class WebSocketServer {
  server: HTTPSServer;
  wss: WebSocket.Server;
  options: WsConfig;
  secureOptions: { cert: Buffer, key: Buffer };
  socksState: WeakMap<WebSocket, SockState> = new WeakMap();
  log: Logger;
  dispatcher: Dispatcher;

  get httpOptions(): HttpConfig {
    return this.options.http;
  }

  constructor() {
    this.options = Container.get<AppConfig<FrontierConfig>>(AppConfig).ws;
    this.dispatcher = Container.get(Dispatcher);
    this.log = Container.get(Logger).for(this);
  }

  /**
   * Transform incoming data to Message struct
   * @param data object with data keys
   */
  private async handle(raw: WebSocket.Data, state: SockState) {
    let [error, data] = this.parse(raw);
    if (error) {
      this.log.error(error);
      return { error: error.message };
    }
    if (!data) {
      this.log.error(ERROR_ABSENT_DATA);
      return;
    }
    if (data.name === 'ping') {
      return;
    }
    const service = data.service && typeof data.service === 'string' ? data.service : 'noservice';
    const name = data.name && typeof data.name === 'string' ? data.name : 'noname';

    this.log.debug(`msg '${name}' received`);
    const msg: BaseIncomingMessage = {
      key: epglue(IN_GENERIC, service, name),
      name: name,
      service: service,
      channel: CHANNEL_WEBSOCK,
      data: data,
      uid: state.uid
    }

    return await this.dispatch(msg.key, msg);
  }

  private async dispatch(key: string, msg: BaseIncomingMessage): Promise<DispatchResult> {
    try {
      return await this.dispatcher.emit(key, msg);
    } catch (error) {
      this.log.warn(error);
      return {
        error: 'Internal error. Smth wrong.',
        errorCode: STATUS_INT_ERROR
      }
    }
  }

  /**
   * Parse JSON and check is an object
   * @param raw raw data buffer or similar
   */
  private parse(raw: WebSocket.Data): [Error, undefined] | [undefined, AnyStruct] {
    try {
      const data = JSON.parse(raw.toString());
      if (!isObject(data)) {
        throw new Error(ERROR_NOT_OBJECT)
      }
      return [undefined, data]
    } catch (error) {
      return [error, undefined]
    }
  }

  /**
   * Encode message before send
   * @param msg message struct
   */
  private encode(msg: any): string {
    return JSON.stringify(msg)
  }


  start() {
    const { host, port } = this.httpOptions;
    this.log.info(`Starting WS server on port ${host}:${port}`);
    const { perMessageDeflate, path } = this.options;
    const wssOptions = { host, port, path, perMessageDeflate };
    this.wss = new WebSocket.Server(wssOptions);
    this.setup();
    this.register();
  }

  /**
   * Setup Websocket common message handling
   */
  private setup() {
    this.wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
      this.log.debug('client connected');
      if (req.url) {
        const parsedUrl = urlParse(req.url, true);
        const { uid } = parsedUrl.query;
        // accept connections only users with id
        if (uid && typeof uid === 'string' && uid.length) {
          this.socksState.set(socket, {
            uid: uid,
            authorized: false,
            touch: new Date().getTime(),
            groups: new Set()
          });
          socket.on('close', (code: number, reason: string) => {
            this.log.debug(`closed ${code} ${reason}`);
          })
          socket.on('message', (raw) => {
            const state = this.socksState.get(socket);
            if (state) {
              state.touch = new Date().getTime();
              this.handle(raw, state).then(msg => {
                msg && socket.send(this.encode(msg));
              });
            }
          });
          return;
        }
      }
      this.log.info('Connection without url or credentials');
      socket.close();
    });
  }

  /**
   * Register in Dispatcher as listener.
   */
  register() {
    this.dispatcher.registerListener(OUT_WEBSOCK, async (key: string, data: any) => {
      switch (key) {
        case OUT_WEBSOCK_BROADCAST: return await this.sendBroadcast(data);
      }
    });
    this.dispatcher.registerListener(CMD_WEBSOCK, async (key: string, msg: { data: AddToGroupPayload }) => {
      switch (key) {
        case CMD_WEBSOCK_ADD_GROUP: return await this.addToGroup(msg.data);
      }
    });
  }

  /**
   * Find websocket assoociated with uid
   * @param uid user id
   */
  async findUidSock(uid: string): Promise<SockLookup | void> {
    for (const socket of this.wss.clients) {
      const state = this.socksState.get(socket);
      if (state && state.uid === uid) {
        return { socket, state };
      }
    }
  }

  /**
   * Add user by uid to the group
   * @param param0 user and group
   */
  async addToGroup({ uid, group }: AddToGroupPayload): Promise<void> {
    this.log.info(`addtogroup user ${uid} to ${group}`);
    const result = await this.findUidSock(uid);
    if (result) {
      const { socket, state } = result;
      state.groups.add(group);
    }
  }

  /**
   * Sending broascast message to the group of users
   * @param param0 message and meta data
   */
  async sendBroadcast({ name, data, group }: { group?: string, data: object, name: string }, ): Promise<void> {
    const raw = JSON.stringify({ name, data });
    for (const socket of this.wss.clients) {
      const state = this.socksState.get(socket);
      if (socket.readyState === WebSocket.OPEN && state && (!group || group && state.groups.has(group))) {
        socket.send(raw);
      }
    }
  }


}
