/**
 * API Route: Database Statistics
 * Returns counts and metrics for monitoring data ingestion
 */

import { NextResponse } from 'next/server';

import { supabase } from '@/backend/supabase/clients';

export async function GET() {
  try {
    // Get counts from all tables
    const [marketPrices, priceHistory, goldPrices] = await Promise.all([
      supabase.from('market_prices').select('*', { count: 'exact', head: true }),
      supabase.from('price_history').select('*', { count: 'exact', head: true }),
      supabase.from('gold_prices').select('*', { count: 'exact', head: true }),
    ]);

    // Get latest timestamps
    const [latestMarket, latestHistory, latestGold] = await Promise.all([
      supabase.from('market_prices').select('timestamp').order('timestamp', { ascending: false }).limit(1).single(),
      supabase.from('price_history').select('timestamp').order('timestamp', { ascending: false }).limit(1).single(),
      supabase.from('gold_prices').select('timestamp').order('timestamp', { ascending: false }).limit(1).single(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        marketPrices: {
          count: marketPrices.count || 0,
          latest: latestMarket.data?.timestamp || null,
        },
        priceHistory: {
          count: priceHistory.count || 0,
          latest: latestHistory.data?.timestamp || null,
        },
        goldPrices: {
          count: goldPrices.count || 0,
          latest: latestGold.data?.timestamp || null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stats API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
