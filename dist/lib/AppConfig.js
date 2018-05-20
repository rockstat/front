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
