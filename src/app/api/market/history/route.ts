/**
 * Market History API Route
 * Server-side proxy for AODP historical data with validation
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import { aodpClient } from '@/lib/api/aodp/client';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  items: z.string().min(1, 'Item IDs required'),
  locations: z.string().optional(),
  qualities: z.string().optional(),
  date: z.string().optional(),
  endDate: z.string().optional(),
  timeScale: z.enum(['1', '24']).optional(),
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
      date: searchParams.get('date') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      timeScale: searchParams.get('timeScale') || undefined,
      server: searchParams.get('server') || 'Americas',
    });

    if (!params.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: params.error.issues,
      }, { status: 400 });
    }

    const { items, locations, qualities, date, endDate, timeScale, server } = params.data;

    // Set server
    aodpClient.setServer(server);

    // Fetch history
    const history = await aodpClient.getHistory(items, {
      locations,
      qualities,
      date,
      endDate,
      timeScale: timeScale ? parseInt(timeScale) as 1 | 24 : undefined,
    });

    return NextResponse.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API] Market History Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market history',
    }, {
      status: 500,
    });
  }
}
