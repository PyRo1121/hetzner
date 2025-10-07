/**
 * PvP Search API Route
 * Proxies search requests to avoid CORS issues with validation
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

export const runtime = 'edge';

const QuerySchema = z.object({
  q: z.string().min(1, 'Query parameter required').max(100),
  server: z.enum(['Americas', 'Europe', 'Asia']).default('Americas'),
});

const BASE_URLS = {
  Americas: 'https://gameinfo.albiononline.com/api/gameinfo',
  Europe: 'https://gameinfo-ams.albiononline.com/api/gameinfo',
  Asia: 'https://gameinfo-sgp.albiononline.com/api/gameinfo',
} as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate input
    const params = QuerySchema.safeParse({
      q: searchParams.get('q') || '',
      server: searchParams.get('server') || 'Americas',
    });

    if (!params.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: params.error.issues,
      }, { status: 400 });
    }

    const { q: query, server } = params.data;

    // Proxy to Gameinfo API
    const baseUrl = BASE_URLS[server];
    const response = await fetch(
      `${baseUrl}/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gameinfo API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[API] Search Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search',
    }, {
      status: 500,
    });
  }
}
