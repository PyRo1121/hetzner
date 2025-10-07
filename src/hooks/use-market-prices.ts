/**
 * React Query hook for fetching market prices
 * Fetches from Supabase database instead of API for full item access
 */

import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/backend/supabase/clients';
import type { Server } from '@/types';

interface UseMarketPricesOptions {
  itemIds?: string | string[]; // Optional, can be string or array
  locations?: string | string[];
  qualities?: string | string[];
  server?: Server;
  enabled?: boolean;
  limit?: number; // Default limit to prevent timeout on large datasets
  searchTerm?: string; // Search term for filtering items
}

export function useMarketPrices({
  itemIds,
  locations,
  qualities,
  server = 'Americas',
  enabled = true,
  limit = 300, // Default to 300 for fast initial load
  searchTerm,
}: UseMarketPricesOptions) {
  return useQuery({
    queryKey: ['market-prices', itemIds, locations, qualities, server, limit, searchTerm],
    queryFn: async () => {
      // When searching, use a much higher limit to find matching items
      const effectiveLimit = searchTerm ? 20000 : limit;

      // Use a more efficient query that gets latest price per item/city/quality combo
      // This prevents getting duplicate old records
      let query = supabase
        .from('market_prices')
        .select('itemId, city, quality, sellPriceMin, buyPriceMax, timestamp, server')
        .eq('server', server);
      let itemIdFilter: string[] | undefined;

      if (itemIds) {
        itemIdFilter = Array.isArray(itemIds) ? itemIds : [itemIds];
      }

      // Filter by locations if provided
      if (locations) {
        const locationArray = Array.isArray(locations) ? locations : locations.split(',');
        query = query.in('city', locationArray);
      }

      // Filter by qualities if provided
      if (qualities) {
        const qualityArray = Array.isArray(qualities) 
          ? qualities 
          : qualities.split(',').map(Number);
        query = query.in('quality', qualityArray);
      }

      // If searching, filter by localized name via ao_items lookup
      if (searchTerm?.trim()) {
        const searchValue = searchTerm.trim();
        const { data: matchingItems, error: itemSearchError } = await supabase
          .from('ao_items')
          .select('unique_name')
          .ilike('localized_en', `%${searchValue}%`)
          .limit(200);

        if (itemSearchError) {
          throw itemSearchError;
        }

        const searchIds = (matchingItems ?? []).map(item => item.unique_name);

        if (searchIds.length === 0) {
          return [];
        }

        itemIdFilter = itemIdFilter
          ? itemIdFilter.filter(id => searchIds.includes(id))
          : searchIds;
      }

      if (itemIdFilter && itemIdFilter.length > 0) {
        query = query.in('itemId', itemIdFilter);
      } else if (itemIdFilter) {
        return [];
      }

      // Order by timestamp descending and apply limit
      query = query.order('timestamp', { ascending: false }).limit(effectiveLimit);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      // Deduplicate: keep only the latest price for each item/city/quality combo
      const latestPrices = new Map<string, (typeof data)[0]>();
      data.forEach(price => {
        const key = `${price.itemId}-${price.city}-${price.quality}`;
        const existing = latestPrices.get(key);
        if (!existing || new Date(price.timestamp) > new Date(existing.timestamp)) {
          latestPrices.set(key, price);
        }
      });

      return Array.from(latestPrices.values());
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchOnMount: false, // Use cached data if available
  });
}
