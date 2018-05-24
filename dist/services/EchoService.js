"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EchoService {
    constructor({ log, config, container }) {
        this.options = {};
        this.log = log;
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWNob1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvRWNob1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFpQkE7SUFLRSxZQUFZLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQW9FO1FBSHhHLFlBQU8sR0FBc0IsRUFBRSxDQUFDO1FBSTlCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxRQUFRLENBQUMsVUFBc0I7UUFDN0IsZ0NBQWdDO1FBRWhDLDJFQUEyRTtRQUMzRSx5Q0FBeUM7UUFDekMsc0JBQXNCO1FBQ3RCLGNBQWM7UUFDZCxzQkFBc0I7UUFDdEIsd0JBQXdCO1FBQ3hCLFFBQVE7UUFDUixNQUFNO1FBQ04sd0RBQXdEO1FBQ3hELE1BQU07UUFFTiwrR0FBK0c7UUFDL0csc0JBQXNCO1FBQ3RCLHlDQUF5QztRQUN6QyxzQkFBc0I7UUFDdEIsdUJBQXVCO1FBQ3ZCLGdCQUFnQjtRQUNoQixNQUFNO1FBQ04sZ0VBQWdFO1FBQ2hFLE1BQU07SUFDUixDQUFDO0NBRUY7QUFsQ0Qsa0NBa0NDIn0=