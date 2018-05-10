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
const fs_1 = require("fs");
const js_yaml_1 = require("js-yaml");
const ejs_1 = require("ejs");
const typedi_1 = require("typedi");
const glob_1 = require("glob");
const dotenv = require("dotenv");
const mergeOptions = require("merge-options");
const constants_1 = require("@app/constants");
const consts = require("@app/constants");
dotenv.config();
let Configurer = Configurer_1 = class Configurer {
    /**
     * Reading all accessible configuration files including custom
     */
    constructor() {
        this.configDir = './config';
        this.ejsConfig = {};
        const parts = glob_1.sync(`${this.configDir}/**/*.yml`, { nosort: true })
            .map(file => fs_1.readFileSync(file).toString());
        const yaml = ejs_1.render(parts.join('\n'), { env: process.env, ...consts }, this.ejsConfig);
        this.config = mergeOptions({}, ...js_yaml_1.safeLoadAll(yaml).filter(cfg => cfg !== null && cfg !== undefined));
        this.env = this.config.env = Configurer_1.env;
        const { writers } = this.config;
        const { clickhouse } = writers;
        if (clickhouse) {
            writers.clickhouse = this.handleCHExtend(clickhouse);
        }
        this.config.writers = writers;
    }
    get identify() { return this.config.identify; }
    get httpConfig() { return this.config.http; }
    get webSocketConfig() { return this.config.websocket; }
    get logConfig() { return this.config.log.pino; }
    get ipcConfig() { return this.config.ipc; }
    get services() { return this.config.services; }
    get browserLib() { return this.config.browserLib[this.env]; }
    get redis() { return this.config.redis; }
    get client() { return this.config.client.common; }
    get(section) {
        return this.config[section];
    }
    /**
     * Handling ClickHouse table extendability via _options: extend: basename
     * @param config ClickHouse configuration
     */
    handleCHExtend(config) {
        const { base, tables, ...rest } = config;
        for (const table of Object.keys(tables)) {
            const definition = tables[table];
            const { _options, ...cols } = definition;
            // excluding extend action
            const { extend, ...options } = _options;
            // extenxing
            if (extend && tables[extend]) {
                // extracting source table schema ans opts
                const { _options: ioptions, ...icols } = tables[extend];
                // extending base table
                Object.assign(options, ioptions);
                Object.assign(cols, icols);
            }
            // Moving back;
            Object.assign(definition, base, cols, { _options });
        }
        return { base, tables, ...rest };
    }
    static get env() {
        switch (process.env.NODE_ENV) {
            case 'production':
            case 'prod':
                return constants_1.ENV_PROD;
            case 'stage':
                return constants_1.ENV_STAGE;
            default:
                return constants_1.ENV_DEV;
        }
    }
    forService(name) {
        return this.config.services[name];
    }
};
Configurer = Configurer_1 = __decorate([
    typedi_1.Service({ global: true }),
    __metadata("design:paramtypes", [])
], Configurer);
exports.Configurer = Configurer;
var Configurer_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwQ29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9BcHBDb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSwyQkFBa0M7QUFDbEMscUNBQXNDO0FBQ3RDLDZCQUFpRTtBQUNqRSxtQ0FBaUM7QUFDakMsK0JBQXdDO0FBQ3hDLGlDQUFpQztBQUNqQyw4Q0FBOEM7QUFDOUMsOENBSXdCO0FBQ3hCLHlDQUF5QztBQWlCekMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBR2hCLElBQWEsVUFBVSxrQkFBdkI7SUFpQkU7O09BRUc7SUFDSDtRQWxCQSxjQUFTLEdBQVcsVUFBVSxDQUFDO1FBRy9CLGNBQVMsR0FBZSxFQUFFLENBQUE7UUFnQnhCLE1BQU0sS0FBSyxHQUFHLFdBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLFdBQVcsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUNuRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFFOUMsTUFBTSxJQUFJLEdBQUcsWUFBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLE1BQU0sRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUUxRixJQUFJLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQyxFQUFFLEVBQUUsR0FBYSxxQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxJQUFJLElBQUksR0FBRyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDaEgsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxZ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