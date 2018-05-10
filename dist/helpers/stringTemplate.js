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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5nVGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaGVscGVycy9zdHJpbmdUZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLGdDQUF1QyxRQUFnQjtJQUVyRCxJQUFJLFNBQVMsR0FBRyxRQUFRO1NBQ3JCLE9BQU8sQ0FBQyw4QkFBOEIsRUFBRSxVQUFVLENBQUMsRUFBRSxLQUFLO1FBQ3pELE9BQU8sV0FBVyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztJQUNyQyxDQUFDLENBQUM7UUFDRix5RkFBeUY7U0FDeEYsT0FBTyxDQUFDLHlCQUF5QixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRTFDLE9BQXlCLFFBQVEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxTQUFTLElBQUksQ0FBQyxDQUFDO0FBRXRFLENBQUM7QUFYRCx3REFXQztBQUFBLENBQUMifQ==