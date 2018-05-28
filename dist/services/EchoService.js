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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWNob1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvRWNob1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFpQkE7SUFBQTtRQUVFLFlBQU8sR0FBc0IsRUFBRSxDQUFDO0lBZ0NsQyxDQUFDO0lBN0JDLDhHQUE4RztJQUM5RyxvQkFBb0I7SUFDcEIsSUFBSTtJQUVKLFFBQVEsQ0FBQyxVQUFzQjtRQUM3QixnQ0FBZ0M7UUFFaEMsMkVBQTJFO1FBQzNFLHlDQUF5QztRQUN6QyxzQkFBc0I7UUFDdEIsY0FBYztRQUNkLHNCQUFzQjtRQUN0Qix3QkFBd0I7UUFDeEIsUUFBUTtRQUNSLE1BQU07UUFDTix3REFBd0Q7UUFDeEQsTUFBTTtRQUVOLCtHQUErRztRQUMvRyxzQkFBc0I7UUFDdEIseUNBQXlDO1FBQ3pDLHNCQUFzQjtRQUN0Qix1QkFBdUI7UUFDdkIsZ0JBQWdCO1FBQ2hCLE1BQU07UUFDTixnRUFBZ0U7UUFDaEUsTUFBTTtJQUNSLENBQUM7Q0FFRjtBQWxDRCxrQ0FrQ0MifQ==