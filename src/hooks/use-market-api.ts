/**
 * React Query hook for fetching market prices via API
 * Uses the /api/market/prices endpoint
 */

import { useQuery } from '@tanstack/react-query';

import type { Server } from '@/types';

interface MarketPrice {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

interface UseMarketApiOptions {
  itemIds: string | string[];
  locations?: string | string[];
  qualities?: string | number[];
  server?: Server;
  enabled?: boolean;
}

export function useMarketApi({
  itemIds,
  locations,
  qualities,
  server = 'Americas',
  enabled = true,
}: UseMarketApiOptions) {
  return useQuery({
    queryKey: ['market-api', itemIds, locations, qualities, server],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Handle item IDs
      const itemIdString = Array.isArray(itemIds) ? itemIds.join(',') : itemIds;
      params.append('items', itemIdString);
      
      // Handle locations
      if (locations) {
        const locationString = Array.isArray(locations) ? locations.join(',') : locations;
        params.append('locations', locationString);
      }
      
      // Handle qualities
      if (qualities) {
        const qualityString = Array.isArray(qualities) 
          ? qualities.join(',') 
          : qualities.toString();
        params.append('qualities', qualityString);
      }
      
      // Add server
      params.append('server', server);
      
      const response = await fetch(`/api/market/prices?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch market prices');
      }
      
      return result.data as MarketPrice[];
    },
    enabled: enabled && !!itemIds,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook for fetching market history via API
 */
interface HistoryDataPoint {
  timestamp: string;
  avg_price: number;
  item_count: number;
}

interface MarketHistory {
  item_id: string;
  location: string;
  quality: number;
  data: HistoryDataPoint[];
}

interface UseMarketHistoryOptions {
  itemIds: string | string[];
  locations?: string | string[];
  qualities?: string | number[];
  date?: string;
  endDate?: string;
  timeScale?: 1 | 24;
  server?: Server;
  enabled?: boolean;
}

export function useMarketHistory({
  itemIds,
  locations,
  qualities,
  date,
  endDate,
  timeScale,
  server = 'Americas',
  enabled = true,
}: UseMarketHistoryOptions) {
  return useQuery({
    queryKey: ['market-history', itemIds, locations, qualities, date, endDate, timeScale, server],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Handle item IDs
      const itemIdString = Array.isArray(itemIds) ? itemIds.join(',') : itemIds;
      params.append('items', itemIdString);
      
      // Handle locations
      if (locations) {
        const locationString = Array.isArray(locations) ? locations.join(',') : locations;
        params.append('locations', locationString);
      }
      
      // Handle qualities
      if (qualities) {
        const qualityString = Array.isArray(qualities) 
          ? qualities.join(',') 
          : qualities.toString();
        params.append('qualities', qualityString);
      }
      
      // Optional parameters
      if (date) {params.append('date', date);}
      if (endDate) {params.append('endDate', endDate);}
      if (timeScale) {params.append('timeScale', timeScale.toString());}
      
      // Add server
      params.append('server', server);
      
      const response = await fetch(`/api/market/history?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch market history');
      }
      
      return result.data as MarketHistory[];
    },
    enabled: enabled && !!itemIds,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
