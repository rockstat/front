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
//# sourceMappingURL=http.js.map