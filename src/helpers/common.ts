/**
 * Event path glue
 * @param args
 */
export function epglue(...args: Array<string>): string {
  return args.join('.');
}

/**
 * Check event path in child of parent
 * @param parent Parent path
 * @param child Child path
 */
export function epchild(parent: string, child: string): boolean | string {
  return child.substr(0, parent.length) === parent
    ? child.slice(parent.length, child.length)
    : false;

}

export function listVal(input?: string | string[]): string | undefined {
  return Array.isArray(input) ? input[0] : input;
}

export function pick<T, K extends keyof T>(obj: T, paths: K[]): Pick<T, K> {
  return { ...paths.reduce((mem, key) => ({ ...mem, [key]: obj[key] }), {}) } as Pick<T, K>;
}

export function pick2<T, K extends keyof T>(obj: T, paths: K[]): Pick<T, K> {
  return Object.assign({}, ...paths.map(prop => ({ [prop]: obj[prop] }))) as Pick<T, K>;
}

