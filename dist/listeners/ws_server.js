"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const WebSocket = require("ws");
const rock_me_ts_1 = require("rock-me-ts");
const lib_1 = require("@app/lib");
const helpers_1 = require("@app/helpers");
const url_1 = require("url");
const constants_1 = require("@app/constants");
class WebSocketServer {
    constructor() {
        this.socksState = new WeakMap();
        this.options = typedi_1.Container.get(rock_me_ts_1.AppConfig).ws;
        this.dispatcher = typedi_1.Container.get(lib_1.Dispatcher);
        this.log = typedi_1.Container.get(rock_me_ts_1.Logger).for(this);
        // this.secureOptions = {
        // cert: readFileSync(this.options.https.certFile),
        // key: readFileSync(this.options.https.keyFile)
        // }
    }
    get httpsOptions() {
        return this.options.https;
    }
    get httpOptions() {
        return this.options.http;
    }
    async findUidSock(uid) {
        this.log.debug(`searching user ${uid}`);
        for (const socket of this.wss.clients) {
            const state = this.socksState.get(socket);
            if (state && state.uid === uid) {
                this.log.debug(`success`);
                return { socket, state };
            }
        }
    }
    async addToGroup({ uid, group }) {
        this.log.info(`addtogroup user ${uid} to ${group}`);
        const result = await this.findUidSock(uid);
        if (result) {
            this.log.info(`adding user ${uid} to ${group}`);
            const { socket, state } = result;
            state.groups.add(group);
        }
        else {
            this.log.debug('hmmmm');
        }
    }
    async sendBroadcast({ name, data, group }) {
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
        this.dispatcher.registerListener(constants_1.OUT_WEBSOCK, async (key, data) => {
            switch (key) {
                case constants_1.OUT_WEBSOCK_BROADCAST: return await this.sendBroadcast(data);
            }
        });
        this.dispatcher.registerListener(constants_1.CMD_WEBSOCK, async (key, msg) => {
            switch (key) {
                case constants_1.CMD_WEBSOCK_ADD_GROUP: return await this.addToGroup(msg.data);
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
        this.wss.on('connection', (socket, req) => {
            this.log.debug('client connected');
            if (req.url) {
                const parsedUrl = url_1.parse(req.url, true);
                const { uid } = parsedUrl.query;
                if (uid && typeof uid === 'string' && uid !== '') {
                    this.socksState.set(socket, {
                        uid: uid,
                        authorized: false,
                        touch: new Date().getTime(),
                        groups: new Set()
                    });
                    socket.on('close', (code, reason) => {
                        this.log.debug(`closed ${code} ${reason}`);
                    });
                    socket.on('message', (data) => {
                        const state = this.socksState.get(socket);
                        try {
                            const msg = JSON.parse(data.toString());
                            msg.channel = constants_1.CHANNEL_WEBSOCK;
                            if (state && helpers_1.isObject(msg) && msg.name && typeof msg.name === constants_1.STRING) {
                                if (msg.name === 'ping') {
                                    state.touch = new Date().getTime();
                                }
                                else {
                                    this.dispatcher.emit(helpers_1.epglue(constants_1.IN_INDEP, msg.name), msg);
                                }
                                this.log.info(`msg '${msg.name}' received`);
                            }
                        }
                        catch (err) {
                            this.log.warn(err, 'parsing ws message err');
                        }
                    });
                    return;
                }
            }
            else {
                this.log.info('closing connection without credentials');
                socket.close();
            }
        });
        this.register();
    }
}
exports.WebSocketServer = WebSocketServer;
//# sourceMappingURL=ws_server.js.map