/**
 * PvP Data Hook
 * Automatically fetches and refreshes PvP data at regular intervals
 */

import { useState, useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { gameinfoClient } from '../api/gameinfo/client';
import { subscribeToPvPKills } from '../supabase/realtime';

interface PvPData {
  recentKills: unknown[];
  topPlayers: unknown[];
  topGuilds: unknown[];
  loading: boolean;
  error: string | null;
}

interface PlayerData {
  kills: unknown[];
  deaths: unknown[];
  player: Record<string, unknown> | null;
}

export function usePvPData(): PvPData {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['pvp-dashboard-data'],
    queryFn: async () => {
      const [killsRes, playersRes, guildsRes] = await Promise.all([
        fetch('/api/pvp/kills?limit=10'),
        fetch('/api/pvp/players?limit=10'),
        fetch('/api/pvp/guilds?limit=10'),
      ]);

      const [kills, players, guilds] = await Promise.all([
        killsRes.json(),
        playersRes.json(),
        guildsRes.json(),
      ]);

      return {
        recentKills: kills.data ?? [],
        topPlayers: players.data ?? [],
        topGuilds: guilds.data ?? [],
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (Realtime handles updates)
  });

  // Subscribe to real-time kill updates
  useEffect(() => {
    const channel = subscribeToPvPKills(() => {
      void queryClient.invalidateQueries({ queryKey: ['pvp-dashboard-data'] });
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient]);

  return {
    recentKills: data?.recentKills ?? [],
    topPlayers: data?.topPlayers ?? [],
    topGuilds: data?.topGuilds ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * Hook for continuous kill feed updates
 */
export function useKillFeed() {
  return usePvPData();
}

/**
 * Hook for player-specific data
 */
export function usePlayerData(playerId: string) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayerData() {
      try {
        setIsLoading(true);
        
        const [kills, deaths, player] = await Promise.all([
          gameinfoClient.getPlayerKills(playerId, { limit: 20 }),
          gameinfoClient.getPlayerDeaths(playerId, { limit: 20 }),
          gameinfoClient.getPlayer(playerId),
        ]);

        setData({
          kills: kills ?? [],
          deaths: deaths ?? [],
          player: player ?? null,
        });
      } catch (error) {
        console.error('Failed to fetch player data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (playerId) {
      void fetchPlayerData();
    }
  }, [playerId]);

  return { data, isLoading };
}
