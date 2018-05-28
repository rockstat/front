import { createServer, Server } from 'https';
import { IncomingMessage } from 'http';
import { readFileSync, stat } from 'fs';
import { Socket } from 'net';
import { Service, Inject, Container } from 'typedi';
import * as WebSocket from 'ws';
import { Logger, TheIds, AppConfig } from "rockmets";
import { Dispatcher } from '@app/lib';
import {
  HttpsConfig,
  WsConfig,
  Dictionary,
  BaseIncomingMessage,
  HttpConfig,
  KernelConfig,
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
  IN_INDEP,
  CHANNEL_WEBSOCK,
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

  server: Server;
  wss: WebSocket.Server;
  options: WsConfig;
  secureOptions: { cert: Buffer, key: Buffer };
  socksState: WeakMap<WebSocket, SockState> = new WeakMap();
  log: Logger;
  dispatcher: Dispatcher;

  get httpsOptions(): HttpsConfig {
    return this.options.https;
  }

  get httpOptions(): HttpConfig {
    return this.options.http;
  }

  constructor() {

    this.options = Container.get<AppConfig<KernelConfig>>(AppConfig).ws;
    this.dispatcher = Container.get(Dispatcher);
    this.log = Container.get(Logger).for(this);
    // this.secureOptions = {
      // cert: readFileSync(this.options.https.certFile),
      // key: readFileSync(this.options.https.keyFile)
    // }
  }

  async findUidSock(uid: string): Promise<SockLookup | void> {
    this.log.debug(`searching user ${uid}`);
    for (const socket of this.wss.clients) {
      const state = this.socksState.get(socket);
      if (state && state.uid === uid) {
        this.log.debug(`success`);
        return { socket, state };
      }
    }
  }

  async addToGroup({ uid, group }: AddToGroupPayload): Promise<void> {

    this.log.info(`addtogroup user ${uid} to ${group}`);
    const result = await this.findUidSock(uid);
    if (result) {
      this.log.info(`adding user ${uid} to ${group}`);
      const { socket, state } = result;
      state.groups.add(group);
    } else {
      this.log.debug('hmmmm');
    }
  }

  async sendBroadcast({ name, data, group }: { group?: string, data: object, name: string }, ): Promise<void> {
    const raw = JSON.stringify({ name, data });
    for (const socket of this.wss.clients) {
      const state = this.socksState.get(socket);
      // console.log(state, 'state')
      if (socket.readyState === WebSocket.OPEN && state && (!group || group && state.groups.has(group))) {
        this.log.debug(`${group}: socket send`);
        socket.send(raw);
      }
    }
  }

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

  start() {
    const { host, port } = this.httpOptions;
    // this.log.info(`Starting WS HTTPS transport on ${host}:${port}`);
    // this.server = createServer(this.secureOptions);
    // this.server.listen(port, host)

    this.log.info(`Starting WS server on port ${port}`);

    this.wss = new WebSocket.Server({
      host,
      port,
      path: this.options.path,
      perMessageDeflate: this.options.perMessageDeflate
    });

    this.wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
      this.log.debug('client connected');
      if (req.url) {
        const parsedUrl = urlParse(req.url, true);
        const { uid } = parsedUrl.query;
        if (uid && typeof uid === 'string' && uid !== '') {
          this.socksState.set(socket, {
            uid: uid,
            authorized: false,
            touch: new Date().getTime(),
            groups: new Set()
          });

          socket.on('close', (code: number, reason: string) => {
            this.log.debug(`closed ${code} ${reason}`);
          })

          socket.on('message', (data) => {
            const state = this.socksState.get(socket);
            try {
              const msg = <BaseIncomingMessage>JSON.parse(data.toString());
              msg.channel = CHANNEL_WEBSOCK
              if (state && isObject(msg) && msg.name && typeof msg.name === STRING) {
                if (msg.name === 'ping') {
                  state.touch = new Date().getTime();
                } else {

                  this.dispatcher.emit(epglue(IN_INDEP, msg.name), msg)
                }
                this.log.info(`msg '${msg.name}' received`);
              }
            } catch (err) {
              this.log.warn(err, 'parsing ws message err');
            }
          });
          return;
        }
      } else {
        this.log.info('closing connection without credentials');
        socket.close();
      }

    });

    this.register();

  }



}
