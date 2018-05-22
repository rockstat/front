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
dotenv.config({ path: '.env.local' });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwQ29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9BcHBDb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSwyQkFBa0M7QUFDbEMscUNBQXNDO0FBQ3RDLDZCQUFpRTtBQUNqRSxtQ0FBaUM7QUFDakMsK0JBQXdDO0FBQ3hDLGlDQUFpQztBQUNqQyw4Q0FBOEM7QUFDOUMsOENBSXdCO0FBQ3hCLHlDQUF5QztBQWlCekMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2hCLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBQyxJQUFJLEVBQUMsWUFBWSxFQUFDLENBQUMsQ0FBQztBQUduQyxJQUFhLFVBQVUsa0JBQXZCO0lBaUJFOztPQUVHO0lBQ0g7UUFsQkEsY0FBUyxHQUFXLFVBQVUsQ0FBQztRQUcvQixjQUFTLEdBQWUsRUFBRSxDQUFBO1FBZ0J4QixNQUFNLEtBQUssR0FBRyxXQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxXQUFXLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUM7YUFDbkUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRTlDLE1BQU0sSUFBSSxHQUFHLFlBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxNQUFNLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFMUYsSUFBSSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsRUFBRSxFQUFFLEdBQWEscUJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssSUFBSSxJQUFJLEdBQUcsS0FBSyxTQUFTLENBQUMsQ0FBQyxD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