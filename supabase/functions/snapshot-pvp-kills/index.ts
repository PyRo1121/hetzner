/**
 * Supabase Edge Function: Snapshot PvP Kills
 * Captures recent kill events and stores them as minute-level snapshots.
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CRON_SECRET = Deno.env.get('CRON_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GAMEINFO_BASE_URL =
  Deno.env.get('GAMEINFO_BASE_URL') ?? 'https://gameinfo.albiononline.com/api/gameinfo';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchKills(limit = 51, offset = 0): Promise<any[]> {
  const url = `${GAMEINFO_BASE_URL}/events?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Gameinfo events error: ${res.status}`);
  return await res.json();
}

async function fetchKillsPaginated(max = 300): Promise<any[]> {
  const pageSize = 51;
  const results: any[] = [];
  let offset = 0;
  while (results.length < max) {
    const batch = await fetchKills(pageSize, offset);
    if (!batch?.length) break;
    results.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
    await new Promise((r) => setTimeout(r, 200));
  }
  return results;
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const kills = await fetchKillsPaginated(300);
    const { error } = await supabase.from('pvp_kill_snapshots').insert({
      server: 'Global',
      captured_at: new Date().toISOString(),
      count: kills.length,
      payload: kills,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, count: kills.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[snapshot-pvp-kills] error', e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
