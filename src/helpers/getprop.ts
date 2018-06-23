import * as getval from 'get-value';
import { EnrichersRequirements } from '@app/types';

export interface DotPropGetterOptions {
  [k: string]: string;
}

export function getvals(obj: { [k: string]: any }, keys: EnrichersRequirements) {
  const result: { [k: string]: any } = {};
  for (const [k, prop] of keys) {
    result[k] = getval(obj, prop);
  }
  return result;
}

export function dotPropGetter(options: DotPropGetterOptions) {
  const keys = Object.keys(options);
  const props = Object.values(options);

