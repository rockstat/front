import { BaseIncomingMessage, HTTPServiceMapParams } from "@app/types";
import { STATUS_BAD_REQUEST, CHANNEL_HTTP_REDIR, IN_GENERIC } from "@app/constants";
import { DispatchResult, error, redirect } from "@rockstat/rock-me-ts";
import { Dispatcher } from "@app/Dispatcher";
import { epglue } from "@app/helpers";

export const baseRedirect = (chanMap: HTTPServiceMapParams, disp: Dispatcher) => {
  const handler = async (key: string, msg: BaseIncomingMessage): Promise<DispatchResult> => {
    if (msg.data.to) {
      return redirect(msg.data.to)
    } else {
      return error('Parameter "to" is required', STATUS_BAD_REQUEST)
    }
  }

  const serviceMap: Array<[string, string]> = Object.entries(chanMap)
    .filter(([k, v]) => v == CHANNEL_HTTP_REDIR)

  for (const [k, v] of serviceMap) {
    disp.handleBus.subscribe(epglue(IN_GENERIC, k), handler);
  }
}
