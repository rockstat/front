import { BaseIncomingMessage } from "@app/types";
import { BandResponse, response, STATUS_NOT_FOUND } from "@rockstat/rock-me-ts";

export const HelloHandler = () => {
  return async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
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
    return response.error({ statusCode: STATUS_NOT_FOUND })
  }
}
