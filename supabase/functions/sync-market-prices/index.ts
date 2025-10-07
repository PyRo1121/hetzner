/**
 * Supabase Edge Function: Sync Market Prices
 * Runs hourly via cron to fetch latest prices from AODP
 * Handles batch inserts with conflict resolution
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AODP_BASE_URL = 'https://www.albion-online-data.com/api/v2/stats';

// Popular items to track (can be expanded)
const TRACKED_ITEMS = [
  'T4_BAG',
  'T5_BAG',
  'T6_BAG',
  'T7_BAG',
  'T8_BAG',
  'T4_2H_SWORD',
  'T5_2H_SWORD',
  'T6_2H_SWORD',
  'T7_2H_SWORD',
  'T8_2H_SWORD',
  'T4_ARMOR_PLATE_SET1',
  'T5_ARMOR_PLATE_SET1',
  'T6_ARMOR_PLATE_SET1',
];

const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];

interface AODPPrice {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

serve(async (req) => {
  try {
    // Verify cron secret via X-Cron-Secret or allow Authorization Bearer JWT
    const cronSecret = Deno.env.get('CRON_SECRET');
    const headerSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('authorization');
    const hasJwt = authHeader?.startsWith('Bearer ');
    if (cronSecret && headerSecret !== cronSecret && !hasJwt) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting market price sync...');

    const itemIds = TRACKED_ITEMS.join(',');
    const locations = CITIES.join(',');

    // Fetch prices from AODP
    const url = `${AODP_BASE_URL}/prices/${itemIds}?locations=${locations}&qualities=1,2,3,4,5`;

    console.log(`Fetching from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`AODP API error: ${response.status}`);
    }

    const prices: AODPPrice[] = await response.json();

    console.log(`Fetched ${prices.length} price entries`);

    // Transform and prepare for insert (include deterministic PK)
    const records = prices.map((price) => {
      const ts = new Date(price.sell_price_min_date);
      const id = `${price.item_id}|${price.city}|${price.quality}|${ts.toISOString()}`;
      return {
        id,
        itemId: price.item_id,
        itemName: price.item_id, // Will be enriched later with localized names
        city: price.city,
        quality: Number(price.quality) || 0,
        sellPriceMin: Number(price.sell_price_min) || 0,
        sellPriceMax: Number(price.sell_price_max) || 0,
        buyPriceMin: Number(price.buy_price_min) || 0,
        buyPriceMax: Number(price.buy_price_max) || 0,
        timestamp: ts,
        server: 'Americas', // Can be parameterized
        createdAt: new Date(),
      };
    });

    // Filter out zero-only records to prevent DB bloat
    const filtered = records.filter((r) => {
      const spmin = Number(r.sellPriceMin) || 0;
      const spmax = Number(r.sellPriceMax) || 0;
      const bpmin = Number(r.buyPriceMin) || 0;
      const bpmax = Number(r.buyPriceMax) || 0;
      return spmin > 0 || spmax > 0 || bpmin > 0 || bpmax > 0;
    });

    const skipped = records.length - filtered.length;
    if (skipped > 0) {
      console.log(`Skipped ${skipped} zero-only price records`);
    }

    // Batch insert with conflict resolution (upsert)
    // Using chunks to avoid payload size limits
    const CHUNK_SIZE = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < filtered.length; i += CHUNK_SIZE) {
      const chunk = filtered.slice(i, i + CHUNK_SIZE);

      const { data, error } = await supabase
        .from('market_prices')
        .upsert(chunk, { onConflict: 'id' });

      if (error) {
        console.error(`Error inserting chunk ${i / CHUNK_SIZE + 1}:`, error);
        errors += chunk.length;
      } else {
        inserted += chunk.length;
      }
    }

    console.log(`Sync complete: ${inserted} inserted, ${errors} errors, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        errors,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Sync error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
