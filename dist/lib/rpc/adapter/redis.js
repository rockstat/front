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
const EventEmitter = require("eventemitter3");
const redis_1 = require("@app/lib/redis");
const class_1 = require("@app/helpers/class");
const log_1 = require("@app/log");
const lib_1 = require("@app/lib");
let RPCAdapterRedis = class RPCAdapterRedis extends EventEmitter {
    constructor() {
        super(...arguments);
        this.receiver = (data) => {
            throw new Error('Adapter not attached');
        };
        this.redisMsg = (redismsg) => {
            if (redismsg[0] === 'message' || redismsg[0] === 'pmessage') {
                const raw = redismsg[redismsg.length - 1];
                this.log.debug('\n --> ', raw);
                const msg = this.decode(raw);
                if (msg && msg.jsonrpc === '2.0') {
                    this.receiver(msg);
                }
            }
            else {
                this.log.warn('unhandled cmd', redismsg);
            }
        };
    }
    setup(config) {
        class_1.handleSetup(this);
        this.log = this.logFactory.for(this);
        this.rsub = new redis_1.RedisClient();
        this.rsub.on('connect', () => {
            this.rsub.subscribe(config.name, this.redisMsg);
        });
        this.log.info('started');
        this.rpub = new redis_1.RedisClient();
    }
    setReceiver(obj, fname) {
        this.receiver = obj[fname];
    }
    decode(raw) {
        try {
            return JSON.parse(raw);
        }
        catch (error) {
            this.log.error('Redis decode payload error', error);
            return;
        }
    }
    encode(data) {
        try {
            return JSON.stringify(data);
        }
        catch (error) {
            this.log.error('Redis encode payload error', error);
            return;
        }
    }
    send(to, msg) {
        const raw = this.encode(msg);
        this.log.debug('\n <---', raw);
        this.rpub.publish(to, raw);
    }
};
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", log_1.LogFactory)
], RPCAdapterRedis.prototype, "logFactory", void 0);
__decorate([
    typedi_1.Inject(),
    __metadata("design:type", lib_1.Configurer)
], RPCAdapterRedis.prototype, "config", void 0);
RPCAdapterRedis = __decorate([
    typedi_1.Service()
], RPCAdapterRedis);
exports.RPCAdapterRedis = RPCAdapterRedis;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVkaXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3JwYy9hZGFwdGVyL3JlZGlzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsbUNBQXlDO0FBQ3pDLDhDQUE4QztBQUU5QywwQ0FBNkM7QUFDN0MsOENBQWlEO0FBQ2pELGtDQUE4QztBQUM5QyxrQ0FBc0M7QUFXdEMsSUFBYSxlQUFlLEdBQTVCLHFCQUE2QixTQUFRLFlBQVk7SUFEakQ7O1FBZUUsYUFBUSxHQUFnQixDQUFDLElBQUksRUFBRSxFQUFFO1lBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUM7UUF5Q0YsYUFBUSxHQUFHLENBQUMsUUFBdUIsRUFBRSxFQUFFO1lBRXJDLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssVUFBVSxFQUFFO2dCQUUzRCxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFFMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUU3QixJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLEtBQUssRUFBRTtvQkFDaEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDcEI7YUFFRjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDMUM7UUFDSCxDQUFDLENBQUE7SUFHSCxDQUFDO0lBMURDLEtBQUssQ0FBQyxNQUFpQjtRQUNyQixtQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLG1CQUFXLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1lBQzNCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLG1CQUFXLEVBQUUsQ0FBQTtJQUMvQixDQUFDO0lBRUQsV0FBVyxDQUFpQyxHQUFtQixFQUFFLEtBQVE7UUFDdkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVPLE1BQU0sQ0FBQyxHQUFXO1FBQ3hCLElBQUk7WUFDRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDeEI7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BELE9BQU87U0FDUjtJQUNILENBQUM7SUFFTyxNQUFNLENBQUMsSUFBUztRQUN0QixJQUFJO1lBQ0YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzdCO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRCxPQUFPO1NBQ1I7SUFDSCxDQUFDO0lBRUQsSUFBSSxDQUFDLEVBQVUsRUFBRSxHQUFRO1FBQ3ZCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQzlCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM3QixDQUFDO0NBcUJGLENBQUE7QUF0RUM7SUFEQyxlQUFNLEVBQUU7OEJBQ0csZ0JBQVU7bURBQUM7QUFHdkI7SUFEQyxlQUFNLEVBQUU7OEJBQ0QsZ0JBQVU7K0NBQUM7QUFUUixlQUFlO0lBRDNCLGdCQUFPLEVBQUU7R0FDRyxlQUFlLENBNEUzQjtBQTVFWSwwQ0FBZSJ9