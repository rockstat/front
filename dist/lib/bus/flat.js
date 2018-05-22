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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxhdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvYnVzL2ZsYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxtQ0FBK0I7QUFFL0Isa0NBQThDO0FBRTlDO0lBTUU7UUFMQSxRQUFHLEdBQXNDLElBQUksT0FBTyxFQUFFLENBQUM7UUFDdkQsWUFBTyxHQUFjLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckMsYUFBUSxHQUFpQyxFQUFFLENBQUM7UUFJbEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxnQkFBUyxDQUFDLEdBQUcsQ0FBYSxnQkFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxVQUFVLENBQUMsR0FBYztRQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztJQUNyQixDQUFDO0lBRUQsYUFBYSxDQUFDLE9BQWtCO1FBQzlCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDUixHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ1QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRUQsT0FBTyxDQUFDLElBQWMsRUFBRSxPQUFrQjtRQUN4QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDOUMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM1QyxLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sRUFBRTtZQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMxQjtRQUNELEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3hCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsR0FBRyxDQUFDLEdBQXNCLEVBQUUsT0FBa0I7UUFDNUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE1BQU0sSUFBSSxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQztTQUNqRDtRQUNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUN0QixLQUFLLE1BQU0sQ0FBQyxJQUFJLEdBQUcsRUFBRTtnQkFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDdEI7WUFDRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU8sRUFBRTtZQUNsQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQztZQUM3QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN2QztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFXLEVBQUUsT0FBa0I7UUFDbkMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU8sRUFBRTtZQUNsQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDbEMsNEJBQTRCO1lBQzVCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDeEMsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN4QixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDakM7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFXLEVBQUUsR0FBUTtRQUMxQixPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3hELENBQUM7Q0FDRjtBQXRFRCwwQkFzRUMifQ==