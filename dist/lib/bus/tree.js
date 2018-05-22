"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird_1 = require("bluebird");
class TreeBus {
    constructor() {
        this.map = new WeakMap();
        this.tree = {
            handlers: [],
            children: {}
        };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvYnVzL3RyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBbUM7QUFRbkM7SUFBQTtRQUNFLFFBQUcsR0FBc0MsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUUvQyxTQUFJLEdBQWtCO1lBQzVCLFFBQVEsRUFBRSxFQUFFO1lBQ1osUUFBUSxFQUFFLEVBQUU7U0FDYixDQUFDO0lBMkZKLENBQUM7SUF6RkMsYUFBYSxDQUFDLE9BQWtCO1FBQzlCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDUixHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ1QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRUQsT0FBTyxDQUFDLElBQWMsRUFBRSxPQUFrQjtRQUN4QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEQsS0FBSyxNQUFNLENBQUMsSUFBSSxNQUFNLEVBQUU7WUFDdEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDOUI7UUFDRCxLQUFLLE1BQU0sQ0FBQyxJ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