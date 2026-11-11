
export const flatten_dict = function(d:{ [k: string]: { [k: string]: string } | number | string | Array<any> }, sep='_', prefix=''){
    const res: { [k: string]: any} = {};
    for (let [k, v] of Object.entries(d)){
        k = k.replace('$', 's_');
        if(typeof v === "object" && !Array.isArray(v)){
            let nv = flatten_dict(v, sep, prefix + k + sep)
            for (let [k2, v2] of Object.entries(nv)){
                res[k2] = v2;
            }
        } else {
            res[prefix + k] = v;
        }
    }
    return res;
  }

/**
 * Extracts mixpanel records from request payload.
 *
 * mixpanel_flutter has no own transport: it wraps platform SDKs, so one server url
 * receives different payload formats depending on platform:
 *  - android (mixpanel-android): form-urlencoded `data=<base64 json array>`
 *  - ios / macos (Mixpanel-swift): json array in request body (http server wraps it to `{data: [...]}`)
 *  - web (mixpanel-js): form-urlencoded `data=<base64 json>` or `data=<json>`, array or single event
 * Gzipped bodies are unpacked by http server using Content-Encoding header.
 */
export const decodeMPPayload = (payload: any): Array<any> | undefined => {
  let recs = payload;
  if (typeof recs === 'string') {
    const str = recs.trim();
    const isJson = str.startsWith('[') || str.startsWith('{');
    recs = JSON.parse(isJson ? str : Buffer.from(str, 'base64').toString());
  }
  if (Array.isArray(recs)) {
    return recs;
  }
  if (recs && typeof recs === 'object') {
    return [recs];
  }
}
