
const objectToString = Object.prototype.toString;
const objectAsString = '[object Object]';

const uidRE = new RegExp('^[0-9]{10,22}$');

export function isValidUid(uid?: string): boolean {
  if (!uid) return false;
  return uidRE.test(uid);
};

/**
 * return valid uid or undefined
 */
export function cleanUid(uid?: string): string | undefined {
  return isValidUid(uid) ? uid : undefined;
}


export function isObject(v: any): boolean {
  return !!v && typeof v === 'object' && !Array.isArray(v) && objectToString.call(v) === objectAsString;
}

/**
 * Utilized / non empty object
 * @param v
 */
export function isEmptyObject(v: any): boolean {
  return isObject(v) && Object.keys(v).length === 0;
}

/**
 * Check is primitive string
 * @param v
 */
export function isString(v: any): boolean {
  return typeof v === "string"
}

export function isEmptyString(v: any) {
  return v === '';
}

/**
 * Check is primitive number
 * @param v
 */
export function isNumber(v: any): boolean {
  return typeof v === 'number';
}
export const ENUM = 'enum';

export function stringToNumber(v: string): number | undefined {
  return isEmptyString(v) ? undefined : +v;
}

/**
 * Check is primitive boolean
 * @param v
 */
export function isBoolean(v: any): boolean {
  return typeof v === "boolean"
}

/**
 * Check is primitive exists
 * @param v
 */
export function isNil(v: any): boolean {
  return v === undefined || v === null;
}
