/**
 * Admin sync route to snapshot guild leaderboards every minute
 */
import { NextResponse } from 'next/server';

import type { GuildFameLeaderboardEntry, GuildLeaderboardEntry } from '@/lib/api/gameinfo/client';
import { guildService } from '@/lib/services';
import { getSupabaseAdmin } from '@/backend/supabase/clients';

type RangeType = 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';
type LeaderboardType = 'attacks' | 'defenses' | 'kill_fame';

const TYPES: LeaderboardType[] = ['attacks', 'defenses', 'kill_fame'];
const RANGES: RangeType[] = ['day', 'week', 'month', 'lastWeek', 'lastMonth'];

function mapAttackDefenseRows(entries: GuildLeaderboardEntry[], type: 'attacks' | 'defenses') {
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
      type === 'attacks' ? Number(entry.AttacksWon ?? 0) : Number(entry.DefensesWon ?? 0),
    metricLabel,
    rank: entry.Rank ?? index + 1,
  }));
}

function mapKillFameRows(entries: GuildFameLeaderboardEntry[]) {
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
    rank: entry.Rank ?? index + 1,
  }));
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-sync-secret');
  if (!secret || secret !== process.env.ADMIN_SYNC_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const results: Array<{ type: LeaderboardType; range: RangeType; count: number }> = [];

  for (const type of TYPES) {
    for (const range of RANGES) {
      try {
        if (type === 'kill_fame') {
          const data = await guildService.getGuildKillFameLeaderboard({
            range,
            limit: 50,
            offset: 0,
          });
          const rows = mapKillFameRows(data);
          const { error } = await admin
            .from('guild_leaderboard_snapshots')
            .insert({ type, range, server: 'global', top_count: rows.length, payload: rows });
          if (error) {
            throw error;
          }
          results.push({ type, range, count: rows.length });
        } else {
          const data = await guildService.getGuildAttackDefenseLeaderboard({
            type,
            range: range === 'day' || range === 'month' ? range : 'week',
            limit: 50,
            offset: 0,
          });
          const rows = mapAttackDefenseRows(data, type);
          const { error } = await admin
            .from('guild_leaderboard_snapshots')
            .insert({ type, range, server: 'global', top_count: rows.length, payload: rows });
          if (error) {
            throw error;
          }
          results.push({ type, range, count: rows.length });
        }
      } catch (error: any) {
        console.error(`Sync error for ${type}/${range}:`, error?.message ?? error);
      }
    }
  }

  return NextResponse.json({ success: true, results });
}

export async function GET(request: Request) {
  // Allow manual triggering via GET if authorized
  return POST(request);
}

export const dynamic = 'force-dynamic';
