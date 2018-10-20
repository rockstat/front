import { BaseIncomingMessage, HTTPServiceMapParams } from "@app/types";
import { SERVICE_REDIR, IN_GENERIC } from "@app/constants";
import { BandResponse, STATUS_BAD_REQUEST, response } from "@rockstat/rock-me-ts";
import { Dispatcher } from "@app/Dispatcher";
import { epglue } from "@app/helpers";

export const RedirectHandler = () => {
  return async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
    if (msg.data.to) {
      return response.redirect({ location: msg.data.to })
    } else {
      return response.error({ errorMessage: 'Parameter "to" is required', statusCode: STATUS_BAD_REQUEST })
    }
  }

}
