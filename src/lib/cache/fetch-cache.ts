/**
 * Advanced fetch caching with tags and revalidation
 * Leverages Next.js 15 caching APIs for optimal performance
 */

import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Cache tags for different data types
 */
export const CacheTags = {
  MARKET_PRICES: 'market-prices',
  GOLD_PRICES: 'gold-prices',
  PVP_KILLS: 'pvp-kills',
  PVP_BUILDS: 'pvp-builds',
  GUILDS: 'guilds',
  ITEMS: 'items',
  SERVER_STATUS: 'server-status',
} as const;

/**
 * Cache durations (in seconds)
 */
export const CacheDurations = {
  REALTIME: 30,        // 30 seconds - for live data
  SHORT: 60,           // 1 minute - for frequently changing data
  MEDIUM: 300,         // 5 minutes - for moderate data
  LONG: 3600,          // 1 hour - for stable data
  VERY_LONG: 86400,    // 24 hours - for static data
} as const;

/**
 * Tagged fetch wrapper with automatic caching
 */
export async function fetchWithCache<T>(
  url: string,
  options: {
    tags?: string[];
    revalidate?: number;
    cache?: RequestCache;
  } = {}
): Promise<T> {
  const { tags = [], revalidate, cache = 'force-cache' } = options;

  const response = await fetch(url, {
    ...options,
    cache,
    next: {
      tags,
      revalidate,
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Invalidate cache by tag
 */
export function invalidateCache(tag: string) {
  revalidateTag(tag);
}

/**
 * Invalidate cache by path
 */
export function invalidatePath(path: string) {
  revalidatePath(path);
}

/**
 * Invalidate multiple tags
 */
export function invalidateMultiple(tags: string[]) {
  tags.forEach(tag => revalidateTag(tag));
}

/**
 * Supabase query cache wrapper
 */
export function createCachedQuery<T>(
  queryFn: () => Promise<T>,
  _options: {
    key: string;
    revalidate?: number;
    tags?: string[];
  }
) {
  return async (): Promise<T> => {
    // In production, this would use React cache()
    // For now, just execute the query
    return queryFn();
  };
}

/**
 * Cache key generator
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}
