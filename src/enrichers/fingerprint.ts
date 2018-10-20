import { BaseIncomingMessage, BusBaseEnricher, BusMsgHdr, Dictionary } from "@app/types";
import { TheIds } from "@rockstat/rock-me-ts";
import { IN_GENERIC, SERVICE_TRACK } from "@app/constants";
import { epglue } from "@app/helpers";

export class FingerPrintEnricher implements BusBaseEnricher {

  ids = new TheIds();

  handle = async (key: string, msg: BaseIncomingMessage): Promise<Dictionary<any>> => {
    if (msg.td && msg.td.ip && msg.td.ua) {
      const fpid = this.ids.xxhash(`${msg.td.ip}:${msg.td.ua}`);
      return { fpid };
    }
    return {};
  }
}
