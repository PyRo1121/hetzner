/**
 * PVP Hooks
 * React Query hooks for PVP data from Supabase
 * Uses singleton pvpService + Realtime subscriptions
 */

import { useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getGuildStats } from '@/lib/api/gameinfo/guilds';
import { pvpService } from '@/lib/services';
import { subscribeToBattles, subscribeToPvPKills } from '@/backend/realtime';

/**
 * Get recent kills with Realtime updates
 */
export function useRecentKills(limit: number = 50, offset: number = 0) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pvp', 'kills', limit, offset],
    queryFn: () => pvpService.getKillFeed({ limit, offset }),
    staleTime: 5 * 60 * 1000, // 5 minutes (Realtime handles updates)
  });

  // Subscribe to real-time kill events
  useEffect(() => {
    const channel = subscribeToPvPKills(() => {
      // Invalidate query to refetch with new data
      void queryClient.invalidateQueries({ queryKey: ['pvp', 'kills'] });
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient]);

  return query;
}

/**
 * Get recent battles with Realtime updates
 */
export function useRecentBattles(limit: number = 20) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pvp', 'battles', limit],
    queryFn: () => pvpService.getRecentBattles({ limit }),
    staleTime: 5 * 60 * 1000, // 5 minutes (Realtime handles updates)
  });

  // Subscribe to real-time battle updates
  useEffect(() => {
    const channel = subscribeToBattles(() => {
      void queryClient.invalidateQueries({ queryKey: ['pvp', 'battles'] });
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient]);

  return query;
}

/**
 * Get battle by ID
 */
export function useBattle(battleId: number) {
  return useQuery({
    queryKey: ['pvp', 'battle', battleId],
    queryFn: () => pvpService.getBattleById(battleId),
    staleTime: 5 * 60 * 1000,
    enabled: !!battleId,
  });
}

/**
 * Get player stats
 */
export function usePlayerStats(playerId: string) {
  return useQuery({
    queryKey: ['pvp', 'player', playerId],
    // Align with available PvPService methods: fetch player details
    queryFn: () => pvpService.getPlayerDetails(playerId),
    staleTime: 5 * 60 * 1000,
    enabled: !!playerId,
  });
}

/**
 * Get guild stats
 */
export function useGuildStats(guildId: string) {
  return useQuery({
    queryKey: ['pvp', 'guild', guildId],
    // Use gameinfo API helper for guild statistics
    queryFn: () => getGuildStats(guildId),
    staleTime: 5 * 60 * 1000,
    enabled: !!guildId,
  });
}

/**
 * Get meta builds (updated via kill events)
 */
export function useMetaBuilds(limit: number = 20) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pvp', 'meta-builds', limit],
    // Fetch from API route that serves pre-aggregated meta builds
    queryFn: async () => {
      const res = await fetch('/api/pvp/meta-builds?minSample=5');
      if (!res.ok) {
        throw new Error(`Failed to fetch meta builds: ${res.status}`);
      }
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Invalidate when new kills come in (meta builds are derived from kills)
  useEffect(() => {
    const channel = subscribeToPvPKills(() => {
      void queryClient.invalidateQueries({ queryKey: ['pvp', 'meta-builds'] });
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient]);

  return query;
}
