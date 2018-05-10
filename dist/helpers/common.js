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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2hlbHBlcnMvY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7OztHQUdHO0FBQ0gsZ0JBQXVCLEdBQUcsSUFBbUI7SUFDM0MsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLENBQUM7QUFGRCx3QkFFQztBQUVEOzs7O0dBSUc7QUFDSCxpQkFBd0IsTUFBYyxFQUFFLEtBQWE7SUFDbkQsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssTUFBTTtRQUM5QyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDMUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUVaLENBQUM7QUFMRCwwQkFLQztBQUVELGlCQUF3QixLQUF5QjtJQUMvQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ2pELENBQUM7QUFGRCwwQkFFQztBQUVELGNBQTJDLEdBQU0sRUFBRSxLQUFVO0lBQzNELE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFnQixDQUFDO0FBQzVGLENBQUM7QUFGRCxvQkFFQztBQUVELGVBQTRDLEdBQU0sRUFBRSxLQUFVO0lBQzVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFlLENBQUM7QUFDeEYsQ0FBQztBQUZELHNCQUVDIn0=