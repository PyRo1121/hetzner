/**
 * Optimistic Updates Hook for Meta Builds
 * Uses TanStack Query v5 simplified optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MetaBuild {
  build_id: string;
  weapon_type: string | null;
  win_rate: number;
  kills: number;
  deaths: number;
}

export function useOptimisticBuilds() {
  const queryClient = useQueryClient();

  const updateBuild = useMutation({
    mutationFn: async (newBuild: MetaBuild) => {
      const response = await fetch('/api/pvp/meta-builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBuild),
      });
      return response.json();
    },
    onMutate: async (newBuild) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['meta-builds'] });

      // Snapshot previous value
      const previousBuilds = queryClient.getQueryData(['meta-builds']);

      // Optimistically update
      queryClient.setQueryData(['meta-builds'], (old: MetaBuild[] = []) => {
        return [...old, newBuild];
      });

      // Return context with snapshot
      return { previousBuilds };
    },
    onError: (_err, _newBuild, context) => {
      // Rollback on error
      if (context?.previousBuilds) {
        queryClient.setQueryData(['meta-builds'], context.previousBuilds);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      void queryClient.invalidateQueries({ queryKey: ['meta-builds'] });
    },
  });

  return { updateBuild };
}
