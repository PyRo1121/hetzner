/**
 * Supabase Edge Function: Sync Gold Prices
 * Runs hourly via cron to fetch latest gold prices from AODP
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AODP_GOLD_URL = 'https://www.albion-online-data.com/api/v2/stats/gold';

interface AODPGoldPrice {
  price: number;
  timestamp: string;
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

    console.log('Starting gold price sync...');

    // Fetch gold prices from AODP
    const response = await fetch(`${AODP_GOLD_URL}?count=1`);

    if (!response.ok) {
      throw new Error(`AODP API error: ${response.status}`);
    }

    const goldPrices: AODPGoldPrice[] = await response.json();

    if (goldPrices.length === 0) {
      throw new Error('No gold price data received');
    }

    const latestPrice = goldPrices[0];
    const server = 'Americas';
    const ts = new Date(latestPrice.timestamp);
    const id = `${server}:${ts.toISOString()}`;

    // Upsert into database with deterministic PK to avoid duplicates
    const { error } = await supabase.from('gold_prices').upsert(
      {
        id,
        price: Math.round(latestPrice.price),
        timestamp: ts,
        server,
        createdAt: new Date(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      throw error;
    }

    console.log(`Gold price synced: ${latestPrice.price}`);

    return new Response(
      JSON.stringify({
        success: true,
        price: latestPrice.price,
        timestamp: latestPrice.timestamp,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Gold sync error:', error);

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
