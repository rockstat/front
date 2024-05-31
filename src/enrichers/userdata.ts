import { BaseIncomingMessage, Dictionary, BusBaseEnricher } from "@app/types";
import { RedisClient, getAppDeps } from "@rockstat/rock-me-ts";
// import { IN_GENERIC, SERVICE_TRACK } from "@app/constants";
// import { epglue } from "@app/helpers";
// import { Container } from "typedi";

// TheIds.SInt64ToBase64()
const build_key = (uid: string): string => {
  return 's:' + uid;
}

const default_ttl = 24 * 60 * 60 * 30;

export class UserDataEnricher implements BusBaseEnricher {

  redis: RedisClient = getAppDeps().getDep('redis').create();

  handle = async (key: string, msg: BaseIncomingMessage): Promise<Dictionary<any>> => {

    if (msg.uid) {
      const skey = build_key(msg.uid);

      if (msg.service === 'userdata' && msg.name === 'update' && msg.data) {
        try {

          const data = [];

          for (let [k, v] of Object.entries(msg.data)) {
            if (k === 'uid' || k === 'ttl') {
              continue;
            }
            data.push(k, JSON.stringify(v));
          }

          const ttl = msg.data.ttl || default_ttl;

          if (data.length) {
            await this.redis.hmset(skey, ...data);
            await this.redis.expire(skey, ttl);
          }

          return {}

        } catch (e) {
          console.error(e);
        }
      }

      try {

        const hdata = await this.redis.hgetall(skey);
        const stored: Dictionary<any> = {};
        if (Array.isArray(hdata) && hdata.length) {
          for (let i = 0; i < hdata.length; i += 2) {
            stored[hdata[i]] = JSON.parse(hdata[i + 1]);
          }
          return { stored };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  }
}
