"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird_1 = require("bluebird");
const typedi_1 = require("typedi");
const rock_me_ts_1 = require("rock-me-ts");
class TreeBus {
    constructor() {
        this.map = new WeakMap();
        this.tree = {
            handlers: [],
            children: {}
        };
        this.log = typedi_1.default.get(rock_me_ts_1.Logger).for(this);
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
        for (const k of newKeys) {
            this.log.info(`+ adding handler from ${k}`);
        }
        const rmKeys = hel.filter(k => !keys.includes(k));
        for (const k of rmKeys) {
            this.log.info(`- removing handler from ${k}`);
        }
        for (const k of rmKeys) {
            this.unSubscribe(k, handler);
        }
        for (const k of newKeys) {
            this.subscribe(k, handler);
        }
    }
    subscribe(key, handler) {
        if (!handler) {
            throw new ReferenceError('handler not present');
        }
        if (Array.isArray(key)) {
            for (const k of key) {
                this.subscribe(k, handler);
            }
            return;
        }
        const path = key === '*' ? [] : key.split('.');
        let node = this.tree;
        for (const name of path) {
            if (!node.children[name]) {
                node.children[name] = {
                    handlers: [],
                    children: {}
                };
            }
            node = node.children[name];
        }
        // Adding handler key
        node.handlers.push(handler);
        this.handlerEvents(handler).push(key);
        return this;
    }
    unSubscribe(key, handler) {
        if (!handler) {
            throw new ReferenceError('handler not present');
        }
        const path = key === '*' ? [] : key.split('.');
        let node = this.tree;
        for (const name of path) {
            if (!node.children[name]) {
                return this;
            }
            node = node.children[name];
        }
        // removing handler
        while (node.handlers.includes(handler)) {
            node.handlers.splice(node.handlers.indexOf(handler), 1);
        }
        // removing key form handler dictionary
        const hel = this.handlerEvents(handler);
        while (hel.includes(key)) {
            hel.splice(hel.indexOf(key), 1);
        }
        return this;
    }
    publish(key, msg) {
        const path = key.split('.').concat(['']);
        let node = this.tree;
        const handlers = [];
        for (const name of path) {
            for (let handler of node.handlers) {
                handlers.push(handler(key, msg));
            }
            if (!node.children[name]) {
                break;
            }
            node = node.children[name];
        }
        return bluebird_1.Promise.all(handlers);
    }
}
exports.TreeBus = TreeBus;
//# sourceMappingURL=tree.js.map