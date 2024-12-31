import { join } from 'path';
import { readFile } from 'fs/promises';
import config from 'config';
import ejs from 'ejs';
import { DateTime } from 'luxon';
import { Charging, E3dcApi } from '../../e3dc/E3dcApi.js';
import { authenticate } from '../../e3dc/auth.js';
import { createPdf } from '../../pdf.js';

type GenerateMonthlySheetOptions = {
  from: DateTime;
  to: DateTime;
  wallboxId: number;
  username: string;
  password: string;
}

const templateFileName = join(import.meta.dirname, 'template.ejs');
const template = await readFile(templateFileName, 'utf8');

export default async (options: GenerateMonthlySheetOptions): Promise<void> => {
  const {
    from,
    to,
    wallboxId,
    username,
    password,
  } = options;

  const authToken = await authenticate({
    username,
    password,
  });
  const api = new E3dcApi(authToken);

  const chargings = (await api.getChargings({
    wallboxId,
    from,
    to,
  }));

  await Promise.all([
    createInvoice(chargings.filter((charging) => charging.energySolar > 0)),
    createRefund(chargings.filter((charging) => charging.energyGrid > 0)),
  ]);
}

async function createInvoice(chargings: Charging[]): Promise<void> {
  const totalEnergy = chargings.reduce(
    (acc, charging) => acc + charging.energySolar,
    0,
  );
  const subTotal = totalEnergy * config.get<number>('document.unitPrice');
  const vat = subTotal * config.get<number>('localization.vatRate');
  const total = subTotal + vat;

  const html = ejs.render(template, {
    document: 'invoice',
    ...config.get('document'),
    ...config.get('localization'),
    chargings,
    totalEnergy,
    subTotal,
    vat,
    total,
  }, { async: false });

  await createPdf({
    html,
    path: 'invoice.pdf',
  });
}

async function createRefund(chargings: Charging[]): Promise<void> {
  const totalEnergy = chargings.reduce(
    (acc, charging) => acc + charging.energyGrid,
    0,
  );
  const subTotal = totalEnergy * config.get<number>('document.unitPrice');
  const vat = subTotal * config.get<number>('localization.vatRate');
  const total = subTotal + vat;

  const html = ejs.render(template, {
    document: 'refund',
    ...config.get('document'),
    ...config.get('localization'),
    chargings,
    totalEnergy,
    subTotal,
    vat,
    total,
  }, { async: false });

  await createPdf({
    html,
    path: 'refund.pdf',
  });
}
