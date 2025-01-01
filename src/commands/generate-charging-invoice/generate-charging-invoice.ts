import { join } from 'path';
import { readFile } from 'fs/promises';
import config from 'config';
import ejs from 'ejs';
import { DateTime } from 'luxon';
import { Charging, E3dcApi } from '../../e3dc/E3dcApi.js';
import { authenticate } from '../../e3dc/auth.js';
import { createPdf } from '../../pdf.js';

type GenerateChargingInvoiceOptions = {
  invoiceDate: DateTime;
  unitPrice: number;
  invoiceNumber: string;
  from: DateTime;
  to: DateTime;
}

const templateFileName = join(import.meta.dirname, 'template.ejs');
const template = await readFile(templateFileName, 'utf8');

export default async (
  options: GenerateChargingInvoiceOptions,
): Promise<void> => {
  const {
    unitPrice,
    invoiceDate,
    invoiceNumber,
    from,
    to,
  } = options;

  const authToken = await authenticate({
    username: config.get<string>('e3dc.username'),
    password: config.get<string>('e3dc.password'),
  });
  const api = new E3dcApi(authToken);

  const chargings = (await api.getChargings({
    wallboxId: config.get<number>('e3dc.wallbox'),
    from,
    to,
  }));

  console.log('\x1b[34m%s\x1b[0m', 'Generating documents');

  await Promise.all([
    createInvoice({
      chargings: chargings.filter((charging) => charging.energySolar > 0),
      unitPrice,
      invoiceDate,
      invoiceNumber,
    }),
    createRefund({
      chargings: chargings.filter((charging) => charging.energyGrid > 0),
      unitPrice,
      invoiceDate,
    }),
  ]);
}

async function createInvoice(
  options: {
    chargings: Charging[],
    unitPrice: number,
    invoiceDate: DateTime
    invoiceNumber: string,
  },
): Promise<void> {
  const { chargings, unitPrice, invoiceDate, invoiceNumber } = options;
  const path = 'invoice.pdf';

  const totalEnergy = chargings.reduce(
    (acc, charging) => acc + charging.energySolar,
    0,
  );
  const subTotal = totalEnergy * unitPrice;
  const vat = subTotal * config.get<number>('localization.vatRate');
  const total = subTotal + vat;

  const html = ejs.render(template, {
    ...config.get('document'),
    ...config.get('localization'),
    document: 'invoice',
    invoiceDate,
    invoiceNumber,
    unitPrice,
    chargings,
    totalEnergy,
    subTotal,
    vat,
    total,
  }, { async: false });

  await createPdf({
    html,
    path,
  });

  console.log('\x1b[32m%s\x1b[0m', `🡒 Generated ${path}`);
}

async function createRefund(
  options: {
    chargings: Charging[],
    unitPrice: number,
    invoiceDate: DateTime
  },
): Promise<void> {
  const { chargings, unitPrice, invoiceDate } = options;
  const path = 'refund.pdf';

  const totalEnergy = chargings.reduce(
    (acc, charging) => acc + charging.energyGrid,
    0,
  );
  const subTotal = totalEnergy * unitPrice;

  const html = ejs.render(template, {
    ...config.get('document'),
    ...config.get('localization'),
    document: 'refund',
    invoiceDate,
    unitPrice,
    chargings,
    totalEnergy,
    subTotal,
    total: subTotal,
  }, { async: false });

  await createPdf({
    html,
    path,
  });

  console.log('\x1b[32m%s\x1b[0m', `🡒 Generated ${path}`);
}
