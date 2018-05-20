"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@app/constants");
const helpers_1 = require("@app/helpers");
class EchoService {
    constructor({ log, config, container }) {
        this.options = {};
        this.log = log;
    }
    register(dispatcher) {
        this.dispatcher = dispatcher;
        this.dispatcher.registerListener(constants_1.IN_WEBSOCK_HELLO, async (key, msg) => {
            const reply = {
                name: constants_1.KEY_ECHO,
                data: {
                    uid: msg.uid,
                    group: constants_1.KEY_ECHO
                }
            };
            this.dispatcher.emit(constants_1.CMD_WEBSOCK_ADD_GROUP, reply);
        });
        this.dispatcher.registerListener(constants_1.INCOMING, async (key, msg) => {
            console.log(msg);
            const reply = {
                name: constants_1.KEY_ECHO,
                group: constants_1.KEY_ECHO,
                data: msg
            };
            this.dispatcher.emit(helpers_1.epglue(constants_1.OUT_WEBSOCK_BROADCAST), reply);
        });
    }
}
exports.EchoService = EchoService;
