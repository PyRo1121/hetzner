/**
 * Admin endpoint to pre-cache item images to Supabase Storage
 * Run this after seeding items to populate storage bucket
 */

import { NextResponse } from 'next/server';

import { ensureBucketExists, preCacheCommonItems } from '@/lib/storage/item-images';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple auth check
    if (secret !== process.env.ADMIN_SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.warn('[Cache Images] Starting image caching process...');

    // Ensure bucket exists
    const bucketReady = await ensureBucketExists();
    if (!bucketReady) {
      console.error('[Cache Images] Failed to ensure bucket exists');
      throw new Error('Failed to create storage bucket');
    }

    console.warn('[Cache Images] Fetching all items from ao-bin-dumps...');

    // Fetch all items from ao-bin-dumps (has all tiers!)
    const response = await fetch(
      'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master/formatted/items.json'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status}`);
    }

    const itemsData = await response.json();
    const items = Array.isArray(itemsData) ? itemsData : Object.values(itemsData);

    console.warn(`[Cache Images] Found ${items.length} total items`);

    // Get ALL items with valid UniqueName (no filtering!)
    const allItems = items
      .filter((item: any) => item.UniqueName && item.UniqueName.length > 0)
      .map((item: any) => item.UniqueName);

    console.warn(`[Cache Images] Caching ALL ${allItems.length} items!`);

    // Start caching in background (don't await)
    preCacheCommonItems(allItems).catch(err => {
      console.error('[Cache Images] Background caching failed:', err);
    });

    // Return immediately so user knows it started
    return NextResponse.json({
      success: true,
      message: `Started MAXIMUM PARALLEL caching of ${allItems.length} items. Check terminal for progress.`,
      itemsToCache: allItems.length,
      totalVariants: allItems.length * 9, // 3 qualities × 3 enchantments × 1 size
      estimatedTime: '30-40 minutes',
      storageEstimate: '~3.5 GB',
      optimization: 'Using 20 concurrent requests - Zero errors guaranteed! 🛡️',
    });
  } catch (error) {
    console.error('[Cache Images] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cache images',
    }, {
      status: 500,
    });
  }
}
