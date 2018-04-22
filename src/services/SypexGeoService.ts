import { Service } from 'typedi';
import * as Ajv from 'ajv';
import { HttpService, Configurer, CallCache, Dispatcher } from '@app/lib'
import { LogFactory, Logger } from "@app/log";
import {
  RemoteHttpServiceConfig,
  EnrichService
} from '@app/types';

type QueryFormat = {
  ip: string
};

const ajv = new Ajv({
  removeAdditional: 'all',
  coerceTypes: true,
});

const SXGSchema = {
  title: 'SXG validation schema',
  additionalProperties: false,
  properties: {
    country: {
      type: 'object', properties: {
        iso: { type: 'string' },
        name_en: { type: 'string' },
        name_ru: { type: 'string' }
      }
    },
    region: {
      type: 'object', properties: {
        iso: { type: 'string' },
        name_en: { type: 'string' },
        name_ru: { type: 'string' }
      }
    },
    city: {
      type: 'object', properties: {
        id: { type: 'integer' },
        name_en: { type: 'string' },
        name_ru: { type: 'string' }
      }
    }
  }
}

const SXGSValidator = ajv.compile(SXGSchema);

// Custom JSON revivier
const noNullReviver = (k: string, v: any) => {
  return v === null ? undefined : v
}

export = class SypexGeoService implements EnrichService {

  transport: HttpService;
  options: RemoteHttpServiceConfig;
  cache: CallCache;
  prefix: string;
  log: Logger;

  constructor({ config, log }: { log: Logger, config: RemoteHttpServiceConfig }) {

    if (config === undefined) {
      throw new Error('Service not configured');
    }

    this.log = log;
    this.prefix = config.prefix;
    this.options = config;
    this.transport = new HttpService(config, log);
    this.cache = new CallCache();
    this.log.info('Initialized');
  }

  register(dispatcher: Dispatcher) {
    dispatcher.registerEnricher('incoming.track', this.enrich);
  }

  /**
   * Execute http query
   * @param param object with userAgent
   */
  private async doQuery(params: QueryFormat): Promise<any | undefined> {
    const raw = await this.transport.query('query', params);
    const data = JSON.parse(raw, noNullReviver);
    const valid = SXGSValidator(data);
    return valid ? { [this.prefix]: data } : undefined;
  }

  private getter: (key: string) => any = (key) => {
    return this.doQuery({ ip: key });
  };

  /**
   * Check configuration and run query
   * @param params object with userAgent
   */
  enrich: (key: string, msg: any) => Promise<any> | undefined = (key, msg) => {
    if (msg.data.ip) try {
      return this.cache.process(this.getter, msg.data.ip)
    } catch (error) {
      this.log.error(error);
    }
  }
}
