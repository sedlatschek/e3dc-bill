#!/usr/bin/env node

import { Command  } from "commander";
import generateMonthlySheet from "./commands/generate-monthly-sheet.js";
import { DateTime } from "luxon";

const program = new Command();

program.name('e3dc-bill')
  .description('CLI to generate bills out of E3DC wallbox data');

program.command('generate-monthly-sheet')
  .description('generate a sheet with charging data of a given month')
  .option('--from <date>', '(optional) ISO-8601 starting date from which the data is retrieved', DateTime.now().startOf('month').toISODate())
  .option('--to <date>', '(optional) ISO-8601 end date to which the data is retrieved', DateTime.now().endOf('month').toISODate())
  .option('--wallbox <id>', 'E3DC wallbox id')
  .option('--username <username>', 'username (usually email) to authenticate with E3DC')
  .option('--password <password>', 'password to authenticate with E3DC')
  .action(async (options) => {
    const from = DateTime.fromISO(options.from);
    if (!from.isValid) {
      throw new Error('Invalid from date');
    }

    const to = DateTime.fromISO(options.to)
    if (!to.isValid) {
      throw new Error('Invalid to date');
    }

    const wallboxId = parseInt(options.wallbox, 10);

    const { username, password } = options;

    await generateMonthlySheet({
      from,
      to,
      wallboxId,
      username,
      password,
    });
  });

program.parse(process.argv);
