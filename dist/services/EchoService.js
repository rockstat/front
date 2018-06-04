"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EchoService {
    constructor() {
        this.options = {};
    }
    // constructor({ log, config, container }: { log: Logger, config: EchoServiceConfig, container: Container }) {
    //   this.log = log;
    // }
    register(dispatcher) {
        // this.dispatcher = dispatcher;
        // this.dispatcher.registerListener(IN_WEBSOCK_HELLO, async (key, msg) => {
        //   const reply: BaseIncomingMessage = {
        //     name: KEY_ECHO,
        //     data: {
        //       uid: msg.uid,
        //       group: KEY_ECHO
        //     }
        //   }
        //   this.dispatcher.emit(CMD_WEBSOCK_ADD_GROUP, reply);
        // });
        // this.dispatcher.registerListener(INCOMING, async (key: string, msg: BaseIncomingMessage): Promise<void> => {
        //   console.log(msg);
        //   const reply: BaseIncomingMessage = {
        //     name: KEY_ECHO,
        //     group: KEY_ECHO,
        //     data: msg
        //   }
        //   this.dispatcher.emit(epglue(OUT_WEBSOCK_BROADCAST), reply);
        // });
    }
}
exports.EchoService = EchoService;
//# sourceMappingURL=EchoService.js.map