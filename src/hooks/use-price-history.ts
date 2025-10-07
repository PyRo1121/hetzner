/**
 * React Query hook for fetching price history
 */

import { useQuery } from '@tanstack/react-query';

import { aodpClient } from '@/lib/api';
import type { Server } from '@/types';

interface UsePriceHistoryOptions {
  itemIds: string;
  date?: string;
  endDate?: string;
  locations?: string;
  qualities?: string;
  timeScale?: 1 | 24;
  server?: Server;
  enabled?: boolean;
}

export function usePriceHistory({
  itemIds,
  date,
  endDate,
  locations,
  qualities,
  timeScale,
  server = 'Americas',
  enabled = true,
}: UsePriceHistoryOptions) {
  return useQuery({
    queryKey: ['price-history', itemIds, date, endDate, locations, qualities, timeScale, server],
    queryFn: async () => {
      aodpClient.setServer(server);
      return aodpClient.getHistory(itemIds, {
        date,
        endDate,
        locations,
        qualities,
        timeScale,
      });
    },
    enabled: enabled && !!itemIds,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
