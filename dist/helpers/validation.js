"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objectToString = Object.prototype.toString;
const objectAsString = '[object Object]';
function isObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v) && objectToString.call(v) === objectAsString;
}
exports.isObject = isObject;
/**
 * Utilized / non empty object
 * @param v
 */
function isEmptyObject(v) {
    return isObject(v) && Object.keys(v).length === 0;
}
exports.isEmptyObject = isEmptyObject;
/**
 * Check is primitive string
 * @param v
 */
function isString(v) {
    return typeof v === "string";
}
exports.isString = isString;
function isEmptyString(v) {
    return v === '';
}
exports.isEmptyString = isEmptyString;
/**
 * Check is primitive number
 * @param v
 */
function isNumber(v) {
    return typeof v === 'number';
}
exports.isNumber = isNumber;
exports.ENUM = 'enum';
function stringToNumber(v) {
    return isEmptyString(v) ? undefined : +v;
}
exports.stringToNumber = stringToNumber;
/**
 * Check is primitive boolean
 * @param v
 */
function isBoolean(v) {
    return typeof v === "boolean";
}
exports.isBoolean = isBoolean;
/**
 * Check is primitive exists
 * @param v
 */
function isNil(v) {
    return v === undefined || v === null;
}
exports.isNil = isNil;
