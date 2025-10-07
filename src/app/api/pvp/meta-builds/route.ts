/**
 * Meta Builds API Route
 * Returns top performing PvP builds based on recent kill data
 */

import { NextResponse } from 'next/server';

import { CACHE_TTL, getCache, setCache } from '@/lib/cache/redis-cache.server';
import { itemsService } from '@/lib/services';
import { supabase } from '@/backend/supabase/clients';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute timeout
export const revalidate = 300; // Cache for 5 minutes

const PAGE_SIZE = 1000;

type MetaBuildRow = {
  build_id: string;
  weapon_type: string | null;
  head_type: string | null;
  armor_type: string | null;
  shoes_type: string | null;
  cape_type: string | null;
  kills: number;
  deaths: number;
  total_fame: number;
  sample_size: number;
  win_rate: number;
  popularity: number;
  avg_fame: number;
  last_seen: string;
  is_healer: boolean;
};

// In-memory cache for item names keyed by base ID (prevents repeated DB queries)
// Clear cache on server restart to pick up new items
const itemNameBaseCache = new Map<string, string>();
const cacheTimestamp = { value: 0 };

// Unused legacy code removed - now using pre-aggregated meta_builds table

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minSampleSize = Number.parseInt(searchParams.get('minSample') ?? '3', 10); // Minimum 3 appearances

    // Check Redis cache first
    const cacheKey = `meta-builds:${minSampleSize}`;
    try {
      const cached = await getCache<{ success: boolean; data: unknown[] }>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch (cacheError) {
      console.warn('[Meta Builds] Cache read failed:', cacheError);
      // Continue without cache
    }

    // Fetch ALL pre-aggregated builds from database (updated in real-time by trigger)
    // No limit - realtime queries are instant!
    const builds: MetaBuildRow[] = [];
    let offset = 0;

    for (;;) {
      const { data, error } = await supabase
        .from('meta_builds')
        .select('*')
        .gte('sample_size', minSampleSize)
        .neq('weapon_type', 'NONE')
        .order('sample_size', { ascending: false })
        .order('kills', { ascending: false })
        .order('win_rate', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        throw error;
      }

      const rows = Array.isArray(data) ? (data as MetaBuildRow[]) : [];

      if (rows.length === 0) {
        break;
      }

      builds.push(...rows);

      if (rows.length < PAGE_SIZE) {
        break;
      }

      offset += PAGE_SIZE;
    }

    if (builds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const tiers = [8, 7, 6, 5, 4];

    const getBaseType = (type: string): string => type.replace(/^T\d+_/, '').replace(/@\d+$/, '');

    // Collect all unique base IDs for batch lookup
    const baseTypes = new Set<string>();
    const candidateUniqueIds = new Set<string>();

    const collectType = (type: string | null) => {
      if (!type || type === 'NONE') {
        return;
      }
      const base = getBaseType(type);
      baseTypes.add(base);
      if (/^T\d+_/.test(type)) {
        candidateUniqueIds.add(type);
      }
    };

    builds.forEach((b) => {
      collectType(b.weapon_type);
      collectType(b.head_type);
      collectType(b.armor_type);
      collectType(b.shoes_type);
      collectType(b.cape_type);
    });

    // Generate candidate unique IDs across tiers for each base type
    baseTypes.forEach((base) => {
      tiers.forEach((tier) => {
        candidateUniqueIds.add(`T${tier}_${base}`);
      });
    });

    // Helper to format item names as fallback
    const formatItemName = (id: string): string => {
      return id
        .replace(/^T\d+_/, '') // Remove tier
        .replace(/@\d+$/, '') // Remove enchantment
        .replace(/^MAIN_|^2H_|^OFF_/, '') // Remove weapon prefixes
        .replace(/^ARMOR_|^HEAD_|^SHOES_/, '') // Remove armor prefixes
        .replace(/^CAPEITEM_/, 'Cape ') // Replace cape prefix
        .replace(/^CAPE$/, 'Basic Cape') // Handle basic cape
        .replace(/_FW_/, ' ') // Remove faction warfare prefix
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize words
    };

    // Check cache freshness
    const now = Date.now();
    const cacheExpired = now - cacheTimestamp.value > CACHE_TTL.VOLATILE * 1000;

    // Only fetch items not in cache
    const itemsToFetch = cacheExpired
      ? [...candidateUniqueIds]
      : [...candidateUniqueIds].filter((id) => {
          const base = getBaseType(id);
          return !itemNameBaseCache.has(base);
        });

    // Batch fetch missing items
    if (itemsToFetch.length > 0) {
      console.warn(
        '[Meta Builds] Fetching items:',
        itemsToFetch.length,
        '(batched in groups of 100)'
      );

      try {
        const itemsMap = await itemsService.getByIds(itemsToFetch);
        console.warn('[Meta Builds] Items found:', itemsMap.size, 'of', itemsToFetch.length);

        const setBaseName = (uniqueId: string, localizedName: string) => {
          const base = getBaseType(uniqueId);
          if (!itemNameBaseCache.has(base)) {
            itemNameBaseCache.set(base, localizedName);
          }
        };

        // Update cache with found items
        itemsMap.forEach((item, id) => {
          const localizedName = itemsService.getLocalizedName(item);
          setBaseName(id, localizedName);
        });

        // For items not found, use formatted fallback immediately
        itemsToFetch.forEach((id) => {
          const base = getBaseType(id);
          if (!itemNameBaseCache.has(base)) {
            const formatted = formatItemName(base);
            itemNameBaseCache.set(base, formatted);
          }
        });

        if (cacheExpired) {
          cacheTimestamp.value = now;
        }
      } catch (itemsError) {
        console.error('[Meta Builds] Failed to fetch items:', itemsError);
        // Use formatted fallback for all items on error
        itemsToFetch.forEach((id) => {
          const base = getBaseType(id);
          if (!itemNameBaseCache.has(base)) {
            const formatted = formatItemName(base);
            itemNameBaseCache.set(base, formatted);
          }
        });
      }
    }

    // Combine cached + newly fetched
    const getItemName = (type: string | null): string => {
      if (!type) {
        return 'Unknown';
      }
      const base = getBaseType(type);
      const cached = itemNameBaseCache.get(base);
      if (!cached) {
        console.warn(`[Meta Builds] No localized name for base: ${base}`);
        return formatItemName(base);
      }
      return cached;
    };

    // Map builds with resolved names (using cache!)
    const buildStats = builds.map((b) => {
      // Helper to get item name with T4_ prefix for lookup
      const getNameForType = (type: string | null): string => {
        if (!type || type === 'NONE') {
          return 'None';
        }
        return getItemName(type);
      };

      return {
        buildId: b.build_id,
        // Use localized names instead of unique names
        weaponName: getNameForType(b.weapon_type),
        headName: getNameForType(b.head_type),
        armorName: getNameForType(b.armor_type),
        shoesName: getNameForType(b.shoes_type),
        capeName: getNameForType(b.cape_type),
        // Keep original IDs for reference
        weaponType: b.weapon_type,
        headType: b.head_type,
        armorType: b.armor_type,
        shoesType: b.shoes_type,
        capeType: b.cape_type,
        // Stats
        kills: b.kills,
        deaths: b.deaths,
        totalFame: Number(b.total_fame),
        winRate: Number(b.win_rate),
        popularity: Number(b.popularity),
        avgFame: Number(b.avg_fame),
        sampleSize: b.sample_size,
        lastSeen: b.last_seen,
        isHealer: Boolean(b.is_healer),
      };
    });

    const response = {
      success: true,
      data: buildStats,
    };

    // Cache the response in Redis for 5 minutes
    try {
      await setCache(cacheKey, response, CACHE_TTL.VOLATILE);
    } catch (cacheError) {
      console.warn('[Meta Builds] Cache write failed:', cacheError);
      // Continue without caching
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API] Meta Builds Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze meta builds',
      },
      {
        status: 500,
      }
    );
  }
}
