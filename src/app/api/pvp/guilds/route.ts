/**
 * Guild Leaderboards API Route
 * Server-side proxy to avoid CORS issues with validation
 */

import { NextResponse } from 'next/server';

import { z } from 'zod';

import type {
  GuildFameLeaderboardEntry,
  GuildLeaderboardEntry,
} from '@/lib/api/gameinfo/client';
import { guildService } from '@/lib/services';

type RangeType = 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  type: z.enum(['attacks', 'defenses', 'kill_fame']).default('attacks'),
  range: z.enum(['day', 'week', 'month', 'lastWeek', 'lastMonth']).default('week'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

interface LeaderboardRow {
  guildId: string;
  guildName: string;
  allianceId: string | null;
  allianceName: string | null;
  allianceTag: string | null;
  memberCount: number | null;
  killFame: number | null;
  deathFame: number | null;
  attacksWon: number | null;
  defensesWon: number | null;
  metricValue: number;
  metricLabel: string;
  rank: number;
}

function normalizeAttackDefense(
  type: 'attacks' | 'defenses',
  range: RangeType,
  limit: number,
  offset: number
): Promise<GuildLeaderboardEntry[]> {
  return guildService.getGuildAttackDefenseLeaderboard({
    type,
    range: mapRangeForAttackDefense(range),
    limit,
    offset,
  });
}

function mapRangeForAttackDefense(range: RangeType): 'day' | 'week' | 'month' {
  if (range === 'day') {
    return 'day';
  }
  if (range === 'month') {
    return 'month';
  }
  return 'week';
}

function mapAttackDefenseRows(
  entries: GuildLeaderboardEntry[],
  type: 'attacks' | 'defenses',
  defaultRankStart = 0
): LeaderboardRow[] {
  const metricLabel = type === 'attacks' ? 'Attacks Won' : 'Defenses Won';
  return entries.map((entry, index) => ({
    guildId: entry.Id,
    guildName: entry.Name,
    allianceId: entry.AllianceId ?? null,
    allianceName: entry.AllianceName ?? null,
    allianceTag: entry.AllianceTag ?? null,
    memberCount: entry.MemberCount ?? null,
    killFame: entry.KillFame ?? null,
    deathFame: entry.DeathFame ?? null,
    attacksWon: entry.AttacksWon ?? null,
    defensesWon: entry.DefensesWon ?? null,
    metricValue:
      type === 'attacks'
        ? Number(entry.AttacksWon ?? 0)
        : Number(entry.DefensesWon ?? 0),
    metricLabel,
    rank: defaultRankStart + index + 1,
  }));
}

function mapKillFameRows(entries: GuildFameLeaderboardEntry[], defaultRankStart = 0): LeaderboardRow[] {
  return entries.map((entry, index) => ({
    guildId: entry.GuildId,
    guildName: entry.GuildName,
    allianceId: entry.AllianceId ?? null,
    allianceName: entry.AllianceName ?? null,
    allianceTag: entry.AllianceTag ?? null,
    memberCount: null,
    killFame: entry.Total ?? null,
    deathFame: null,
    attacksWon: null,
    defensesWon: null,
    metricValue: Number(entry.Total ?? 0),
    metricLabel: 'Kill Fame',
    rank: entry.Rank ?? defaultRankStart + index + 1,
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate input
    const params = QuerySchema.safeParse({
      type: searchParams.get('type') ?? 'attacks',
      range: searchParams.get('range') ?? 'week',
      limit: searchParams.get('limit') ?? '50',
      offset: searchParams.get('offset') ?? '0',
    });

    if (!params.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: params.error.issues,
      }, { status: 400 });
    }

    const { type, range, limit, offset } = params.data;

    let data: LeaderboardRow[] = [];

    if (type === 'kill_fame') {
      const raw = await guildService.getGuildKillFameLeaderboard({ range, limit, offset });
      data = mapKillFameRows(raw, offset);
    } else {
      const raw = await normalizeAttackDefense(type, range, limit, offset);
      data = mapAttackDefenseRows(raw, type, offset);
    }

    return NextResponse.json({
      success: true,
      data,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[API] Guilds Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch guilds',
    }, {
      status: 500,
    });
  }
}
