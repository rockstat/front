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
const AppConfig_1 = require("../lib/AppConfig");
const LogPino_1 = require("./LogPino");
let LogFactory = class LogFactory {
    constructor(configurer) {
        this.logger = new LogPino_1.LogPino(configurer.logConfig);
    }
    child(options) {
        return this.logger.child(options);
    }
    for(object) {
        const options = {
            name: object.constructor.name
        };
        return this.child(options);
    }
};
LogFactory = __decorate([
    typedi_1.Service({ global: true }),
    __metadata("design:paramtypes", [AppConfig_1.Configurer])
], LogFactory);
exports.LogFactory = LogFactory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9nRmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9sb2cvTG9nRmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUVBLG1DQUF5QztBQUN6QyxnREFBOEM7QUFDOUMsdUNBQW9DO0FBc0JwQyxJQUFhLFVBQVUsR0FBdkI7SUFJRSxZQUFvQixVQUFzQjtRQUN4QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksaUJBQU8sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFlO1FBQ25CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELEdBQUcsQ0FBQyxNQUFjO1FBQ2hCLE1BQU0sT0FBTyxHQUFHO1lBQ2QsSUFBSSxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSTtTQUM5QixDQUFDO1FBQ0YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzdCLENBQUM7Q0FDRixDQUFBO0FBbEJZLFVBQVU7SUFEdEIsZ0JBQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQztxQ0FLUSxzQkFBVTtHQUovQixVQUFVLENBa0J0QjtBQWxCWSxnQ0FBVSJ9