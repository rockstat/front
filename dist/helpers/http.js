"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qs_1 = require("qs");
const url_1 = require("url");
const common_1 = require("./common");
const http_1 = require("../constants/http");
/**
 * Transparent 1x1 gif
 */
exports.emptyGif = new Buffer('R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64');
/**
 *
 * @param url
 */
function extrachHost(url) {
    if (!url)
        return;
    const parts = url_1.parse(url);
    return `${parts.protocol}//${parts.host}`;
}
/**
 * Computes origin based on user agent or just take
 * @param origin
 * @param referer
 */
function computeOrigin(origin, referer) {
    return common_1.listVal(origin) || extrachHost(common_1.listVal(referer)) || '*';
}
exports.computeOrigin = computeOrigin;
/**
 * Main cors consts
 */
const CORS_MAX_AGE_SECONDS = `${60 * 60 * 24}`; // 24 hours
const CORS_METHODS = ['POST', 'GET']; // , 'PUT', 'PATCH', 'DELETE', 'OPTIONS',
const CORS_HEADERS = ['X-Requested-With', 'Access-Control-Allow-Origin', 'Content-Type', 'Authorization', 'Accept'];
const CORS_EXPOSE_HEADERS = ['Content-Length', 'Content-Type'];
/**
 * Cookies
 * @param allowOrigin
 */
function cookieHeaders(cookie) {
    return {
        'Set-Cookie': cookie,
    };
}
exports.cookieHeaders = cookieHeaders;
/**
 * CORS headers
 * @param allowOrigin
 * docs: https://developer.mozilla.org/ru/docs/Web/HTTP/CORS
 */
function corsHeaders(allowOrigin) {
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Expose-Headers': CORS_EXPOSE_HEADERS.join(','),
    };
}
exports.corsHeaders = corsHeaders;
function corsAnswerHeaders() {
    return {
        'Access-Control-Allow-Methods': CORS_METHODS.join(','),
        'Access-Control-Allow-Headers': CORS_HEADERS.join(','),
        'Access-Control-Max-Age-Scope': 'domain',
        'Access-Control-Max-Age': CORS_MAX_AGE_SECONDS,
    };
}
exports.corsAnswerHeaders = corsAnswerHeaders;
function corsAdditionalHeaders() {
    return {
        'Content-Length': '0',
        'Cache-Control': 'max-age=3600',
        'Vary': 'Origin'
    };
}
exports.corsAdditionalHeaders = corsAdditionalHeaders;
/**
 * Cache headers
 */
function noCacheHeaders() {
    return {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Expires': 'Mon, 01 Jan 1990 21:00:12 GMT',
        'Last-Modified': 'Sun, 17 May 1998 03:44:30 GMT'
    };
}
exports.noCacheHeaders = noCacheHeaders;
/**
 * Security headers
 */
function secureHeaders() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1'
    };
    // Referrer-Policy
    // See https://www.w3.org/TR/referrer-policy/#referrer-policies
}
exports.secureHeaders = secureHeaders;
function applyHeaders(res, arg1, ...args) {
    const headers = Object.assign(arg1, ...args);
    for (const [h, v] of Object.entries(headers)) {
        res.setHeader(h, v);
    }
}
exports.applyHeaders = applyHeaders;
/**
 * Check content type is JSON
 * @param str
 */
function isCTypeJson(str) {
    return str.toLocaleLowerCase().indexOf(http_1.CONTENT_TYPE_JSON) >= 0;
}
exports.isCTypeJson = isCTypeJson;
/**
 * Chech conten url encoded
 * @param str
 */
function isCTypeUrlEnc(str) {
    return str.toLocaleLowerCase().indexOf(http_1.CONTENT_TYPE_URLENCODED) >= 0;
}
exports.isCTypeUrlEnc = isCTypeUrlEnc;
/**
 * Urldecode options. Size limited earlier at body parser
 */
const PARSE_QUERY_OPTS = {
    depth: 2,
    parseArrays: false,
    ignoreQueryPrefix: true
};
/**
 * Used for parse query string and urlencoded body
 * @param query
 */
function parseQuery(query) {
    return qs_1.parse(query || '', PARSE_QUERY_OPTS);
}
exports.parseQuery = parseQuery;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9oZWxwZXJzL2h0dHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQkFBc0M7QUFHdEMsNkJBQXdDO0FBQ3hDLHFDQUFtQztBQUNuQyw0Q0FBK0U7QUFHL0U7O0dBRUc7QUFDVSxRQUFBLFFBQVEsR0FBRyxJQUFJLE1BQU0sQ0FBQyw4REFBOEQsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUc3Rzs7O0dBR0c7QUFDSCxxQkFBcUIsR0FBWTtJQUMvQixJQUFJLENBQUMsR0FBRztRQUFFLE9BQU87SUFDakIsTUFBTSxLQUFLLEdBQUcsV0FBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLE9BQU8sR0FBRyxLQUFLLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM1QyxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILHVCQUE4QixNQUEwQixFQUFFLE9BQTJCO0lBRW5GLE9BQU8sZ0JBQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxXQUFXLENBQUMsZ0JBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUNqRSxDQUFDO0FBSEQsc0NBR0M7QUFFRDs7R0FFRztBQUNILE1BQU0sb0JBQW9CLEdBQVcsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsV0FBVztBQUNuRSxNQUFNLFlBQVksR0FBYSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQSxDQUFDLHlDQUF5QztBQUN4RixNQUFNLFlBQVksR0FBYSxDQUFDLGtCQUFrQixFQUFFLDZCQUE2QixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDN0gsTUFBTSxtQkFBbUIsR0FBYSxDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFBO0FBRXhFOzs7R0FHRztBQUNILHVCQUE4QixNQUFxQjtJQUNqRCxPQUFPO1FBQ0ws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