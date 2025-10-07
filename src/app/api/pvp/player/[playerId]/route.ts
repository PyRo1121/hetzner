/**
 * Player Data API Route
 * Server-side endpoint for fetching player-specific PvP data with validation
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getGameinfoClient } from '@/backend/api/gameinfo';

export const runtime = 'edge';
export const revalidate = 300; // Revalidate every 5 minutes

const ParamsSchema = z.object({
  playerId: z.string().min(1, 'Player ID required'),
});

const QuerySchema = z.object({
  server: z.enum(['Americas', 'Europe', 'Asia']).default('Americas'),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ playerId: string }> }
) {
  try {
    const rawParams = await context.params;
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.safeParse({ server: searchParams.get('server') ?? 'Americas' });
    
    // Validate input
    const params = ParamsSchema.safeParse(rawParams);

    if (!params.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: params.error.issues,
      }, { status: 400 });
    }

    const { playerId } = params.data;
    const server = query.success ? query.data.server : 'Americas';
    const gi = getGameinfoClient(server);

    // Fetch player data
    const [player, kills, deaths] = await Promise.all([
      gi.getPlayer(playerId),
      gi.getPlayerKills(playerId, { limit: 20 }),
      gi.getPlayerDeaths(playerId, { limit: 20 }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        player,
        kills,
        deaths,
        stats: {
          totalKills: kills.length,
          totalDeaths: deaths.length,
          kdRatio: deaths.length > 0 ? kills.length / deaths.length : kills.length,
        },
      },
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Source-Server': server,
      },
    });
  } catch (error) {
    console.error('[API] Player Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch player data',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
}
