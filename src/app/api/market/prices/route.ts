/**
 * Market Prices API Route
 * Server-side proxy for AODP market data with validation
 * PRODUCTION: Cache-first architecture with Redis
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import { aodpClient } from '@/lib/api/aodp/client';
import { CACHE_CONFIG } from '@/lib/config/production';
import { cacheService } from '@/lib/redis/client';


// Cache for 60 seconds, revalidate in background
export const revalidate = 60;
export const runtime = 'nodejs'; // Changed from edge to support Redis

const QuerySchema = z.object({
  items: z.string().min(1, 'Item IDs required'),
  locations: z.string().optional(),
  qualities: z.string().optional(),
  server: z.enum(['Americas', 'Asia', 'Europe']).default('Americas'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate input
    const params = QuerySchema.safeParse({
      items: searchParams.get('items') ?? '',
      locations: searchParams.get('locations') ?? undefined,
      qualities: searchParams.get('qualities') ?? undefined,
      server: searchParams.get('server') ?? 'Americas',
    });

    if (!params.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: params.error.issues,
      }, { status: 400 });
    }

    const { items, locations, qualities, server } = params.data;

    // Create cache key
    const cacheKey = `market:prices:${server}:${items}:${locations ?? 'all'}:${qualities ?? 'all'}`;

    // PRODUCTION: Check Redis cache first
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        timestamp: new Date().toISOString(),
        cached: true,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300, max-age=30',
          'X-Cache': 'HIT',
        },
      });
    }

    // Set server
    aodpClient.setServer(server);

    // Fetch prices from external API
    const prices = await aodpClient.getPrices(items, {
      locations,
      qualities,
    });

    // Store in Redis cache
    await cacheService.set(cacheKey, prices, CACHE_CONFIG.marketTTL);

    return NextResponse.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
      cached: false,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300, max-age=30',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('[API] Market Prices Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market prices',
    }, {
      status: 500,
    });
  }
}
