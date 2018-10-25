import { removeWWW } from '@app/helpers/remove-www';
import { Dictionary } from '@app/types';

export function autoDomain(domain: string) {
  domain = removeWWW(domain);
  if (!domain) return;
  const parts = domain.split('.');
  return parts.slice(parts.length > 2 ? 1 : 0).join('.')
}
