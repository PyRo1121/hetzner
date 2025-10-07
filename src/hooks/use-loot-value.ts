/**
 * Loot Value Hook
 * On-demand loot estimation when user views kill details
 */

import { useQuery } from '@tanstack/react-query';

interface InventoryItem {
  Type?: string | null;
  Count?: number | null;
}

interface LootEstimation {
  totalSilver: number;
  entries: Array<{
    uniqueName: string;
    count: number;
    estimatedUnitValue: number;
    estimatedTotalValue: number;
  }>;
}

/**
 * Estimate loot value for an inventory
 * Only fetches when enabled (e.g., when modal is open)
 */
export function useLootValue(inventory: InventoryItem[] | null | undefined, enabled: boolean = false) {
  return useQuery({
    queryKey: ['loot-value', inventory],
    queryFn: async () => {
      if (!inventory || inventory.length === 0) {
        return { totalSilver: 0, entries: [] };
      }

      const response = await fetch('/api/pvp/loot-value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventory }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to estimate loot value');
      }

      return result.data as LootEstimation;
    },
    enabled: enabled && !!inventory && inventory.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes (prices don't change that often)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
