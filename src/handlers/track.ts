import { BaseIncomingMessage, HTTPServiceMapParams } from "@app/types";
import { BandResponse, response } from "@rockstat/rock-me-ts";
import { CHANNEL_HTTP_PIXEL, IN_GENERIC, SERVICE_TRACK } from "@app/constants";
import { Dispatcher } from "@app/Dispatcher";
import { epglue } from "@app/helpers";

export const TrackHandler = () => {
  return async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
    return msg.channel === CHANNEL_HTTP_PIXEL ? response.pixel({}) : response.data({data: {id: msg.id}});
  }
}
