import { BaseIncomingMessage } from "@app/types";
import { BandResponse, response, STATUS_NOT_FOUND } from "@rockstat/rock-me-ts";
import { CHANNEL_HTTP_PIXEL, CHANNEL_HTTP, CHANNEL_WEBSOCK } from "@app/constants";

export const TrackHandler = () => {
  return async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
    if (msg.channel === CHANNEL_HTTP_PIXEL){
      return response.pixel({});
    }
    if (msg.channel === CHANNEL_HTTP){
      return response.data({data: {id: msg.id}});
    }
    if (msg.channel === CHANNEL_WEBSOCK){
      if (msg.name === 'ping') {
        return response.data({
          data: {
            message: 'pong'
          } 
        })
      }
      if (msg.name === 'hello') {
        return response.data({ data: { message: 'hi' } })
      }
    }
    return response.error({ statusCode: STATUS_NOT_FOUND })
  }
}
