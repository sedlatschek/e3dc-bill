#!/usr/bin/env node

import { Command  } from 'commander';
import generateCharginInvoice from './commands/generate-charging-invoice/generate-charging-invoice.js';
import { DateTime } from 'luxon';

const program = new Command();

program.name('e3dc-bill')
  .description('CLI to generate bills out of E3DC wallbox data');

program.command('generate-charging-invoice')
  .description('Generate a sheet with charging data of a timespan')
  .option('--invoice-number <number>', 'Invoice number')
  .option('--unit-price <price>', 'Unit price for energy')
  .option('--invoice-date <date>', '(optional) Invoice date. Defaults to today.', undefined)
  .option('--from <date>', '(optional) ISO-8601 starting date from which the data is retrieved', DateTime.now().startOf('month').toISODate())
  .option('--to <date>', '(optional) ISO-8601 end date to which the data is retrieved', DateTime.now().endOf('month').toISODate())
  .action(async (options: Record<string, string>) => {
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

    await generateCharginInvoice({
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
