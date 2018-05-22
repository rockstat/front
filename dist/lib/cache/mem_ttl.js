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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtX3R0bC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY2FjaGUvbWVtX3R0bC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUF3QztBQUN4QyxpQ0FBaUM7QUFjakMsTUFBTSxhQUFhLEdBQWM7SUFDL0IsTUFBTSxFQUFFLEdBQUc7SUFDWCxXQUFXLEVBQUUsR0FBRztJQUNoQixTQUFTLEVBQUUsSUFBSTtDQUNoQixDQUFBO0FBRUQ7SUFJRTtRQUNFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUEyQixFQUFFLEdBQVc7UUFDcEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEMsSUFBSSxLQUFLLEVBQUU7WUFDVCxPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxHQUFHLENBQUMsR0FBVztRQUNiLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxHQUFHLENBQUMsR0FBVyxFQUFFLElBQVM7UUFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQsR0FBRyxDQUFDLEdBQVc7UUFDYixPQUFlLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdELENBQUM7Q0FFRjtBQTlCRCxrQ0E4QkMifQ==