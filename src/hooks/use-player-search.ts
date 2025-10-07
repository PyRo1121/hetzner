/**
 * React Query hook for searching players and guilds
 */

import { useQuery } from '@tanstack/react-query';

import { gameinfoClient } from '@/lib/api';
import type { Server } from '@/types';

interface UsePlayerSearchOptions {
  query: string;
  server?: Server;
  enabled?: boolean;
}

export function usePlayerSearch({
  query,
  server = 'Americas',
  enabled = true,
}: UsePlayerSearchOptions) {
  return useQuery({
    queryKey: ['player-search', query, server],
    queryFn: async () => {
      gameinfoClient.setServer(server);
      return gameinfoClient.search(query);
    },
    enabled: enabled && query.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
