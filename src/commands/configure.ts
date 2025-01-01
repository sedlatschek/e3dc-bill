import { existsSync } from 'fs';
import { copyFile } from 'fs/promises'
import { join } from 'path';
import open from 'open';
import { configDirectory } from '../config.js';

const defaultConfigFileName = join(configDirectory, 'default.yml');
const localConfigFileName = join(configDirectory, 'local.yml');

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default async (): Promise<void> => {
  if (!existsSync(localConfigFileName)) {
    await copyFile(defaultConfigFileName, localConfigFileName);
  }
  console.log('Opening config file in your default editor');
  console.log('Make your changes and save the file to apply them.');

  await sleep(1000);

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  open(localConfigFileName);
};
