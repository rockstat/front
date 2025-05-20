import { BaseIncomingMessage } from "@app/types";
import { BandResponse, response, STATUS_BAD_REQUEST } from "@rockstat/rock-me-ts";
import { promises as fs } from 'fs';
import * as mime from 'mime-types';

const re_naming = new RegExp('^([a-zA-Z0-9_-]{1,50}\.[a-zA-Z0-9]{1,5})$');


export const StaticHandler = () => {
  return async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {

    if (!msg.ext) {
      return response.error({ errorMessage: 'The file extension is missing', statusCode: STATUS_BAD_REQUEST })
    }

    const fn = msg.name + '.' + (msg.ext || '')

    if (re_naming.exec(fn) === null) {
      return response.error({ errorMessage: 'Invalid file name', statusCode: STATUS_BAD_REQUEST })
    }

    const contentType = mime.lookup(msg.ext) || undefined;

    try {
      const data = await fs.readFile(`public/${fn}`);
      return response.data({ data, contentType })

    } catch (error) {
      return response.error({ errorMessage: 'Can not find the requested file', statusCode: STATUS_BAD_REQUEST })
    }
  }
}
