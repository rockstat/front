export function removeWWW (domain: string) {
  if (!domain) return domain;
  if (domain.substr(0, 4) === 'www.') {
    domain = domain.substr(4, domain.length - 4);
  }
  return domain;
};
