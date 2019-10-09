import { createServer as createHTTPSServer, Server as HTTPSServer } from 'https';
import { IncomingMessage } from 'http';
import { Container } from 'typedi';
import * as WebSocket from 'ws';
import { Logger, AppConfig, response, BandResponse, STATUS_BAD_REQUEST, RESP_DATA, Meter } from "@rockstat/rock-me-ts";
import { Dispatcher } from '@app/Dispatcher';
import {
  WsConfig,
  BaseIncomingMessage,
  FrontierConfig,
  AnyStruct,
  WsHTTPParams,
  Dictionary,
  HTTPTransportData,
} from '@app/types';
import {
  isObject, epglue, extractTransportData
} from '@app/helpers';
import { parse as urlParse } from 'url';
import {
  OUT_WEBSOCK,
  CMD_WEBSOCK_ADD_GROUP,
  OUT_WEBSOCK_BROADCAST,
  CMD_WEBSOCK,
  IN_GENERIC,
  CHANNEL_WEBSOCK,
  ERROR_NOT_OBJECT,
  ERROR_ABSENT_DATA,
} from '@app/constants';

interface SockState {
  uid: string;
  authorized: boolean;
  touch: number;
  groups: Set<string>;
  td: HTTPTransportData;
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
  metrics: Meter;
  secureOptions: { cert: Buffer, key: Buffer };
  socksState: WeakMap<WebSocket, SockState> = new WeakMap();
  log: Logger;
  dispatcher: Dispatcher;

  get httpOptions(): WsHTTPParams {
    return this.options.http;
  }

  constructor() {
    this.options = Container.get<AppConfig<FrontierConfig>>(AppConfig).ws;
    this.dispatcher = Container.get(Dispatcher);
    this.log = Container.get(Logger).for(this);
    this.metrics = Container.get(Meter);
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
      this.metrics.tick('ws.connect');
      if (req.url) {
        const parsedUrl = urlParse(req.url, true);
        const { uid } = parsedUrl.query;
        // accept connections only users with id
        if (uid && typeof uid === 'string' && uid.length) {
          this.socksState.set(socket, {
            uid: uid,
            authorized: false,
            touch: new Date().getTime(),
            groups: new Set(),
            td: extractTransportData(req)
          });
          socket.on('close', (code: number, reason: string) => {
            this.log.debug(`closed ${code} ${reason}`);
            this.metrics.tick('ws.close')
          })
          socket.on('message', (raw) => {
            const requestTime = this.metrics.timenote('ws.message')
            this.metrics.tick('ws.message')
            const state = this.socksState.get(socket);
            if (state) {
              state.touch = new Date().getTime();
              this.handle(state, raw).then(resp => {
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(this.encode(resp));
                  requestTime();
                }
              }).catch(error => {
                this.log.error(error);
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
    * Transform incoming data to Message struct
    */
  private async handle(state: SockState, raw: WebSocket.Data): Promise<BandResponse> {
    let [error, data] = this.parse(raw);
    const reqId = data && data.id__;
    const resp = await this.doHandle(state, data, error);
    resp.id__ = reqId;
    return resp;
  }

  private async doHandle(state: SockState, data?: Dictionary<any>, error?: Error): Promise<BandResponse> {
    if (error) {
      this.log.error(error);
      return response.error({ statusCode: STATUS_BAD_REQUEST });
    }
    else if (!data) {
      this.log.error(ERROR_ABSENT_DATA);
      return response.error({ statusCode: STATUS_BAD_REQUEST, errorMessage: ERROR_ABSENT_DATA });
    }
    else if (!data.service || !data.name) {
      return response.error({ statusCode: STATUS_BAD_REQUEST, errorMessage: 'Request must contains "service" and "name' })
    }

    this.log.debug(`msg '${data.name}' received`);
    const msg: BaseIncomingMessage = {
      key: epglue(IN_GENERIC, data.service, data.name),
      name: String(data.name),
      service: String(data.service),
      channel: CHANNEL_WEBSOCK,
      data: data,
      uid: state.uid
    }
    return await this.dispatcher.dispatch(msg.key, msg);

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
    this.dispatcher.registerListener(CMD_WEBSOCK, async (key: string, msg: any) => {
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
