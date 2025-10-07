/**
 * PvP Battle Details API Route
 * Fetches detailed battle information including all kill events
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getGameinfoClient } from '@/backend/api/gameinfo';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  server: z.enum(['Americas', 'Europe', 'Asia']).default('Americas'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const { battleId: battleIdParam } = await params;
    const battleId = parseInt(battleIdParam);

    if (isNaN(battleId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid battle ID',
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = QuerySchema.safeParse({ server: searchParams.get('server') ?? 'Americas' });
    const server = query.success ? query.data.server : 'Americas';
    const gi = getGameinfoClient(server);

    // Fetch battle details and events in parallel
    const [battle, events] = await Promise.all([
      gi.getBattle(battleId),
      gi.getBattleEvents(battleId, { limit: 51, offset: 0 }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...battle,
        events,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Source-Server': server,
      },
    });
  } catch (error) {
    console.error('[API] Battle details error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch battle details',
      },
      { status: 500 }
    );
  }
}
