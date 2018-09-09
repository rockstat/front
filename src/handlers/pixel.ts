import { BaseIncomingMessage, HTTPServiceMapParams } from "@app/types";
import { DispatchResult, pixel } from "@rockstat/rock-me-ts";
import { CHANNEL_HTTP_PIXEL, IN_GENERIC } from "@app/constants";
import { Dispatcher } from "@app/Dispatcher";
import { epglue } from "@app/helpers";

export const basePixel = (chanMap: HTTPServiceMapParams, disp: Dispatcher) => {
  const handler = async (key: string, msg: BaseIncomingMessage): Promise<DispatchResult> => {
    return pixel()
  }

  const serviceMap: Array<[string, string]> = Object.entries(chanMap)
    .filter(([k, v]) => v == CHANNEL_HTTP_PIXEL)

  for (const [k, v] of serviceMap) {
    disp.handleBus.subscribe(epglue(IN_GENERIC, k), handler);
  }
}
