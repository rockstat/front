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
let BrowserLib = class BrowserLib {
    constructor(logFactory, configurer) {
        this.log = logFactory.for(this);
        this.options = configurer.browserLib;
        this.content = fs_1.readFileSync(this.options.file);
        this.log.info({
            fn: this.options.file,
            size: `${Math.round(this.content.length / 1024)}kb`
        }, 'loaded browser lib');
    }
    prepare(params) {
        const cmd = new Buffer(`window.alco&&window.alco('configure',${JSON.stringify(params)});`);
        return Buffer.concat([cmd, this.content]);
    }
};
BrowserLib = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [log_1.LogFactory, lib_1.Configurer])
], BrowserLib);
exports.BrowserLib = BrowserLib;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnJvd3NlckxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvQnJvd3NlckxpYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLG1DQUFpQztBQUNqQywyQkFBa0M7QUFDbEMsa0NBQThDO0FBQzlDLGtDQUFzQztBQUt0QyxJQUFhLFVBQVUsR0FBdkI7SUFNRSxZQUFZLFVBQXNCLEVBQUUsVUFBc0I7UUFDeEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQztRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLGlCQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUvQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNaLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUk7WUFDckIsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNwRCxFQUFFLG9CQUFvQixDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELE9BQU8sQ0FBQyxNQUFpQztRQUN2QyxNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sQ0FBQyx3Q0FBd0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0YsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7Q0FDRixDQUFBO0FBckJZLFVBQVU7SUFEdEIsZ0JBQU8sRUFBRTtxQ0FPZ0IsZ0JBQVUsRUFBYyxnQkFBVTtHQU4vQyxVQUFVLENBcUJ0QjtBQXJCWSxnQ0FBVSJ9