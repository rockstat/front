import { BaseIncomingMessage } from "@app/types";
import { BandResponse, response } from "@rockstat/rock-me-ts";
import { CHANNEL_HTTP_PIXEL } from "@app/constants";

export const TrackHandler = () => {
  return async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
    return msg.channel === CHANNEL_HTTP_PIXEL ? response.pixel({}) : response.data({data: {id: msg.id}});
  }
}
