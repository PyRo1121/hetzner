/**
 * Background Sync Initialization API Route
 * Starts automatic market and PVP data syncing
 */

import { NextResponse } from 'next/server';

import { initializeBackgroundSync, isBackgroundSyncRunning } from '@/lib/services/background-sync';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (isBackgroundSyncRunning()) {
      return NextResponse.json({
        success: true,
        message: 'Background sync already running',
        status: 'active',
      });
    }

    await initializeBackgroundSync();

    return NextResponse.json({
      success: true,
      message: 'Background sync initialized successfully',
      status: 'active',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Background sync init error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize background sync',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Background Sync Initialization',
    status: isBackgroundSyncRunning() ? 'active' : 'inactive',
    endpoint: 'POST /api/sync/init',
  });
}
