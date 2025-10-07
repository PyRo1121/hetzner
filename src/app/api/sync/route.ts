/**
 * API Route: Manual Data Sync Trigger
 * Allows manual triggering of data sync
 */

import { NextResponse } from 'next/server';

import { triggerSync } from '@/lib/services/data-sync';

export async function POST() {
  try {
    await triggerSync();
    
    return NextResponse.json({
      success: true,
      message: 'Data sync triggered successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Data Sync API',
    status: 'active',
    endpoint: 'POST /api/sync',
  });
}
