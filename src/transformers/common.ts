
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