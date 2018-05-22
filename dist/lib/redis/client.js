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
const typedi_1 = require("typedi");
const Redis = require("redis-fast-driver");
const lib_1 = require("@app/lib");
const log_1 = require("@app/log");
let RedisClient = class RedisClient {
    constructor() {
        this.started = false;
        this.on = (event, func) => {
            this.client.on(event, func);
        };
        const deps = this.log = typedi_1.default.get(log_1.LogFactory).for(this);
        this.options = typedi_1.default.get(lib_1.Configurer).get('redis');
        const { host, port, db } = this.options;
        this.log.info('Starting redis client. Server: %s:%s/%d', host, port, db);
        this.client = new Redis(this.options);
        //happen only once
        this.client.on('ready', () => {
            this.log.info('redis ready');
        });
        //happen each time when reconnected
        this.client.on('connect', () => {
            this.log.info('redis connected');
        });
        this.client.on('disconnect', () => {
            this.log.info('redis disconnected');
        });
        this.client.on('reconnecting', (num) => {
            this.log.info('redis reconnecting with attempt #' + num);
        });
        this.client.on('error', (e) => {
            this.log.info('redis error', e);
        });
        // called on an explicit end, or exhausted reconnections
        this.client.on('end', () => {
            this.log.info('redis closed');
        });
    }
    publish(topic, raw) {
        this.client.rawCall(['publish', topic, raw], (error, msg) => {
            if (error) {
                this.log.error('Redis publish error', error);
            }
        });
    }
    subscribe(channel, func) {
        this.client.rawCall(['subscribe', channel], (error, msg) => {
            if (error) {
                this.log.error('Redis error', error);
                return;
            }
            func(msg);
        });
    }
};
RedisClient = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [])
], RedisClient);
exports.RedisClient = RedisClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9yZWRpcy9jbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxtQ0FBb0Q7QUFDcEQsMkNBQTJDO0FBRTNDLGtDQUFzQztBQUN0QyxrQ0FBOEM7QUFNOUMsSUFBYSxXQUFXLEdBQXhCO0lBVUU7UUFGQSxZQUFPLEdBQVksS0FBSyxDQUFDO1FBd0N6QixPQUFFLEdBQUcsQ0FBQyxLQUFhLEVBQUUsSUFBOEIsRUFBRSxFQUFFO1lBQ3JELElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUE7UUF0Q0MsTUFBTSxJQUFJLEdBQ1YsSUFBSSxDQUFDLEdBQUcsR0FBRyxnQkFBUyxDQUFDLEdBQUcsQ0FBYSxnQkFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzFELElBQUksQ0FBQyxPQUFPLEdBQUcsZ0JBQVMsQ0FBQyxHQUFHLENBQWEsZ0JBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsRSxNQUFNLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBRXRDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekUsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFdEMsa0JBQWtCO1FBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxtQ0FBbUM7UUFDbkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUM3QixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsR0FBVyxFQUFFLEVBQUU7WUFDN0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsbUNBQW1DLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFRLEVBQUUsRUFBRTtZQUNuQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFFSCx3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtZQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFNRCxPQUFPLENBQUMsS0FBYSxFQUFFLEdBQVE7UUFDN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBWSxFQUFFLEdBQVEsRUFBRSxFQUFFO1lBQ3RFLElBQUksS0FBSyxFQUFFO2dCQUNULElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzlDO1FBQ0gsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsU0FBUyxDQUFDLE9BQWUsRUFBRSxJQUFjO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBWSxFQUFFLEdBQWtCLEVBQUUsRUFBRTtZQUMvRSxJQUFJLEtBQUssRUFBRTtnQkFDVCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3JDLE9BQU87YUFDUjtZQUNELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNaLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztDQUNGLENBQUE7QUFyRVksV0FBVztJQUR2QixnQkFBTyxFQUFFOztHQUNHLFdBQVcsQ0FxRXZCO0FBckVZLGtDQUFXIn0=