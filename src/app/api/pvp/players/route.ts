/**
 * PvP Player Leaderboard API Route
 * Returns top players by kills, fame, or K/D ratio
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getCache, setCache } from '@/lib/cache/redis-cache.server';
import { supabase } from '@/backend/supabase/clients';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  sortBy: z.enum(['kills', 'fame', 'kd']).default('kills'),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const params = QuerySchema.safeParse({
      sortBy: searchParams.get('sortBy') ?? 'kills',
      limit: searchParams.get('limit') ?? '50',
    });

    if (!params.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          details: params.error.issues,
        },
        { status: 400 }
      );
    }

    const { sortBy, limit } = params.data;

    // Check Redis cache
    const cacheKey = `pvp-players:${sortBy}:${limit}`;
    try {
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch (cacheError) {
      console.warn('[Players] Cache read failed:', cacheError);
    }

    // Aggregate player stats from kill_events
    const { data: playerStats, error } = await supabase.rpc('get_player_leaderboard', {
      sort_by: sortBy,
      max_results: limit,
    });

    if (error) {
      console.error('[Players] RPC error:', error);
      throw error;
    }

    const response = {
      success: true,
      data: playerStats ?? [],
    };

    // Cache for 2 minutes
    try {
      await setCache(cacheKey, response, 120);
    } catch (cacheError) {
      console.warn('[Players] Cache write failed:', cacheError);
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
      },
    });
  } catch (error) {
    console.error('[API] Players Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch player leaderboard',
      },
      {
        status: 500,
      }
    );
  }
}
