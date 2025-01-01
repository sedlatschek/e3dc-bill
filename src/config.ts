import { join } from 'path';

export const configDirectory = join(import.meta.dirname, '..', 'config');

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR
  ? process.env.NODE_CONFIG_DIR
  : configDirectory;
