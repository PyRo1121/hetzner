/**
 * Admin route: Snapshot PvP kill feed (minute-level)
 */
import { NextResponse } from 'next/server';

import { isAuthorized } from '@/app/api/admin/sync/_auth';
import { gameinfoClient } from '@/lib/api/gameinfo/client';
import { getSupabaseAdmin } from '@/backend/supabase/clients';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SERVERS: Array<'Americas' | 'Europe' | 'Asia'> = ['Americas', 'Europe', 'Asia'];

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const limit = 51;
  const results: Array<{ server: string; count: number }> = [];

  for (const server of SERVERS) {
    try {
      gameinfoClient.setServer(server);
      const kills = await gameinfoClient.getRecentKills(limit, 0);

      const { error } = await admin.from('pvp_kill_snapshots').insert({
        server,
        count: kills.length,
        payload: kills,
      });
      if (error) {
        throw error;
      }

      results.push({ server, count: kills.length });
    } catch (error: any) {
      console.error('[PvpKillSnapshots] Error:', error?.message ?? error);
    }
  }

  return NextResponse.json({ success: true, results });
}

export async function GET(request: Request) {
  return POST(request);
}
