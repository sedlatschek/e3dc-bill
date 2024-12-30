import { DateTime } from "luxon";
import { E3dcApi } from "../e3dc/E3dcApi.js";
import { authenticate } from "../e3dc/auth.js";

type GenerateMonthlySheetOptions = {
  from: DateTime;
  to: DateTime;
  wallboxId: number;
  username: string;
  password: string;
}

export default async (options: GenerateMonthlySheetOptions): Promise<void> => {
  const authToken = await authenticate(options.username, options.password);
  const api = new E3dcApi(authToken);
  await api.getChargings(options.wallboxId);
}
