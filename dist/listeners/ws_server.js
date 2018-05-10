"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const fs_1 = require("fs");
const typedi_1 = require("typedi");
const WebSocket = require("ws");
const log_1 = require("@app/log");
const lib_1 = require("@app/lib");
const helpers_1 = require("@app/helpers");
const url_1 = require("url");
const constants_1 = require("@app/constants");
let WebSocketServer = class WebSocketServer {
    constructor(configurer, logFactory) {
        this.socksState = new WeakMap();
        this.options = configurer.webSocketConfig;
        this.log = logFactory.for(this);
        this.secureOptions = {
            cert: fs_1.readFileSync(this.options.https.certFile),
            key: fs_1.readFileSync(this.options.https.keyFile)
        };
    }
    get httpsOptions() {
        return this.options.https;
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
        const { host, port } = this.httpsOptions;
        this.log.info(`Starting WS HTTPS transport on ${host}:${port}`);
        this.server = https_1.createServer(this.secureOptions);
        this.server.listen(port, host);
        this.log.info(`Starting WS server on port ${port}`);
        this.wss = new WebSocket.Server({
            server: this.server,
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
};
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.Dispatcher)
], WebSocketServer.prototype, "dispatcher", void 0);
WebSocketServer = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [lib_1.Configurer, log_1.LogFactory])
], WebSocketServer);
exports.WebSocketServer = WebSocketServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3Nfc2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpc3RlbmVycy93c19zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBNkM7QUFFN0MsMkJBQXdDO0FBRXhDLG1DQUF5QztBQUN6QyxnQ0FBZ0M7QUFDaEMsa0NBQThDO0FBQzlDLGtDQUFrRTtBQU9sRSwwQ0FFc0I7QUFDdEIsNkJBQXdDO0FBQ3hDLDhDQVV3QjtBQXNCeEIsSUFBYSxlQUFlLEdBQTVCO0lBZ0JFLFlBQVksVUFBc0IsRUFBRSxVQUFzQjtRQVYxRCxlQUFVLEdBQWtDLElBQUksT0FBTyxFQUFFLENBQUM7UUFZeEQsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDO1FBQzFDLElBQUksQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsYUFBYSxHQUFHO1lBQ25CLElBQUksRUFBRSxpQkFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztZQUMvQyxHQUFHLEVBQUUsaUJBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7U0FDOUMsQ0FBQTtJQUNILENBQUM7SUFaRCxJQUFJLFlBQVk7UUFDZCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQzVCLENBQUM7SUFZRCxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQVc7UUFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDeEMsS0FBSyxNQUFNLE1BQU0sSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRTtZQUNyQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMs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