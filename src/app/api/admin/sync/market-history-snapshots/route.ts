/**
 * Admin route: Snapshot Market History (minute-level)
 */
import { NextResponse } from 'next/server';

import { isAuthorized } from '@/app/api/admin/sync/_auth';
import { aodpClient } from '@/lib/api/aodp/client';
import { getSupabaseAdmin } from '@/backend/supabase/clients';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SERVERS: Array<'Americas' | 'Europe' | 'Asia'> = ['Americas', 'Europe', 'Asia'];
const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];
const QUALITIES = ['1', '2', '3', '4', '5'];

// Smaller subset for history to reduce payload size
const DEFAULT_ITEMS_HISTORY = [
  'T4_SWORD',
  'T4_BOW',
  'T4_FIRESTAFF',
  'T4_HOLYSTAFF',
  'T4_NATURESTAFF',
  'T5_SWORD',
  'T5_BOW',
  'T5_FIRESTAFF',
  'T5_HOLYSTAFF',
  'T5_NATURESTAFF',
];

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const itemsParam = DEFAULT_ITEMS_HISTORY.join(',');
  const locationsParam = CITIES.join(',');
  const qualitiesParam = QUALITIES.join(',');
  const timeScale = 24 as const;

  const results: Array<{ server: string; count: number }> = [];

  for (const server of SERVERS) {
    try {
      aodpClient.setServer(server);
      const history = await aodpClient.getHistory(itemsParam, {
        locations: locationsParam,
        qualities: qualitiesParam,
        timeScale,
      });

      const { error } = await admin.from('market_history_snapshots').insert({
        server,
        items: itemsParam,
        locations: locationsParam,
        qualities: qualitiesParam,
        time_scale: timeScale,
        count: Array.isArray(history) ? history.length : 0,
        payload: history,
      });
      if (error) {
        throw error;
      }

      results.push({
        server,
        count: Array.isArray(history) ? history.length : 0,
      });
    } catch (error: any) {
      console.error('[MarketHistorySnapshots] Error:', error?.message ?? error);
    }
  }

  return NextResponse.json({ success: true, results });
}

export async function GET(request: Request) {
  return POST(request);
}
