/**
 * Market Hooks
 * React Query hooks for market data from Supabase
 * Uses singleton marketService + Realtime subscriptions
 */

import { useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { marketService } from '@/lib/services';
import { subscribeToMarketPrices, subscribeToGoldPrices } from '@/backend/realtime';

/**
 * Get current market prices with Realtime updates
 */
export function useMarketPrices(itemId?: string, city?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['market', 'prices', itemId, city],
    queryFn: () => marketService.getCurrentPrices(itemId, city),
    staleTime: 10 * 60 * 1000, // 10 minutes (Realtime handles updates)
  });

  // Subscribe to real-time market price updates
  useEffect(() => {
    const channel = subscribeToMarketPrices(() => {
      void queryClient.invalidateQueries({ queryKey: ['market', 'prices'] });
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient]);

  return query;
}

/**
 * Get gold prices with Realtime updates
 */
export function useGoldPrices(limit: number = 100) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['market', 'gold', limit],
    queryFn: () => marketService.getGoldPrices(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes (Realtime handles updates)
  });

  // Subscribe to real-time gold price updates
  useEffect(() => {
    const channel = subscribeToGoldPrices(() => {
      void queryClient.invalidateQueries({ queryKey: ['market', 'gold'] });
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient]);

  return query;
}

/**
 * Get latest gold price with Realtime updates
 */
export function useLatestGoldPrice() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['market', 'gold', 'latest'],
    queryFn: () => marketService.getLatestGoldPrice(),
    staleTime: 10 * 60 * 1000, // 10 minutes (Realtime handles updates)
  });

  // Subscribe to real-time gold price updates
  useEffect(() => {
    const channel = subscribeToGoldPrices(() => {
      void queryClient.invalidateQueries({ queryKey: ['market', 'gold', 'latest'] });
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient]);

  return query;
}

/**
 * Get price history
 */
export function usePriceHistory(itemId: string, city: string, days: number = 7) {
  return useQuery({
    queryKey: ['market', 'history', itemId, city, days],
    queryFn: () => marketService.getPriceHistory(itemId, city, days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!itemId && !!city,
  });
}
