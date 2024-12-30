import axios from "axios";

export class E3dcApi {
  private readonly axiosClient

  public constructor(private readonly authToken: string) {
    this.axiosClient = axios.create({ headers: {
      Authorization: `Bearer ${authToken}`
    }});
  }

  public async getChargings(wallboxId: number): Promise<void> {
    const response = await this.axiosClient({
      method: 'get',
      url: `https://e-mobility.e3dc.com/e-mobility/${wallboxId}/charging`,
      headers: {
        Accept: 'application/json',
        Origin: 'https://my.e3dc.com',
        Referer: 'https://my.e3dc.com/'
      }
    });

    console.log(response.status);
  }
}
