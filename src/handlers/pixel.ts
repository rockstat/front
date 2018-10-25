import { BaseIncomingMessage } from "@app/types";
import { BandResponse, response } from "@rockstat/rock-me-ts";

export const PixelHandler = () => {
  return async (key: string, msg: BaseIncomingMessage): Promise<BandResponse> => {
    return response.pixel({})
  }
}
