type TemplateParams = {
  [key: string]: string | number
};
type TemplateCallable = (map: TemplateParams) => string

export function generateTemplateString(template: string): TemplateCallable {

  var sanitized = template
    .replace(/\$\{([\s]*[^;\s\{]+[\s]*)\}/g, function (_, match) {
      return `\$\{map.${match.trim()}\}`;
    })
    // Afterwards, replace anything that's not ${map.expressions}' (etc) with a blank string.
    .replace(/(\$\{(?!map\.)[^}]+\})/g, '');

  return <TemplateCallable>Function('map', `return \`${sanitized}\``);

};

