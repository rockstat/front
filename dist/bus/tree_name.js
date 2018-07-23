"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const rock_me_ts_1 = require("@rockstat/rock-me-ts");
class TreeNameBus {
    constructor() {
        this.map = new Map();
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
        const rmKeys = hel.filter(k => !keys.includes(k));
        for (const k of rmKeys) {
            this.unSubscribe(k, handler);
        }
        for (const k of newKeys) {
            this.subscribe(k, handler);
        }
    }
    subscribe(key, handler) {
        if (!handler || !key) {
            throw new ReferenceError('handler or key not present');
        }
        const hel = this.handlerEvents(handler);
        if (Array.isArray(key)) {
            for (const k of key) {
                this.subscribe(k, handler);
            }
            return;
        }
        if (hel.indexOf(key) >= 0) {
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
        this.log.info(`+ added handler ${handler} to ${key}. Curr: ${hel}`);
        // printTree(this.tree)
        return this;
    }
    unSubscribe(key, handler) {
        if (!handler || !key) {
            throw new ReferenceError('handler or key not present');
        }
        this.log.info(`- removing handler to ${key}`);
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
        // printTree(this.tree)
        return this;
    }
    simulate(key) {
        const path = key.split('.').concat(['']);
        let node = this.tree;
        let cpath = [];
        const handlers = [];
        for (const name of path) {
            for (let handler of node.handlers) {
                handlers.push(handler);
            }
            if (!node.children[name]) {
                break;
            }
            node = node.children[name];
        }
        return handlers;
    }
}
exports.TreeNameBus = TreeNameBus;
//# sourceMappingURL=tree_name.js.map