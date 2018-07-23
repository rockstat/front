"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function removeWWW(domain) {
    if (!domain)
        return domain;
    if (domain.substr(0, 4) === 'www.') {
        domain = domain.substr(4, domain.length - 4);
    }
    return domain;
}
exports.removeWWW = removeWWW;
;
//# sourceMappingURL=remove-www.js.map