#!/usr/bin/env node

import { name, version } from '../package.json';
import { Command  } from 'commander';
import { DateTime } from 'luxon';
import configureCommand from './commands/configure.js';
import generateCharginInvoiceCommand from './commands/generate-charging-invoice/generate-charging-invoice.js';
import { bootstrap } from './config.js';

bootstrap();

console.log('\x1b[35m%s\x1b[0m', `${name} v${version}`);

const program = new Command();

program.name(name)
  .version(version)
  .description('CLI to generate bills out of E3DC wallbox data');

program.command('configure').action(configureCommand);

program.command('generate-charging-invoice')
  .description('Generate a sheet with charging data of a timespan')
  .option('--invoice-number <number>', 'Invoice number')
  .option('--unit-price <price>', 'Unit price for energy')
  .option('--invoice-date <date>', '(optional) Invoice date. Defaults to today.', undefined)
  .option('--from <date>', '(optional) ISO-8601 starting date from which the data is retrieved', DateTime.now().startOf('month').toISODate())
  .option('--to <date>', '(optional) ISO-8601 end date to which the data is retrieved', DateTime.now().endOf('month').toISODate())
  .action(async (options: Record<string, string>): Promise<void> => {
    const invoiceDate = typeof options.invoiceDate === 'string'
      ? DateTime.fromISO(options.invoiceDate)
      : DateTime.now();
    if (!invoiceDate.isValid) {
      throw new Error('Invalid invoice date');
    }

    const from = DateTime.fromISO(options.from);
    if (!from.isValid) {
      throw new Error('Invalid from date');
    }

    const to = DateTime.fromISO(options.to)
    if (!to.isValid) {
      throw new Error('Invalid to date');
    }

    if (to < from) {
      throw new Error('to date must be after from date');
    }

    await generateCharginInvoiceCommand({
      invoiceDate,
      unitPrice: parseFloat(options.unitPrice),
      invoiceNumber: options.invoiceNumber,
      from: from.set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
      }),
      to: to.set({
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999,
      }),
    });
  });

program.parse(process.argv);
