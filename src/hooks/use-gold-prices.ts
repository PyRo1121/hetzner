/**
 * useGoldPrices Hook
 * Fetches gold prices from Supabase
 */

import { useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { marketService } from '@/lib/services';
import { subscribeToGoldPrices } from '@/backend/realtime';

export interface GoldPrice {
  id: string;
  price: number;
  timestamp: string;
  server: string;
}

export function useGoldPrices(_options?: { limit?: number }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['gold-prices'],
    queryFn: async () => {
      const prices = await marketService.getGoldPrices();

      // Transform to match expected format
      const data = prices.map((p: { id: string; price: number; timestamp: string; server?: string }) => ({
        id: p.id,
        price: p.price,
        timestamp: p.timestamp,
        server: p.server ?? 'Americas',
      }));

      return data as GoldPrice[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (Realtime handles updates)
  });

  // Subscribe to real-time gold price updates
  useEffect(() => {
    const channel = subscribeToGoldPrices(() => {
      void queryClient.invalidateQueries({ queryKey: ['gold-prices'] });
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient]);

  return query;
}
