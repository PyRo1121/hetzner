/**
 * Guild Leaderboards Hook with SWR caching
 */

import useSWR from 'swr';

export type GuildLeaderboardType = 'attacks' | 'defenses' | 'kill_fame';
export type GuildLeaderboardRange = 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';

export interface GuildLeaderboardRow {
  guildId: string;
  guildName: string;
  allianceId: string | null;
  allianceName: string | null;
  allianceTag: string | null;
  memberCount: number | null;
  killFame: number | null;
  deathFame: number | null;
  attacksWon: number | null;
  defensesWon: number | null;
  metricValue: number;
  metricLabel: string;
  rank: number;
}

export interface UseGuildLeaderboardsOptions {
  type?: GuildLeaderboardType;
  range?: GuildLeaderboardRange;
  limit?: number;
  offset?: number;
}

interface GuildLeaderboardResponse {
  success: boolean;
  data: GuildLeaderboardRow[];
  error?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch guild leaderboards');
  }
  const body = (await res.json()) as GuildLeaderboardResponse;
  if (!body.success) {
    throw new Error(body.error ?? 'API error');
  }
  return body.data;
};

export function useGuildLeaderboards(options: UseGuildLeaderboardsOptions = {}) {
  const {
    type = 'attacks',
    range = 'week',
    limit = 50,
    offset = 0,
  } = options;

  const url = `/api/pvp/guilds?type=${type}&range=${range}&limit=${limit}&offset=${offset}`;

  const { data, error, isLoading, mutate } = useSWR<GuildLeaderboardRow[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 300000, // 5 minutes
      fallbackData: [],
    }
  );

  return {
    guilds: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
