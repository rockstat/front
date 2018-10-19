import { parse as parseQs } from 'qs';
import { ServerResponse, OutgoingHttpHeaders, } from 'http';

import { parse as parseUrl } from 'url';
import { listVal } from './common';
import { CONTENT_TYPE_URLENCODED, CONTENT_TYPE_JSON } from '../constants/http';
import { HTTPHeaders } from '@app/types';
import { BandResponse } from '@rockstat/rock-me-ts';



/**
 * Transparent 1x1 gif
 */
export const emptyGif = Buffer.from('R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==', 'base64');


/**
 *
 * @param url
 */
function extrachHost(url?: string): string | undefined {
  if (!url) return;
  const parts = parseUrl(url);
  return `${parts.protocol}//${parts.host}`;
}

/**
 * Computes origin based on user agent or just take
 * @param origin
 * @param referer
 */
export function computeOrigin(origin?: string | string[], referer?: string | string[]): string {

  return listVal(origin) || extrachHost(listVal(referer)) || '*';
}

/**
 * Main cors consts
 */
const CORS_MAX_AGE_SECONDS: string = `${60 * 60 * 24}`; // 24 hours
const CORS_METHODS: string[] = ['POST', 'GET'] // , 'PUT', 'PATCH', 'DELETE', 'OPTIONS',
const CORS_HEADERS: string[] = ['X-Requested-With', 'Access-Control-Allow-Origin', 'Content-Type', 'Authorization', 'Accept']
const CORS_EXPOSE_HEADERS: string[] = ['Content-Length', 'Content-Type']

/**
 * Cookies
 * @param allowOrigin
 */
export function cookieHeaders(cookie: Array<string>): HTTPHeaders {
  return [['Set-Cookie', cookie]]
}

/**
 * CORS headers
 * @param allowOrigin
 * docs: https://developer.mozilla.org/ru/docs/Web/HTTP/CORS
 */
const CorsHeaders = Object.entries({
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Expose-Headers': CORS_EXPOSE_HEADERS.join(','),
});
export function corsHeaders(allowOrigin: string): HTTPHeaders {
  const ch: HTTPHeaders = [['Access-Control-Allow-Origin', allowOrigin]];
  return ch.concat(CorsHeaders)
}

const CorsAnswerHeaders = Object.entries({
  'Access-Control-Allow-Methods': CORS_METHODS.join(','),
  'Access-Control-Allow-Headers': CORS_HEADERS.join(','),
  'Access-Control-Max-Age-Scope': 'domain',
  'Access-Control-Max-Age': CORS_MAX_AGE_SECONDS,
});
export function corsAnswerHeaders(): HTTPHeaders {
  return CorsAnswerHeaders;
}

const CorsAdditionalHeaders = Object.entries({
  'Content-Length': '0',
  'Cache-Control': 'max-age=3600',
  'Vary': 'Origin'
});
export function corsAdditionalHeaders(): HTTPHeaders {
  return CorsAdditionalHeaders;
}


/**
 * Cache headers
 */
const NoCacheHeaders = Object.entries({
  'Pragma': 'no-cache',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Expires': 'Mon, 01 Jan 1990 21:00:12 GMT',
  'Last-Modified': 'Sun, 17 May 1998 03:44:30 GMT'
});
export function noCacheHeaders(): HTTPHeaders {
  return NoCacheHeaders;
}

/**
 * Security headers
 */
const SecureHeaders = Object.entries({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1'
});
export function secureHeaders(): HTTPHeaders {
  return SecureHeaders;

  // Referrer-Policy
  // See https://www.w3.org/TR/referrer-policy/#referrer-policies
}

/**
 * Check content type is JSON
 * @param str
 */
export function isCTypeJson(str: string) {
  return str.toLocaleLowerCase().indexOf(CONTENT_TYPE_JSON) >= 0;
}

/**
 * Chech conten url encoded
 * @param str
 */
export function isCTypeUrlEnc(str: string) {
  return str.toLocaleLowerCase().indexOf(CONTENT_TYPE_URLENCODED) >= 0;
}

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
export function parseQuery(query?: string): { [key: string]: any } {
  return parseQs(query || '', PARSE_QUERY_OPTS);
}
