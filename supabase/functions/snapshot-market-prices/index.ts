/**
 * Supabase Edge Function: Snapshot Market Prices
 * Captures curated market prices across all servers and stores JSON payloads.
 * Scheduled via pg_cron with net.http_post; secured by CRON_SECRET.
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CRON_SECRET = Deno.env.get('CRON_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SERVERS = [
  { name: 'Americas', host: 'https://west.albion-online-data.com' },
  { name: 'Europe', host: 'https://europe.albion-online-data.com' },
  { name: 'Asia', host: 'https://east.albion-online-data.com' },
];

const TRACKED_ITEMS = [
  'T4_BAG', 'T5_BAG', 'T6_BAG', 'T7_BAG', 'T8_BAG',
  'T4_2H_SWORD', 'T5_2H_SWORD', 'T6_2H_SWORD', 'T7_2H_SWORD', 'T8_2H_SWORD',
  'T4_ARMOR_PLATE_SET1', 'T5_ARMOR_PLATE_SET1', 'T6_ARMOR_PLATE_SET1',
];
const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];
const QUALITIES = ['1','2','3','4','5'];

async function fetchPrices(baseHost: string, itemIds: string[], locations: string[]): Promise<any[]> {
  const itemsParam = itemIds.join(',');
  const locationsParam = locations.join(',');
  const url = `${baseHost}/api/v2/stats/prices/${itemsParam}?locations=${locationsParam}&qualities=${QUALITIES.join(',')}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`AODP prices error ${res.status}`);
  return await res.json();
}

async function snapshotServer(serverName: string, host: string): Promise<{count:number}> {
  const chunkSize = 50; // keep URL length < 4096
  const allPayload: any[] = [];
  for (let i = 0; i < TRACKED_ITEMS.length; i += chunkSize) {
    const chunk = TRACKED_ITEMS.slice(i, i + chunkSize);
    const data = await fetchPrices(host, chunk, CITIES);
    allPayload.push(...data);
    // polite small delay to avoid burst
    await new Promise((r) => setTimeout(r, 200));
  }

  const { error } = await supabase
    .from('market_price_snapshots')
    .insert({
      server: serverName,
      captured_at: new Date().toISOString(),
      count: allPayload.length,
      payload: allPayload,
      created_at: new Date().toISOString(),
    });
  if (error) throw error;
  return { count: allPayload.length };
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    let total = 0;
    for (const s of SERVERS) {
      const { count } = await snapshotServer(s.name, s.host);
      total += count;
    }

    return new Response(JSON.stringify({ success: true, total }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[snapshot-market-prices] error', e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});