/**
 * Admin route: Snapshot Market Prices (minute-level)
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

// Curated small set to keep payload sizes reasonable per minute
const DEFAULT_ITEMS = [
  'T4_BAG',
  'T4_CAPE',
  'T4_SWORD',
  'T4_BOW',
  'T4_FIRESTAFF',
  'T4_HOLYSTAFF',
  'T4_NATURESTAFF',
  'T5_BAG',
  'T5_CAPE',
  'T5_SWORD',
  'T5_BOW',
  'T5_FIRESTAFF',
  'T5_HOLYSTAFF',
  'T5_NATURESTAFF',
  'T6_BAG',
  'T6_CAPE',
  'T6_SWORD',
  'T6_BOW',
  'T6_FIRESTAFF',
  'T6_HOLYSTAFF',
  'T6_NATURESTAFF',
];

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const itemsParam = DEFAULT_ITEMS.join(',');
  const locationsParam = CITIES.join(',');
  const qualitiesParam = QUALITIES.join(',');

  const results: Array<{ server: string; count: number }> = [];

  for (const server of SERVERS) {
    try {
      aodpClient.setServer(server);
      const prices = await aodpClient.getPrices(itemsParam, {
        locations: locationsParam,
        qualities: qualitiesParam,
      });

      const { error } = await admin.from('market_price_snapshots').insert({
        server,
        items: itemsParam,
        locations: locationsParam,
        qualities: qualitiesParam,
        count: prices.length,
        payload: prices,
      });
      if (error) {
        throw error;
      }

      results.push({ server, count: prices.length });
    } catch (error: any) {
      console.error('[MarketPricesSnapshots] Error:', error?.message ?? error);
    }
  }

  return NextResponse.json({ success: true, results });
}

export async function GET(request: Request) {
  return POST(request);
}
