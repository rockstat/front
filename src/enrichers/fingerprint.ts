import { BaseIncomingMessage, HTTPServiceMapParams } from "@app/types";
import { BandResponse, response, TheIds } from "@rockstat/rock-me-ts";
import { CHANNEL_HTTP_PIXEL, IN_GENERIC, SERVICE_TRACK } from "@app/constants";
import { Dispatcher } from "@app/Dispatcher";
import { epglue } from "@app/helpers";

const ids = new TheIds()

export const fingerprintEnricher = (disp: Dispatcher) => {

  const handler = async (key: string, msg: BaseIncomingMessage): Promise<object> => {
    if (msg.td && msg.td.ip && msg.td.ua) {
      return { fpid: ids.xxhash(`${msg.td.ip}:${msg.td.ua}`) }
    }
    return {};
  }

  disp.handleBus.subscribe(epglue(IN_GENERIC, SERVICE_TRACK), handler);

}
