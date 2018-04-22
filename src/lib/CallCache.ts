import * as NodeCache from 'node-cache';
import * as xxhash from 'xxhash';

interface CacheOpts {
  stdTTL: number;
  checkperiod: number;
  useClones: boolean;
}

interface Opts {
  urlTemplate: string;
  useCache: true;
  cache: CacheOpts;
}

const cacheDefaults = <CacheOpts>{
  stdTTL: 600,
  checkperiod: 600,
  useClones: true
}

export class CallCache {

  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache(Object.assign({}, cacheDefaults));
  }

  async process(build: (key: string) => any, key: string): Promise<any> {
    const cache = this.cache.get(key);
    if (cache) {
      return cache;
    }
    const result = await build(key);
    this.cache.set(key, result);
    return result;
  }

  get(key: string): any {
    return this.cache.get(this.key(key));
  }

  set(key: string, data: any): void {
    this.cache.set(this.key(key), data);
  }

  key(key: string): string {
    return <string>xxhash.hash64(new Buffer(key), 0, 'base64');
  }

}
