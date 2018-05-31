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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Nfc2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpc3RlbmVycy93c19zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQSxtQ0FBb0Q7QUFDcEQsZ0NBQWdDO0FBQ2hDLDJDQUF1RDtBQUN2RCxrQ0FBc0M7QUFTdEMsMENBRXNCO0FBQ3RCLDZCQUF3QztBQUN4Qyw4Q0FVd0I7QUFxQnhCO0lBa0JFO1FBWkEsZUFBVSxHQUFrQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBY3hELElBQUksQ0FBQyxPQUFPLEdBQUcsa0JBQVMsQ0FBQyxHQUFHLENBQTRCLHNCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDdEUsSUFBSSxDQUFDLFVBQVUsR0FBRyxrQkFBUyxDQUFDLEdBQUcsQ0FBQyxnQkFBVSxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxrQkFBUyxDQUFDLEdBQUcsQ0FBQyxtQkFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNDLHlCQUF5QjtRQUN2QixtREFBbUQ7UUFDbkQsZ0RBQWdEO1FBQ2xELElBQUk7SUFDTixDQUFDO0lBakJELElBQUksWUFBWTtRQUNkLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDNUIsQ0FBQztJQUVELElBQUksV0FBVztRQUNiLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQWFELEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBVztRQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN4QyxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFO1lBQ3JDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFD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