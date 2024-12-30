import { DateTime } from 'luxon';
import { E3dcApi } from '../e3dc/E3dcApi.js';
import { authenticate } from '../e3dc/auth.js';

type GenerateMonthlySheetOptions = {
  from: DateTime;
  to: DateTime;
  wallboxId: number;
  username: string;
  password: string;
}

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
  const chargings = await api.getChargings({
    wallboxId,
    from,
    to,
  });

  console.log('chargings', chargings);
  console.log('length', chargings.length);
}
