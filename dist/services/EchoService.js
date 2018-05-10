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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWNob1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvRWNob1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQSw4Q0FNd0I7QUFDeEIsMENBQXNDO0FBTXRDO0lBS0UsWUFBWSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFvRTtRQUh4RyxZQUFPLEdBQXNCLEVBQUUsQ0FBQztRQUk5QixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNqQixDQUFDO0lBRUQsUUFBUSxDQUFDLFVBQXNCO1FBQzdCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBRTdCLElBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsNEJBQWdCLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNwRSxNQUFNLEtBQUssR0FBd0I7Z0JBQ2pDLElBQUksRUFBRSxvQkFBUTtnQkFDZCxJQUFJLEVBQUU7b0JBQ0osR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHO29CQUNaLEtBQUssRUFBRSxvQkFBUTtpQkFDaEI7YUFDRixDQUFBO1lBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsaUNBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLG9CQUFRLEVBQUUsS0FBSyxFQUFFLEdBQVcsRUFBRSxHQUF3QixFQUFpQixFQUFFO1lBQ3hHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakIsTUFBTSxLQUFLLEdBQXdCO2dCQUNqQyxJQUFJLEVBQUUsb0JBQVE7Z0JBQ2QsS0FBSyxFQUFFLG9CQUFRO2dCQUNmLElBQUksRUFBRSxHQUFHO2FBQ1YsQ0FBQTtZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFNLENBQUMsaUNBQXFCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FFRjtBQWxDRCxrQ0FrQ0MifQ==