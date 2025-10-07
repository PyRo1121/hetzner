/**
 * Test endpoint to verify Supabase Storage upload works
 */

import { NextResponse } from 'next/server';

import { getItemImageUrl } from '@/lib/storage/item-images';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.ADMIN_SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.warn('[Test Upload] Testing single image upload...');

    // Test with a common item (with tier)
    const testItemId = 'T8_2H_KNUCKLES_SET1';
    console.warn('[Test Upload] Testing item:', testItemId);
    const url = await getItemImageUrl(testItemId, 1, 0, 64);

    if (url) {
      console.warn('[Test Upload] Success! Image URL:', url);
      return NextResponse.json({
        success: true,
        message: 'Image uploaded successfully',
        url,
        testItem: testItemId,
      });
    } else {
      console.error('[Test Upload] Failed to get image URL');
      return NextResponse.json({
        success: false,
        error: 'Failed to upload test image',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Test Upload] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test upload failed',
      details: error instanceof Error ? error.stack : undefined,
    }, {
      status: 500,
    });
  }
}
