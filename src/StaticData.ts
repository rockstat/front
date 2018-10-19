import { Service, Container } from "typedi";
import { readFileSync } from 'fs';
import { StaticConfig, Envs, FrontierConfig } from "@app/types";
import { ENV_DEV } from "@app/constants";
import { LoggerType, Logger, AppConfig } from '@rockstat/rock-me-ts';
import { readSync } from '@app/helpers'

type LibParams = { [key: string]: any };

const LIBJS = 'lib.js';

export class StaticData {

  private options: StaticConfig;
  private content: { [k: string]: Buffer } = {};
  private log: LoggerType;
  private dev: boolean;
  private _paths: Array<string> = []

  constructor() {
    this.log = Container.get(Logger).for(this);
    const appConfig = Container.get<AppConfig<FrontierConfig>>(AppConfig);
    this.dev = appConfig.env === ENV_DEV;
    this.options = appConfig.static;
    // warmup lib
    for (const [key, fn] of Object.entries(this.options)) {
      this._paths.push(key);
      const raw = this.content[key] = readSync(fn);
      const size = Math.round(raw.length / 1024)
      this.log.info(`Loaded static file: ${key}/${fn} ${size}kb`)
    }
  }

  get paths(): string[] {
    return this._paths;
  }

  getItem(key: string, libParams?: LibParams) {
    return this.content[key];
  }

  rtConfig(params: LibParams): string {
    return `;window["rstat"]&&window["rstat"]('configure',${JSON.stringify(params)});`;
  }

  prepareLib(params: LibParams) {
    const cmd = Buffer.from(this.rtConfig(params));
    return Buffer.concat([cmd, this.content['lib.js']]);
  }
}
