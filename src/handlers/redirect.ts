import { BaseIncomingMessage } from "@app/types";
import { BandResponse, STATUS_BAD_REQUEST, response } from "@rockstat/rock-me-ts";

export const RedirectHandler = () => {
  return async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
    if (msg.data.to) {
      return response.redirect({ location: msg.data.to })
    } else {
      return response.error({ errorMessage: 'Parameter "to" is required', statusCode: STATUS_BAD_REQUEST })
    }
  }

}
