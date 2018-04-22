import * as crypto from 'crypto';
import fetch from 'node-fetch';
import { generateTemplateString } from '../helpers/stringTemplate';
import { LogFactory, Logger } from "@app/log";
import { RemoteHttpServiceConfig, anyobj } from '../types';
import { STATUS_OK } from '../constants/http';
import { Indentifier } from '@app/lib';

/**
 * Simple http api wrapper
 */
export class HttpService {

  private log: Logger;
  private baseUrl: string;
  private endpoints: { [key: string]: Function } = {};

  constructor(config: RemoteHttpServiceConfig, log: Logger) {

    this.log = log;
    this.baseUrl = config.baseUrl;

    for (const [k, v] of Object.entries(config.methods)) {
      this.endpoints[k] = generateTemplateString(v);
    }
  }

  async query(method: string, params: object): Promise<string> {

    // escape input params
    const encParams = <anyobj>{};
    for (const [k, v] of Object.entries(params)) {
      encParams[k] = encodeURIComponent(v);
    }

    // url by template
    const query = this.endpoints[method](encParams);
    const resp = await fetch(`${this.baseUrl}/${query}`, {timeout: 2000});

    // status shold be 200
    if (resp.status !== STATUS_OK) {
      throw new Error('Wrond status code');
    }
    return await resp.text();
  }
}

