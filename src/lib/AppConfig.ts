import { readFileSync } from 'fs';
import { safeLoadAll } from 'js-yaml';
import { render as ejsRender, Options as EjsOptions } from 'ejs';
import { Service } from 'typedi';
import { sync as globSync } from 'glob';
import * as dotenv from 'dotenv';
import * as mergeOptions from 'merge-options';
import {
  ENV_PROD,
  ENV_STAGE,
  ENV_DEV
} from '@app/constants';
import * as consts from '@app/constants';
import {
  WriterClickHouseConfig,
  WriterCHTableDefinition,
  HttpConfig,
  WsConfig,
  PinoConfig,
  Config,
  Envs,
  IdentifyConfig,
  BrowserLibConfig,
  ClientConfig,
  TypeOrmConfig,
  RemoteServicesConfig,
} from '../types';
import { TypeOrm } from '@app/lib';

dotenv.config();

@Service({ global: true })
export class Configurer {

  configDir: string = './config';
  config: Config;
  env: Envs;
  ejsConfig:EjsOptions = {

  }

  get identify(): IdentifyConfig { return this.config.identify; }
  get httpConfig(): HttpConfig { return this.config.http; }
  get webSocketConfig(): WsConfig { return this.config.websocket; }
  get logConfig(): PinoConfig { return this.config.log.pino; }
  get ipcConfig(): object { return this.config.ipc; }
  get services(): RemoteServicesConfig { return this.config.services; }
  get browserLib(): BrowserLibConfig { return this.config.browserLib[this.env]; }
  get client(): ClientConfig { return this.config.client.common; }
  get typeorm(): TypeOrmConfig { return this.config.typeorm; }


  /**
   * Reading all accessible configuration files including custom
   */
  constructor() {
    const parts = globSync(`${this.configDir}/**/*.yml`, { nosort: true })
      .map(file => readFileSync(file)
        .toString());

    const yaml = ejsRender(parts.join('\n'), { env: process.env, ...consts }, this.ejsConfig);

    this.config = mergeOptions({}, ...safeLoadAll(yaml));
    this.env = this.config.env = Configurer.env;

    const { writers } = this.config;
    const { clickhouse } = writers;

    if (clickhouse) {
      writers.clickhouse = this.handleCHExtension(clickhouse);
    }

    this.config.writers = writers;
  }

  /**
   * Handling ClickHouse table extensions via _options: extend: basename
   * @param config ClickHouse configuration
   */
  handleCHExtension(config: WriterClickHouseConfig): WriterClickHouseConfig {
    const { base, tables, ...rest } = config;

    for (const table of Object.keys(tables)) {
      const definition = tables[table];
      const { _options, ...cols } = definition;
      // excluding extend action
      const { extend, ...options } = _options;
      // extenxing
      if (extend && tables[extend]) {
        // extracting source table schema ans opts
        const { _options: ioptions, ...icols } = tables[extend];
        // extending base table
        Object.assign(options, ioptions);
        Object.assign(cols, icols);
      }
      // Moving back;
      Object.assign(definition, base, cols, { _options });
    }

    return { base, tables, ...rest };
  }

  static get env(): Envs {
    switch (process.env.NODE_ENV) {
      case 'production':
      case 'prod':
        return ENV_PROD;
      case 'stage':
        return ENV_STAGE;
      default:
        return ENV_DEV;
    }
  }

  forService(name: string): RemoteServiceConfig {
    return this.config.services[name];
  }
}

