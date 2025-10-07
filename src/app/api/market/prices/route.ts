/**
 * Market Prices API Route
 * Server-side proxy for AODP market data with validation
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import { aodpClient } from '@/lib/api/aodp/client';

// Cache for 60 seconds, revalidate in background
export const revalidate = 60;
export const runtime = 'edge'; // Use edge runtime for faster response

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
      items: searchParams.get('items') || '',
      locations: searchParams.get('locations') || undefined,
      qualities: searchParams.get('qualities') || undefined,
      server: searchParams.get('server') || 'Americas',
    });

    if (!params.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: params.error.issues,
      }, { status: 400 });
    }

    const { items, locations, qualities, server } = params.data;

    // Set server
    aodpClient.setServer(server);

    // Fetch prices
    const prices = await aodpClient.getPrices(items, {
      locations,
      qualities,
    });

    return NextResponse.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300, max-age=30',
        'CDN-Cache-Control': 'public, s-maxage=120',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=120',
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
