"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const log_1 = require("@app/log");
class FlatBus {
    constructor() {
        this.map = new WeakMap();
        this.noneHdr = async (key, msg) => { };
        this.handlers = {};
        this.log = typedi_1.default.get(log_1.LogFactory).for(this);
    }
    setNoneHdr(hdr) {
        this.noneHdr = hdr;
    }
    handlerEvents(handler) {
        let hel = this.map.get(handler);
        if (!hel) {
            hel = [];
            this.map.set(handler, hel);
        }
        return hel;
    }
    replace(keys, handler) {
        const hel = this.handlerEvents(handler);
        const newKeys = keys.filter(k => !hel.includes(k));
        this.log.debug(`new keys: ${newKeys.join()}`);
        const rmKeys = hel.filter(k => !keys.includes(k));
        this.log.debug(`rm keys: ${rmKeys.join()}`);
        for (const key of rmKeys) {
            this.unset(key, handler);
        }
        for (const key of newKeys) {
            this.set(key, handler);
        }
        return this;
    }
    set(key, handler) {
        if (!handler) {
            throw new ReferenceError('handler not present');
        }
        if (Array.isArray(key)) {
            for (const k of key) {
                this.set(k, handler);
            }
            return this;
        }
        if (this.handlers[key] !== handler) {
            this.handlers[key] = handler;
            this.handlerEvents(handler).push(key);
        }
        return this;
    }
    unset(key, handler) {
        if (this.handlers[key] === handler) {
            this.handlers[key] = this.noneHdr;
            // removing method keys list
            const hel = this.handlerEvents(handler);
            while (hel.includes(key)) {
                hel.splice(hel.indexOf(key), 1);
            }
        }
        return this;
    }
    handle(key, msg) {
        return (this.handlers[key] || this.noneHdr)(key, msg);
    }
}
exports.FlatBus = FlatBus;
