'use server';

import { type NextRequest, NextResponse } from 'next/server';

import { mlAnalyticsService } from '@/lib/services/ml-analytics.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params;

    if (!buildId) {
      return NextResponse.json(
        { success: false, error: 'Missing buildId parameter' },
        { status: 400 }
      );
    }

    const analysis = await mlAnalyticsService.analyzeBuildCounters(buildId);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('[API] Build Counter Analysis Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
