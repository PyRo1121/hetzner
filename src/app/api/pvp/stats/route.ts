/**
 * PvP Stats API Route
 * Returns aggregate statistics from the database
 */

import { NextResponse } from 'next/server';

import { getCache, setCache } from '@/lib/cache/redis-cache.server';
import { supabase } from '@/backend/supabase/clients';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check Redis cache first
    const cacheKey = 'pvp-stats';
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get total kills (fast count)
    const { count: totalKills } = await supabase
      .from('kill_events')
      .select('*', { count: 'exact', head: true });

    // Get recent kills for calculations (limit for speed)
    const { data: recentKills } = await supabase
      .from('kill_events')
      .select('killerId, totalFame')
      .order('timestamp', { ascending: false })
      .limit(1000);

    // Calculate stats from recent data
    const uniquePlayers = new Set(recentKills?.map((k) => k.killerId) ?? []).size;
    const avgFame =
      recentKills && recentKills.length > 0
        ? Math.round(
            recentKills.reduce((sum, k) => sum + (k.totalFame ?? 0), 0) / recentKills.length
          )
        : 0;

    const response = {
      success: true,
      data: {
        totalKills: totalKills ?? 0,
        activePlayers: uniquePlayers,
        avgFame,
        metaBuilds: 50, // Approximate
      },
    };

    // Cache for 2 minutes
    await setCache(cacheKey, response, 120);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[API] Stats Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      },
      {
        status: 500,
      }
    );
  }
}
