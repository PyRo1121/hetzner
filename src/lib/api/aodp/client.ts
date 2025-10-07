/**
 * AODP (Albion Online Data Project) API Client
 * Documentation: https://www.albion-online-data.com/
 * Rate Limits: 180 requests/minute, 300 requests/5 minutes
 */

import { z } from 'zod';

const BASE_URLS = {
  Americas: 'https://west.albion-online-data.com',
  Europe: 'https://east.albion-online-data.com',
  Asia: 'https://east.albion-online-data.com',
} as const;

export type Server = keyof typeof BASE_URLS;

export class AODPError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AODPError';
  }
}

const JSON_HEADERS = {
  Accept: 'application/json',
} as const;

const PriceDataSchema = z.object({
  item_id: z.string(),
  city: z.string(),
  quality: z.number().min(1).max(5),
  sell_price_min: z.number(),
  sell_price_min_date: z.string(),
  sell_price_max: z.number(),
  sell_price_max_date: z.string(),
  buy_price_min: z.number(),
  buy_price_min_date: z.string(),
  buy_price_max: z.number(),
  buy_price_max_date: z.string(),
});

const HistoryDataSchema = z.object({
  item_id: z.string(),
  location: z.string(),
  quality: z.number(),
  data: z.array(
    z.object({
      timestamp: z.string(),
      avg_price: z.number(),
      item_count: z.number(),
    })
  ),
});

const GoldPriceSchema = z.object({
  price: z.number(),
  timestamp: z.string(),
});

export type PriceData = z.infer<typeof PriceDataSchema>;
export type HistoryData = z.infer<typeof HistoryDataSchema>;
export type GoldPrice = z.infer<typeof GoldPriceSchema>;

/**
 * AODP API Client
 */
export class AODPClient {
  private baseUrl: string;
  private server: Server;

  constructor(server: Server = 'Americas') {
    this.server = server;
    this.baseUrl = BASE_URLS[server];
  }

  /**
   * Get current market prices for items
   * @param itemIds - Comma-separated list of item IDs
   * @param locations - Optional comma-separated list of cities
   * @param qualities - Optional comma-separated list of qualities (1-5)
   */
  async getPrices(
    itemIds: string,
    options?: {
      locations?: string;
      qualities?: string;
    }
  ): Promise<PriceData[]> {
    const params = new URLSearchParams();
    if (options?.locations) {params.append('locations', options.locations);}
    if (options?.qualities) {params.append('qualities', options.qualities);}

    const url = `${this.baseUrl}/api/v2/stats/prices/${itemIds}${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const response = await fetch(url, { headers: JSON_HEADERS });

    if (!response.ok) {
      throw new AODPError(`AODP API error: ${response.status} ${response.statusText}`,
        response.status);
    }

    const data = await response.json();
    return z.array(PriceDataSchema).parse(data);
  }

  /**
   * Get historical price data
   * @param itemIds - Comma-separated list of item IDs
   * @param options - Query options
   */
  async getHistory(
    itemIds: string,
    options?: {
      date?: string;
      endDate?: string;
      locations?: string;
      qualities?: string;
      timeScale?: 1 | 24; // 1 = hourly, 24 = daily
    }
  ): Promise<HistoryData[]> {
    const params = new URLSearchParams();
    if (options?.date) {params.append('date', options.date);}
    if (options?.endDate) {params.append('end_date', options.endDate);}
    if (options?.locations) {params.append('locations', options.locations);}
    if (options?.qualities) {params.append('qualities', options.qualities);}
    if (options?.timeScale) {params.append('time-scale', options.timeScale.toString());}

    const url = `${this.baseUrl}/api/v2/stats/history/${itemIds}?${params.toString()}`;

    const response = await fetch(url, { headers: JSON_HEADERS });

    if (!response.ok) {
      throw new AODPError(`AODP API error: ${response.status} ${response.statusText}`,
        response.status);
    }

    const data = await response.json();
    return z.array(HistoryDataSchema).parse(data);
  }

  /**
   * Get gold price history
   * @param options - Query options
   */
  async getGoldPrices(options?: {
    date?: string;
    endDate?: string;
    count?: number;
  }): Promise<GoldPrice[]> {
    const params = new URLSearchParams();
    if (options?.date) {params.append('date', options.date);}
    if (options?.endDate) {params.append('end_date', options.endDate);}
    if (options?.count) {params.append('count', options.count.toString());}

    const url = `${this.baseUrl}/api/v2/stats/gold${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const response = await fetch(url, { headers: JSON_HEADERS });

    if (!response.ok) {
      throw new AODPError(`AODP API error: ${response.status} ${response.statusText}`,
        response.status);
    }

    const data = await response.json();
    return z.array(GoldPriceSchema).parse(data);
  }

  /**
   * Change server region
   */
  setServer(server: Server) {
    this.server = server;
    this.baseUrl = BASE_URLS[server];
  }

  /**
   * Get current server
   */
  getServer(): Server {
    return this.server;
  }
}

// Export singleton instance
export const aodpClient = new AODPClient();
