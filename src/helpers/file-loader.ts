import { readFileSync } from 'fs';
import { join } from 'path';

export const readSync = (...parts: string[]) => {
  return readFileSync(join(__dirname, '..', '..', ...parts));
}
