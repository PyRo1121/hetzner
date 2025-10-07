/**
 * API Route: Real-Time Sync Control
 * Start/stop real-time NATS sync service
 */

import { NextResponse } from 'next/server';

import { startRealtimeSync, stopRealtimeSync, isRealtimeSyncRunning } from '@/lib/services/realtime-sync';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action === 'start') {
      if (isRealtimeSyncRunning()) {
        return NextResponse.json({
          success: true,
          message: 'Real-time sync already running',
          status: 'running',
        });
      }
      
      await startRealtimeSync();
      
      return NextResponse.json({
        success: true,
        message: 'Real-time sync started',
        status: 'running',
      });
    }
    
    if (action === 'stop') {
      await stopRealtimeSync();
      
      return NextResponse.json({
        success: true,
        message: 'Real-time sync stopped',
        status: 'stopped',
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "start" or "stop"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Realtime API error:', error);
    
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
    service: 'Real-Time Sync API',
    status: isRealtimeSyncRunning() ? 'running' : 'stopped',
    endpoints: {
      start: 'POST /api/realtime { "action": "start" }',
      stop: 'POST /api/realtime { "action": "stop" }',
    },
  });
}
