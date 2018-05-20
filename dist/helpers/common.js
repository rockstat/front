"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Event path glue
 * @param args
 */
function epglue(...args) {
    return args.join('.');
}
exports.epglue = epglue;
/**
 * Check event path in child of parent
 * @param parent Parent path
 * @param child Child path
 */
function epchild(parent, child) {
    return child.substr(0, parent.length) === parent
        ? child.slice(parent.length, child.length)
        : false;
}
exports.epchild = epchild;
function listVal(input) {
    return Array.isArray(input) ? input[0] : input;
}
exports.listVal = listVal;
function pick(obj, paths) {
    return { ...paths.reduce((mem, key) => ({ ...mem, [key]: obj[key] }), {}) };
}
exports.pick = pick;
function pick2(obj, paths) {
    return Object.assign({}, ...paths.map(prop => ({ [prop]: obj[prop] })));
}
exports.pick2 = pick2;
