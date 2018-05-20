"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateTemplateString(template) {
    var sanitized = template
        .replace(/\$\{([\s]*[^;\s\{]+[\s]*)\}/g, function (_, match) {
        return `\$\{map.${match.trim()}\}`;
    })
        // Afterwards, replace anything that's not ${map.expressions}' (etc) with a blank string.
        .replace(/(\$\{(?!map\.)[^}]+\})/g, '');
    return Function('map', `return \`${sanitized}\``);
}
exports.generateTemplateString = generateTemplateString;
;
