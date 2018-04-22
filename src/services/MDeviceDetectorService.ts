import * as Ajv from 'ajv';
import { Service } from 'typedi';
import { HttpService, Dispatcher, CallCache, Configurer } from '@app/lib'
import { RemoteHttpServiceConfig, RemoteService, EnrichService } from '@app/types';
import { LogFactory, Logger } from "@app/log";


type QueryFormat = {
  userAgent: string
};

// Custom JSON revivier
const noNullReviver = (k: string, v: any) => {
  return v === null ? undefined : v
}

const ajv = new Ajv({
  removeAdditional: 'all',
  coerceTypes: true,
});

const MDDSchema = {
  title: 'MDD validation schema',
  additionalProperties: false,
  properties: {
    isBot: { type: "boolean" },
    device: {
      type: "object", properties: {
        type: { type: "string" },
        brand: { type: "string" },
        model: { type: "string" }
      }
    },
    os: {
      type: "object", properties: {
        name: { type: "string" },
        version: { type: "string" },
        platform: { type: "string" }
      }
    },
    client: {
      type: "object", properties: {
        type: { type: "string" },
        name: { type: "string" },
        version: { type: "string" }
      }
    },
    bot: {
      type: "object", properties: {
        name: { type: "string" },
        category: { type: "string" },
        producer: {
          type: "object", properties: {
            name: { type: "string" }
          }
        }
      }
    }
  }
}

const MDDValidate = ajv.compile(MDDSchema);

interface MMDData {
  isBot: boolean;
  device?: {
    type?: string;
    brand?: string;
    model?: string;
  };
  os?: {
    name?: string;
    version?: string;
    platform?: string;
  };
  client?: {
    type?: string;
    name?: string;
    version?: string;
  };
  bot?: {
    name: string;
    category: string;
    producer: {
      name: string;
    }
  };
}

export = class MDeviceDetectorService implements EnrichService {

  transport: HttpService;
  options: RemoteHttpServiceConfig;
  dispatcher: Dispatcher;
  cache: CallCache;
  log: Logger;
  prefix: string;

  constructor({ config, log }: { log: Logger, config: RemoteHttpServiceConfig }) {

    if (config === undefined) {
      throw new Error('Service not configured');
    }

    this.log = log;
    this.options = config;
    this.prefix = config.prefix;
    this.transport = new HttpService(config, log);
    this.cache = new CallCache();
    this.log.info('Initialized');
  }

  register(dispatcher: Dispatcher) {
    this.dispatcher = dispatcher;
    dispatcher.registerEnricher('incoming.track', this.enrich);
  }


  private getter: (key: string) => any = (key) => {
    return this.doQuery({ userAgent: key });
  };

  /**
   * Execute http query
   * @param param object with userAgent
   */
  private async doQuery(params: QueryFormat): Promise<any> {
    const raw = await this.transport.query('query', params);
    const data = JSON.parse(raw, noNullReviver);
    const valid = MDDValidate(data);
    return valid ? { [this.prefix]: data } : undefined;
  }

  /**
   * Check configuration and run query
   * @param params object with userAgent
   */
  enrich: (key: string, msg: any) => Promise<any> | undefined = (key, msg) => {
    if (msg.data.userAgent) try {
      return this.cache.process(this.getter, msg.data.userAgent);
    } catch (error) {
      this.log.error(error);
    }
  }
}
