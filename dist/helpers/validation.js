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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9oZWxwZXJzL3ZhbGlkYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztBQUNqRCxNQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQztBQUV6QyxrQkFBeUIsQ0FBTTtJQUM3QixPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLGNBQWMsQ0FBQztBQUN4RyxDQUFDO0FBRkQsNEJBRUM7QUFFRDs7O0dBR0c7QUFDSCx1QkFBOEIsQ0FBTTtJQUNsQyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUZELHNDQUVDO0FBRUQ7OztHQUdHO0FBQ0gsa0JBQXlCLENBQU07SUFDN0IsT0FBTyxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUE7QUFDOUIsQ0FBQztBQUZELDRCQUVDO0FBRUQsdUJBQThCLENBQU07SUFDbEMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2xCLENBQUM7QUFGRCxzQ0FFQztBQUVEOzs7R0FHRztBQUNILGtCQUF5QixDQUFNO0lBQzdCLE9BQU8sT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDO0FBQy9CLENBQUM7QUFGRCw0QkFFQztBQUNZLFFBQUEsSUFBSSxHQUFHLE1BQU0sQ0FBQztBQUUzQix3QkFBK0IsQ0FBUztJQUN0QyxPQUFPLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRkQsd0NBRUM7QUFFRDs7O0dBR0c7QUFDSCxtQkFBMEIsQ0FBTTtJQUM5QixPQUFPLE9BQU8sQ0FBQyxLQUFLLFNBQVMsQ0FBQTtBQUMvQixDQUFDO0FBRkQsOEJBRUM7QUFFRDs7O0dBR0c7QUFDSCxlQUFzQixDQUFNO0lBQzFCLE9BQU8sQ0FBQyxLQUFLLFNBQVMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDO0FBQ3ZDLENBQUM7QUFGRCxzQkFFQyJ9