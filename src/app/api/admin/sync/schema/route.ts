import { NextResponse } from 'next/server';

import { isAuthorized } from '@/app/api/admin/sync/_auth';
import { runSchemaMigration } from '@/lib/services/schema-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runSchemaMigration();

    return NextResponse.json({
      success: result.errors.length === 0,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SchemaSync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
