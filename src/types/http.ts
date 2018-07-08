export type HTTPBodyParams = { [key: string]: any }
export type HTTPQueryParams = { [key: string]: any }

export interface HTTPRouteParams {
  service: string;
  name: string;
  projectId: number;
}


// === Rounting based on
export interface RouteOn {
  method: string;
  contentType: string;
  query: { [key: string]: any };
  path: string,
  origin: string
}


export interface HTTPRoutingResult {
  key: string;
  channel: string;
  params: HTTPRouteParams;
  location?: string;
  contentType?: string;
}

