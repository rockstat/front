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
    }
    get httpOptions() {
        return this.options.http;
    }
    /**
     * Transform incoming data to Message struct
     * @param data object with data keys
     */
    async handle(raw) {
        let [error, data] = this.parse(raw);
        if (error) {
            this.log.error(error);
            return { error: error.message };
        }
        if (!data) {
            this.log.error(constants_1.ERROR_ABSENT_DATA);
            return;
        }
        if (data.name === 'ping') {
            return;
        }
        const service = data.service && typeof data.service === 'string' ? data.service : 'noservice';
        const name = data.name && typeof data.name === 'string' ? data.name : 'noname';
        this.log.debug(`msg '${name}' received`);
        const msg = {
            key: helpers_1.epglue(constants_1.IN_INDEP, service, name),
            name: name,
            service: service,
            channel: constants_1.CHANNEL_WEBSOCK,
            data: data
        };
        return await this.dispatch(msg.key, msg);
    }
    async dispatch(key, msg) {
        try {
            return await this.dispatcher.emit(key, msg);
        }
        catch (error) {
            this.log.warn(error);
            return {
                error: 'Internal error. Smth wrong.',
                errorCode: constants_1.STATUS_INT_ERROR
            };
        }
    }
    /**
     * Parse JSON and check is an object
     * @param raw raw data buffer or similar
     */
    parse(raw) {
        try {
            const data = JSON.parse(raw.toString());
            if (!helpers_1.isObject(data)) {
                throw new Error(constants_1.ERROR_NOT_OBJECT);
            }
            return [undefined, data];
        }
        catch (error) {
            return [error, undefined];
        }
    }
    /**
     * Encode message before send
     * @param msg message struct
     */
    encode(msg) {
        return JSON.stringify(msg);
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
    setup() {
        this.wss.on('connection', (socket, req) => {
            this.log.debug('client connected');
            if (req.url) {
                const parsedUrl = url_1.parse(req.url, true);
                const { uid } = parsedUrl.query;
                // accept connections only users with id
                if (uid && typeof uid === 'string' && uid.length) {
                    this.socksState.set(socket, {
                        uid: uid,
                        authorized: false,
                        touch: new Date().getTime(),
                        groups: new Set()
                    });
                    socket.on('close', (code, reason) => {
                        this.log.debug(`closed ${code} ${reason}`);
                    });
                    socket.on('message', (raw) => {
                        const state = this.socksState.get(socket);
                        if (state) {
                            state.touch = new Date().getTime();
                            this.handle(raw).then(msg => {
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
    /**
     * Find websocket assoociated with uid
     * @param uid user id
     */
    async findUidSock(uid) {
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
    async addToGroup({ uid, group }) {
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
    async sendBroadcast({ name, data, group }) {
        const raw = JSON.stringify({ name, data });
        for (const socket of this.wss.clients) {
            const state = this.socksState.get(socket);
            if (socket.readyState === WebSocket.OPEN && state && (!group || group && state.groups.has(group))) {
                socket.send(raw);
            }
        }
    }
}
exports.WebSocketServer = WebSocketServer;
//# sourceMappingURL=ws_server.js.map