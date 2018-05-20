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
