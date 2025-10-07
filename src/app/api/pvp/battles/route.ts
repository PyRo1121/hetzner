/**
 * PVP Battles API Route
 * Fetches battle data from Supabase
 */

import { NextResponse } from 'next/server';

import { getCache, setCache } from '@/lib/cache/redis-cache.server';
import { pvpService } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') ?? '20', 10);

    // Check Redis cache first
    const cacheKey = `pvp-battles:${limit}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch battles using service with typed options
    const data = await pvpService.getRecentBattles({ limit });

    const response = {
      success: true,
      data,
    };

    // Cache for 1 minute
    await setCache(cacheKey, response, 60);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[API] Battles Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch battles',
      },
      { status: 500 }
    );
  }
}
