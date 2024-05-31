import { BaseIncomingMessage, BusBaseEnricher, Dictionary } from "@app/types";
import { xxhash } from "@rockstat/rock-me-ts";

export class FingerPrintEnricher implements BusBaseEnricher {


  handle = async (key: string, msg: BaseIncomingMessage): Promise<Dictionary<any>> => {
    if (msg.td && msg.td.ip && msg.td.ua) {
      const fpid = xxhash(`${msg.td.ip}:${msg.td.ua}`);
      return { fpid };
    }
    return {};
  }
}
