"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getval = require("get-value");
function getvals(obj, keys) {
    const result = {};
    for (const [k, prop] of keys) {
        result[k] = getval(obj, prop);
    }
    return result;
}
exports.getvals = getvals;
function dotPropGetter(options) {
    const keys = Object.keys(options);
    const props = Object.values(options);
    return (obj) => {
        const res = {};
        for (const [k, v] of Object.entries(options)) {
            res[k] = getval(obj, v);
        }
        return res;
    };
}
exports.dotPropGetter = dotPropGetter;
//# sourceMappingURL=getprop.js.map