/**
 * Items Hooks
 * React Query hooks for items data from Supabase
 * Uses singleton itemsService
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { itemsService, type Item } from '@/lib/services/items.service';

/**
 * Get all items
 */
export function useItems(): UseQueryResult<Item[], Error> {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => itemsService.getAll(),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Get item by ID
 */
export function useItem(id: string): UseQueryResult<Item | null, Error> {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => itemsService.getById(id),
    staleTime: 60 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Get multiple items by IDs
 */
export function useItemsByIds(ids: string[]): UseQueryResult<Map<string, Item>, Error> {
  return useQuery({
    queryKey: ['items', 'byIds', ...ids.sort()],
    queryFn: () => itemsService.getByIds(ids),
    staleTime: 60 * 60 * 1000,
    enabled: ids.length > 0,
  });
}

/**
 * Search items
 */
export function useItemSearch(query: string, limit?: number): UseQueryResult<Item[], Error> {
  return useQuery({
    queryKey: ['items', 'search', query, limit],
    queryFn: () => itemsService.search(query, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: query.length > 0,
  });
}

/**
 * Get items by category
 */
export function useItemsByCategory(category: string, tier?: number): UseQueryResult<Item[], Error> {
  return useQuery({
    queryKey: ['items', 'category', category, tier],
    queryFn: () => itemsService.getByCategory(category),
    staleTime: 60 * 60 * 1000,
  });
}
