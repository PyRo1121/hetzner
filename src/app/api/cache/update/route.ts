/**
 * Cache Update API Route
 * Manually trigger cache updates for testing
 */

import { NextResponse } from 'next/server';

import { cacheUpdaterService } from '@/lib/services/cache-updater.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST() {
  try {
    console.log('[Cache Update] Starting cache update...');
    
    await cacheUpdaterService.updateAllCaches();
    
    return NextResponse.json({
      success: true,
      message: 'Cache updated successfully',
    });
  } catch (error) {
    console.error('[Cache Update] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update cache',
    }, {
      status: 500,
    });
  }
}
