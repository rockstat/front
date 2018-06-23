"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const fs_1 = require("fs");
const constants_1 = require("@app/constants");
const rock_me_ts_1 = require("rock-me-ts");
class BrowserLib {
    constructor() {
        this.loaded = false;
        this.log = typedi_1.Container.get(rock_me_ts_1.Logger).for(this);
        const appConfig = typedi_1.Container.get(rock_me_ts_1.AppConfig);
        this.dev = appConfig.env === constants_1.ENV_DEV;
        this.options = appConfig.static;
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
        return `;window["rstat"]&&window["rstat"]('configure',${JSON.stringify(params)});`;
    }
    prepare(params) {
        const cmd = new Buffer(this.rtConfig(params));
        return Buffer.concat([cmd, this.lib()]);
    }
}
exports.BrowserLib = BrowserLib;
//# sourceMappingURL=BrowserLib.js.map