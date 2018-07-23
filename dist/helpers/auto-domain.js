"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const remove_www_1 = require("@app/helpers/remove-www");
function autoDomain(domain) {
    domain = remove_www_1.removeWWW(domain);
    if (!domain)
        return;
    const parts = domain.split('.');
    return parts.slice(parts.length > 2 ? 1 : 0).join('.');
}
exports.autoDomain = autoDomain;
//# sourceMappingURL=auto-domain.js.map