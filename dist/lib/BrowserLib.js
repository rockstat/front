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
const fs_1 = require("fs");
const log_1 = require("@app/log");
const lib_1 = require("@app/lib");
const constants_1 = require("@app/constants");
let BrowserLib = class BrowserLib {
    constructor(logFactory, configurer) {
        this.loaded = false;
        this.log = logFactory.for(this);
        this.dev = configurer.env === constants_1.ENV_DEV;
        this.options = configurer.browserLib;
        // warmup lib
        this.lib();
        this.log.info({
            fn: this.options.file,
            size: `${Math.round(this.content.length / 1024)}kb`,
            dev: this.dev
        }, 'loaded browser lib');
    }
    lib() {
        if (!this.loaded || this.dev) {
            this.content = fs_1.readFileSync(this.options.file);
            this.loaded = true;
        }
        return this.content;
    }
    rtConfig(params) {
        return `window.alco&&window.alco('configure',${JSON.stringify(params)});`;
    }
    prepare(params) {
        const cmd = new Buffer(this.rtConfig(params));
        return Buffer.concat([cmd, this.lib()]);
    }
};
BrowserLib = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [log_1.LogFactory, lib_1.Configurer])
], BrowserLib);
exports.BrowserLib = BrowserLib;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnJvd3NlckxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvQnJvd3NlckxpYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLG1DQUFpQztBQUNqQywyQkFBa0M7QUFDbEMsa0NBQThDO0FBQzlDLGtDQUFzQztBQUV0Qyw4Q0FBeUM7QUFLekMsSUFBYSxVQUFVLEdBQXZCO0lBUUUsWUFBWSxVQUFzQixFQUFFLFVBQXNCO1FBRjFELFdBQU0sR0FBWSxLQUFLLENBQUM7UUFHdEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLEdBQUcsS0FBSyxtQkFBTyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQztRQUNyQyxhQUFhO1FBQ2IsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDWixFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJO1lBQ3JCLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUk7WUFDbkQsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO1NBQ2QsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxHQUFHO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHLGlCQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztTQUNwQjtRQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBRUQsUUFBUSxDQUFDLE1BQWlCO1FBQ3hCLE9BQU8sd0NBQXdDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUM1RSxDQUFDO0lBRUQsT0FBTyxDQUFDLE1BQWlCO1FBQ3ZCLE1BQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM5QyxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0YsQ0FBQTtBQXJDWSxVQUFVO0lBRHRCLGdCQUFPLEVBQUU7cUNBU2dCLGdCQUFVLEVBQWMsZ0JBQVU7R0FSL0MsVUFBVSxDQXFDdEI7QUFyQ1ksZ0NBQVUifQ==