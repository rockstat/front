"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NodeCache = require("node-cache");
const xxhash = require("xxhash");
const cacheDefaults = {
    stdTTL: 600,
    checkperiod: 600,
    useClones: true
};
class MemTTLCache {
    constructor() {
        this.cache = new NodeCache(Object.assign({}, cacheDefaults));
    }
    async process(build, key) {
        const cache = this.cache.get(key);
        if (cache) {
            return cache;
        }
        const result = await build(key);
        this.cache.set(key, result);
        return result;
    }
    get(key) {
        return this.cache.get(this.key(key));
    }
    set(key, data) {
        this.cache.set(this.key(key), data);
    }
    key(key) {
        return xxhash.hash64(new Buffer(key), 0, 'base64');
    }
}
exports.MemTTLCache = MemTTLCache;
