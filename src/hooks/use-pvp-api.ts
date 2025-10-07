/**
 * React Query hooks for PvP APIs
 * Includes kills, player search, guild search, and player details
 */

import { useQuery } from '@tanstack/react-query';

// Types
interface Player {
  Id: string;
  Name: string;
  GuildId?: string;
  GuildName?: string;
  AllianceId?: string;
  AllianceName?: string;
  KillFame?: number;
  DeathFame?: number;
  FameRatio?: number;
}

interface Guild {
  Id: string;
  Name: string;
  AllianceId?: string;
  AllianceName?: string;
  AllianceTag?: string;
  MemberCount?: number;
}

interface KillEvent {
  EventId: number;
  TimeStamp: string;
  Killer: Player;
  Victim: Player;
  TotalVictimKillFame: number;
  Location?: string;
  Participants?: Player[];
  GroupMemberCount?: number;
}

interface GuildStats {
  Id: string;
  Name: string;
  AllianceName?: string;
  KillFame: number;
  DeathFame: number;
  AttacksWon?: number;
  DefensesWon?: number;
}

/**
 * Hook for fetching recent PvP kills
 */
interface UseRecentKillsOptions {
  limit?: number;
  offset?: number;
  enabled?: boolean;
  server?: 'Americas' | 'Europe' | 'Asia';
}

export function useRecentKills({
  limit = 51,
  offset = 0,
  enabled = true,
  server = 'Americas',
}: UseRecentKillsOptions = {}) {
  return useQuery({
    queryKey: ['pvp-kills', limit, offset, server],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      params.append('server', server);
      
      const response = await fetch(`/api/pvp/kills?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch kills');
      }
      
      return result.data as KillEvent[];
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for searching players and guilds
 */
interface UseSearchOptions {
  query: string;
  enabled?: boolean;
  server?: 'Americas' | 'Europe' | 'Asia';
}

export function useSearch({ query, enabled = true, server = 'Americas' }: UseSearchOptions) {
  return useQuery({
    queryKey: ['pvp-search', query, server],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('server', server);
      const response = await fetch(`/api/pvp/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search');
      }
      
      return result.data as {
        players?: Player[];
        guilds?: Guild[];
      };
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching player details
 */
interface UsePlayerDetailsOptions {
  playerId: string;
  enabled?: boolean;
  server?: 'Americas' | 'Europe' | 'Asia';
}

export function usePlayerDetails({ playerId, enabled = true, server = 'Americas' }: UsePlayerDetailsOptions) {
  return useQuery({
    queryKey: ['player-details', playerId, server],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('server', server);
      const response = await fetch(`/api/pvp/player/${playerId}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch player details');
      }
      
      return result.data as {
        player: Player;
        kills: KillEvent[];
        deaths: KillEvent[];
        stats: {
          totalKills: number;
          totalDeaths: number;
          kdRatio: number;
        };
      };
    },
    enabled: enabled && !!playerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching guild leaderboards
 */
interface UseGuildLeaderboardOptions {
  type?: 'attacks' | 'defenses';
  range?: 'week' | 'month' | 'lastWeek' | 'lastMonth';
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useGuildLeaderboard({
  type = 'attacks',
  range = 'week',
  limit = 50,
  offset = 0,
  enabled = true,
}: UseGuildLeaderboardOptions = {}) {
  return useQuery({
    queryKey: ['guild-leaderboard', type, range, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('type', type);
      params.append('range', range);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const response = await fetch(`/api/pvp/guilds?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch guild leaderboard');
      }
      
      return result.data as GuildStats[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Export types
export type { Player, Guild, KillEvent, GuildStats };
