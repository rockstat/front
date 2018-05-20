"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pino = require("pino");
class LogPino {
    constructor(options, instance) {
        this.methods = ['trace', 'info', 'debug', 'warn', 'error', 'fatal'];
        this.logger = instance && instance.child(options) || pino(options);
        for (const method of this.methods) {
            this[method] = this.logger[method].bind(this.logger);
        }
    }
    child(options) {
        return new LogPino(options, this.logger);
    }
}
exports.LogPino = LogPino;
