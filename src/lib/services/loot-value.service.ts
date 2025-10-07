/**
 * Loot Value Service (Singleton)
 * Direct database queries with Realtime updates
 * No in-memory cache - leverages Supabase's speed
 */

import { supabase } from '@/backend/supabase/clients';

interface LootEstimation {
  totalSilver: number;
  entries: Array<{
    uniqueName: string;
    count: number;
    estimatedUnitValue: number;
    estimatedTotalValue: number;
  }>;
}

class LootValueService {
  private static instance: LootValueService;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): LootValueService {
    if (!LootValueService.instance) {
      LootValueService.instance = new LootValueService();
    }
    return LootValueService.instance;
  }

  /**
   * Get prices for multiple items in one query
   * Fast batch query to Supabase
   */
  private async getPrices(itemIds: string[]): Promise<Map<string, number>> {
    if (itemIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('market_prices')
      .select('itemId, sellPriceMax, sellPriceMin, buyPriceMax, buyPriceMin')
      .eq('city', 'Lymhurst')
      .in('itemId', itemIds)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[LootValueService] Failed to fetch prices:', error);
      return new Map();
    }

    // Build price map (item_id -> best price)
    const priceMap = new Map<string, number>();

    for (const price of data) {
      const currentBest = priceMap.get(price.itemId) ?? 0;
      const sellPrice = price.sellPriceMax > 0 ? price.sellPriceMax : price.sellPriceMin;
      const buyPrice = price.buyPriceMax > 0 ? price.buyPriceMax : price.buyPriceMin;
      const bestPrice = Math.max(sellPrice, buyPrice);

      if (bestPrice > currentBest) {
        priceMap.set(price.itemId, bestPrice);
      }
    }

    return priceMap;
  }

  /**
   * Estimate loot value from inventory
   * Queries database directly - always fresh data with Realtime
   */
  async estimateLootValue(
    inventory: Array<{ Type?: string | null; Count?: number | null }> | null | undefined
  ): Promise<LootEstimation> {
    if (!inventory || inventory.length === 0) {
      return { totalSilver: 0, entries: [] };
    }

    // Extract unique item IDs
    const itemIds = [...new Set(
      inventory
        .filter(item => item?.Type)
        .map(item => item.Type!)
    )];

    // Fetch prices for all items in one query
    const prices = await this.getPrices(itemIds);

    const entries: LootEstimation['entries'] = [];
    let totalSilver = 0;

    for (const item of inventory) {
      if (!item?.Type) {continue;}

      const unitValue = prices.get(item.Type) ?? 0;
      if (unitValue === 0) {continue;}

      const quantity = item.Count && item.Count > 0 ? item.Count : 1;
      const totalValue = unitValue * quantity;

      entries.push({
        uniqueName: item.Type,
        count: quantity,
        estimatedUnitValue: unitValue,
        estimatedTotalValue: totalValue,
      });

      totalSilver += totalValue;
    }

    return {
      totalSilver,
      entries: entries.sort((a, b) => b.estimatedTotalValue - a.estimatedTotalValue),
    };
  }

  /**
   * Batch estimate loot value for multiple kills
   * Single database query for all items
   */
  async batchEstimateLoot(
    kills: Array<{ Victim?: { Inventory?: any[] } }>
  ): Promise<Map<number, LootEstimation>> {
    // Collect all unique item IDs from all kills
    const allItemIds = new Set<string>();
    for (const kill of kills) {
      const inventory = kill.Victim?.Inventory;
      if (inventory) {
        for (const item of inventory) {
          if (item?.Type) {
            allItemIds.add(item.Type);
          }
        }
      }
    }

    // Fetch all prices in ONE query
    const prices = await this.getPrices([...allItemIds]);

    // Calculate loot value for each kill
    const results = new Map<number, LootEstimation>();

    for (let i = 0; i < kills.length; i++) {
      const kill = kills[i];
      const inventory = kill.Victim?.Inventory;
      
      if (!inventory || inventory.length === 0) {
        results.set(i, { totalSilver: 0, entries: [] });
        continue;
      }

      const entries: LootEstimation['entries'] = [];
      let totalSilver = 0;

      for (const item of inventory) {
        if (!item?.Type) {continue;}

        const unitValue = prices.get(item.Type) ?? 0;
        if (unitValue === 0) {continue;}

        const quantity = item.Count && item.Count > 0 ? item.Count : 1;
        const totalValue = unitValue * quantity;

        entries.push({
          uniqueName: item.Type,
          count: quantity,
          estimatedUnitValue: unitValue,
          estimatedTotalValue: totalValue,
        });

        totalSilver += totalValue;
      }

      results.set(i, {
        totalSilver,
        entries: entries.sort((a, b) => b.estimatedTotalValue - a.estimatedTotalValue),
      });
    }

    return results;
  }
}

// Export singleton instance
export const lootValueService = LootValueService.getInstance();
export type { LootEstimation };
