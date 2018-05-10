"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pino = require("pino");
class LogPino {
    constructor(options, instance) {
        this.methods = ['trace', 'info', 'debug', 'warn', 'error', 'fatal'];
        this.logger = instance && instance.child(options) || pino(options);
        for (const method of this.methods) {
            this[method] = this.logger[method].bind(this.logger);
        }
    }
    child(options) {
        return new LogPino(options, this.logger);
    }
}
exports.LogPino = LogPino;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9nUGluby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9sb2cvTG9nUGluby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZCQUE2QjtBQUk3QjtJQWFFLFlBQVksT0FBbUIsRUFBRSxRQUFzQjtRQUZ2RCxZQUFPLEdBQWUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBSXpFLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRW5FLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQyxJQUFJLENBQUMsTUFBa0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNsRTtJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsT0FBbUI7UUFDdkIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLENBQUM7Q0FDRjtBQXpCRCwwQkF5QkMifQ==