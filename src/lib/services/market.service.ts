/**
 * Market Service (Singleton)
 * Handles all market-related business logic
 * Single source of truth for market data
 */

import { CACHE_TTL, getCache, setCache } from '@/lib/cache/redis-cache.server';
import { supabase } from '@/backend/supabase/clients';
import { itemsService } from './items.service';

export interface MarketPrice {
  itemId: string;
  city: string;
  quality: number;
  sellPriceMin: number;
  sellPriceMax: number;
  buyPriceMin: number;
  buyPriceMax: number;
  timestamp: string;
}

export interface ArbitrageOpportunity {
  itemId: string;
  itemName: string;
  buyCity: string;
  sellCity: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  profitMargin: number;
  quality: number;
  quantity: number;
}

class MarketService {
  private static instance: MarketService | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): MarketService {
    MarketService.instance ??= new MarketService();
    return MarketService.instance;
  }

  private readonly AODP_BASE_URL = 'https://west.albion-online-data.com/api/v2/stats';

  /**
   * Get current market prices from AODP API
   */
  async getCurrentPricesFromAPI(
    itemIds: string[],
    options: { cities?: string[]; qualities?: number[]; server?: 'Americas' | 'Europe' | 'Asia' } = {}
  ): Promise<MarketPrice[]> {
    const {
      cities = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'],
      qualities = [1, 2, 3, 4, 5],
      server = 'Americas',
    } = options;

    const cacheKey = `market:${server}:aodp:prices:${itemIds.join(',')}:${cities.join(',')}:${qualities.join(',')}`;
    const cached = await getCache<MarketPrice[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    // Route through our server-side API to respect server selection and caching headers
    const apiUrl = new URL(`/api/market/prices`, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    apiUrl.searchParams.set('items', itemIds.join(','));
    apiUrl.searchParams.set('locations', cities.join(','));
    apiUrl.searchParams.set('qualities', qualities.join(','));
    apiUrl.searchParams.set('server', server);

    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      throw new Error(`AODP API error: ${response.status}`);
    }
    const { data: rawData } = await response.json();
    const prices: MarketPrice[] = rawData.map((item: any) => ({
      itemId: item.item_id,
      city: item.city,
      quality: item.quality,
      sellPriceMin: item.sell_price_min,
      sellPriceMax: item.sell_price_max,
      buyPriceMin: item.buy_price_min,
      buyPriceMax: item.buy_price_max,
      timestamp: item.sell_price_min_date ?? new Date().toISOString(),
    }));

    await setCache(cacheKey, prices, CACHE_TTL.STANDARD);
    return prices;
  }

  /**
   * Find arbitrage opportunities
   */
  async findArbitrageOpportunities(
    itemIds: string[],
    options: { minProfit?: number; maxItems?: number; server?: 'Americas' | 'Europe' | 'Asia' } = {}
  ): Promise<ArbitrageOpportunity[]> {
    const { minProfit = 1000, maxItems = 50 } = options;
    const prices = await this.getCurrentPricesFromAPI(itemIds, { server: options.server });
    const opportunities: ArbitrageOpportunity[] = [];

    // Group by item and quality
    const itemGroups = new Map<string, MarketPrice[]>();
    for (const price of prices) {
      const key = `${price.itemId}_${price.quality}`;
      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)!.push(price);
    }

    for (const [key, cityPrices] of itemGroups.entries()) {
      const [itemId, qualityStr] = key.split('_');
      const quality = parseInt(qualityStr);

      // Find best buy and sell prices
      let bestBuy: MarketPrice | null = null;
      let bestSell: MarketPrice | null = null;

      for (const price of cityPrices) {
        // Use sell price for buying (what sellers are asking)
        // Use buy price for selling (what buyers are offering)
        if (!bestBuy || price.sellPriceMin < bestBuy.sellPriceMin) {
          bestBuy = price;
        }
        if (!bestSell || price.buyPriceMax > bestSell.buyPriceMax) {
          bestSell = price;
        }
      }

      if (bestBuy && bestSell && bestBuy.city !== bestSell.city) {
        const buyPrice = bestBuy.sellPriceMin;
        const sellPrice = bestSell.buyPriceMax;
        const profit = sellPrice - buyPrice;

        if (profit >= minProfit) {
          opportunities.push({
            itemId,
            itemName: itemId,
            buyCity: bestBuy.city,
            sellCity: bestSell.city,
            buyPrice,
            sellPrice,
            profit,
            profitMargin: (profit / buyPrice) * 100,
            quality,
            quantity: Math.min(
              bestBuy.sellPriceMin, // Available to buy
              bestSell.buyPriceMax // Available to sell
            ),
          });
        }
      }
    }

    // Enrich item names with caching
    const uniqueIds = Array.from(new Set(opportunities.map((o) => o.itemId)));
    const nameMap = new Map<string, string>();
    for (const id of uniqueIds) {
      const nameCacheKey = `items:name:${id}`;
      const cachedName = await getCache<string>(nameCacheKey);
      if (cachedName !== null) {
        nameMap.set(id, cachedName);
        continue;
      }
      const item = await itemsService.getById(id);
      const name = item ? itemsService.getLocalizedName(item) : id;
      nameMap.set(id, name);
      await setCache(nameCacheKey, name, CACHE_TTL.STABLE);
    }

    const enriched = opportunities.map((o) => ({ ...o, itemName: nameMap.get(o.itemId) ?? o.itemId }));
    // Sort by profit margin descending and limit results
    return enriched.sort((a, b) => b.profitMargin - a.profitMargin).slice(0, maxItems);
  }

  /**
   * Get price history from AODP API
   */
  async getPriceHistoryFromAPI(
    itemId: string,
    options: { city?: string; quality?: number; days?: number } = {}
  ): Promise<Array<{ timestamp: string; avgPrice: number; itemCount: number }>> {
    const { city = 'Caerleon', quality = 1, days = 7 } = options;

    const cacheKey = `market:aodp:history:${itemId}:${city}:${quality}:${days}`;
    const cached =
      await getCache<Array<{ timestamp: string; avgPrice: number; itemCount: number }>>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const url = new URL(`${this.AODP_BASE_URL}/history/${itemId}`);
    url.searchParams.set('locations', city);
    url.searchParams.set('qualities', quality.toString());
    url.searchParams.set('date', startDate.toISOString().split('T')[0]);
    url.searchParams.set('end_date', endDate.toISOString().split('T')[0]);
    url.searchParams.set('time-scale', '1'); // hourly

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`AODP API error: ${response.status}`);
    }

    const rawData = await response.json();
    const history = rawData.map((entry: any) => ({
      timestamp: entry.timestamp,
      avgPrice: entry.avg_price,
      itemCount: entry.item_count,
    }));

    await setCache(cacheKey, history, CACHE_TTL.STABLE);
    return history;
  }

  /**
   * Get current market prices
   */
  async getCurrentPrices(itemId?: string, city?: string) {
    let query = supabase.from('market_prices').select('*').order('timestamp', { ascending: false });

    if (itemId) {
      query = query.eq('item_id', itemId);
    }
    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query.limit(100);
    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Get gold prices
   */
  async getGoldPrices(limit: number = 100) {
    const { data, error } = await supabase
      .from('gold_prices')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }
    return data;
  }

  /**
   * Get latest gold price
   */
  async getLatestGoldPrice() {
    const { data, error } = await supabase
      .from('gold_prices')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  }

  /**
   * Get price history
   */
  async getPriceHistory(itemId: string, city: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('item_id', itemId)
      .eq('city', city)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      throw error;
    }
    return data;
  }
}

export const marketService = MarketService.getInstance();
