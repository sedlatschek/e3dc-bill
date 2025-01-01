import axios from 'axios';
import { type Objectified, objectify } from './util.js';
import { DateTime } from 'luxon';

type ChargingResponse = {
  id: number[];
  sessionID: string[];
  serialno: number[];
  wallboxID: string[];
  carID: string[];
  authType: string[];
  authData: string[];
  status: string[];
  startAt: string[];
  stopAt: string[];
  chargeTimeActive: number[];
  chargeTimeInactive: number[];
  dischargeTimeActive: (null | string)[];
  chargeCounterReadingStart: string[];
  chargeCounterReadingStop: string[];
  energyAll: string[];
  energySolar: string[];
  dischargeCounterReadingStart: (null | string)[];
  dischargeCounterReadingStop: (null | string)[];
  energyDischarged: (null | string)[];
  receiptData: string[];
  receiptSignature: string[];
  midEnergy: boolean[];
  midEnergyInconsistent: boolean[];
  midSessionOffline: boolean[];
  createdAt: string[];
  updatedAt: string[];
  dynamic: boolean[];
  chargePriceTotal: (null | string)[];
};

export type Charging = Omit<Objectified<ChargingResponse>, 'startAt' | 'stopAt' | 'createdAt' | 'updatedAt' | 'energyAll' | 'energySolar'> & {
  startAt: DateTime;
  stopAt: DateTime;
  createdAt: DateTime;
  updatedAt: DateTime;
  energyAll: number;
  energySolar: number;
  energyGrid: number;
}

export class E3dcApi {
  private readonly axiosClient

  public constructor(private readonly authToken: string) {
    this.axiosClient = axios.create({ headers: {
      Authorization: `Bearer ${authToken}`,
    }});
  }

  public async getChargings(options: {
    wallboxId: number,
    from: DateTime,
    to: DateTime,
  }): Promise<Charging[]> {
    console.log('\x1b[36m%s\x1b[0m', 'Retrieving chargings');

    const { wallboxId, from, to } = options;

    const response = await this.axiosClient<ChargingResponse>({
      method: 'get',
      url: `https://e-mobility.e3dc.com/e-mobility/${wallboxId}/charging`,
      headers: {
        Accept: 'application/json',
        Origin: 'https://my.e3dc.com',
        Referer: 'https://my.e3dc.com/',
      },
    });

    const chargings = objectify(response.data);

    console.log('\x1b[32m%s\x1b[0m', `🡒 got ${chargings.length} in total`);
    console.log('\x1b[36m%s\x1b[0m', 'Filtering chargings');

    const filteredChargings = chargings.map((charging) => {
      const energyAll = parseFloat(charging.energyAll) / 1000;
      const energySolar = parseFloat(charging.energySolar) / 1000;
      const energyGrid = energyAll - energySolar / 1000;
      return {
        ...charging,
        startAt: DateTime.fromISO(charging.startAt),
        stopAt: DateTime.fromISO(charging.stopAt),
        createdAt: DateTime.fromISO(charging.createdAt),
        updatedAt: DateTime.fromISO(charging.updatedAt),
        energyAll,
        energySolar,
        energyGrid,
      }
    }).filter((charging) => charging.startAt >= from && charging.stopAt <= to);

    console.log('\x1b[32m%s\x1b[0m', `🡒 got ${filteredChargings.length} within the timespan`);

    return filteredChargings;
  }
}
