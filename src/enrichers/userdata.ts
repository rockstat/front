import { BaseIncomingMessage, Dictionary, BusBaseEnricher } from "@app/types";
import { RedisFactory, RedisClient } from "@rockstat/rock-me-ts";
import { IN_GENERIC, SERVICE_TRACK } from "@app/constants";
import { epglue } from "@app/helpers";
import { Container } from "typedi";

// TheIds.SInt64ToBase64()
const build_key = (uid: string): string => {
  return 's:' + uid;
}

export class UserDataEnricher implements BusBaseEnricher {

  redis = Container.get<RedisFactory>(RedisFactory).create();

  handle = async (key: string, msg: BaseIncomingMessage): Promise<Dictionary<any>> => {
    if (msg.uid) {
      try {
        const skey = build_key(msg.uid);
        const hdata = await this.redis.hgetall(skey);
        const stored: Dictionary<any> = {};
        if (Array.isArray(hdata) && hdata.length) {
          for (let i = 0; i < hdata.length; i += 2) {
            stored[hdata[i]] = JSON.parse(hdata[i + 1]);
          }
          return { stored };
        }
      } catch (exc) {
        console.error(exc);
      }
    }
    return {};
  }
}
