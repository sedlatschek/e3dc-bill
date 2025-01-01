import { readFileSync } from 'fs';
import { join } from 'path';

const packageJsonFileName = join(import.meta.dirname, '..', 'package.json');

type Package = {
  name: string;
  version: string;
}

export function getPackage(): Package {
  const packageJson = readFileSync(packageJsonFileName, 'utf8');
  const { name, version } = JSON.parse(packageJson) as Package;
  return {
    name,
    version,
  };
};
