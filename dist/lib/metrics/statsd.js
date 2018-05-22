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
const StatsdClient = require("statsd-client");
const typedi_1 = require("typedi");
const lib_1 = require("@app/lib");
let StatsDMetrics = class StatsDMetrics {
    constructor(ch) {
        const config = ch.get('metrics').statsd;
        if (config) {
            this.client = new StatsdClient(config);
        }
        else {
            throw new Error('Statsd not configured');
        }
    }
    tick(metric, tags) {
        this.client.increment(metric, undefined, tags);
    }
    timenote(metric, tags) {
        const start = process.hrtime();
        return () => {
            const diff = process.hrtime(start);
            const time = Math.round(diff[0] * 1e3 + diff[1] * 1e-6);
            this.time(metric, time);
            return time;
        };
    }
    time(metric, duration, tags) {
        this.client.timing(metric, duration, tags);
    }
};
StatsDMetrics = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [lib_1.Configurer])
], StatsDMetrics);
exports.StatsDMetrics = StatsDMetrics;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHNkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tZXRyaWNzL3N0YXRzZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLDhDQUE2QztBQUM3QyxtQ0FBaUM7QUFFakMsa0NBQXNDO0FBU3RDLElBQWEsYUFBYSxHQUExQjtJQUlFLFlBQVksRUFBYztRQUN4QixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUN4QyxJQUFJLE1BQU0sRUFBRTtZQUNWLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUE7U0FDdkM7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztTQUMxQztJQUNILENBQUM7SUFFRCxJQUFJLENBQUMsTUFBYyxFQUFFLElBQXVDO1FBQzFELElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELFFBQVEsQ0FBQyxNQUFjLEVBQUUsSUFBdUM7UUFDOUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQy9CLE9BQU8sR0FBRyxFQUFFO1lBQ1YsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hCLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztJQUVELElBQUksQ0FBQyxNQUFjLEVBQUUsUUFBZ0IsRUFBRSxJQUF1QztRQUM1RSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FFRixDQUFBO0FBL0JZLGFBQWE7SUFEekIsZ0JBQU8sRUFBRTtxQ0FLUSxnQkFBVTtHQUpmLGFBQWEsQ0ErQnpCO0FBL0JZLHNDQUFhIn0=