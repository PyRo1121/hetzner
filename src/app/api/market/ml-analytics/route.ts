'use server';

import { NextResponse } from 'next/server';

import { mlAnalyticsService, type MarketFeatures } from '@/lib/services/ml-analytics.service';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { features?: MarketFeatures };

    if (!body.features) {
      return NextResponse.json(
        { success: false, error: 'Missing market feature payload.' },
        { status: 400 }
      );
    }

    const prediction = await mlAnalyticsService.predictMarketPrice(body.features);
    return NextResponse.json({ success: true, data: prediction });
  } catch (error) {
    console.error('[API] Market ML Analytics Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
