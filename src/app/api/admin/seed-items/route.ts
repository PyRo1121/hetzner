import { NextResponse } from 'next/server';

import { getSupabaseAdmin } from '@/backend/supabase/clients';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    
    console.log('[Seed Items] Fetching from ao-bin-dumps...');
    
    const response = await fetch(
      'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master/formatted/items.json'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : Object.values(data);

    console.log(`[Seed Items] Processing ${items.length} items...`);

    // Filter and map to DB format
    const rows = items
      .filter((item: any) => item?.UniqueName && item?.LocalizedNames?.['EN-US'])
      .map((item: any) => ({
        unique_name: item.UniqueName,
        localized_en: item.LocalizedNames['EN-US'],
        tier: item.Tier || null,
        category: item.Category || null,
        subcategory: item.Subcategory || null,
        updated_at: new Date().toISOString(),
      }));

    console.log(`[Seed Items] Upserting ${rows.length} valid items...`);

    // Batch upsert in chunks of 500
    const chunkSize = 500;
    let processed = 0;

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      
      const { error } = await supabase.from('ao_items').upsert(chunk, {
        onConflict: 'unique_name',
      });

      if (error) {
        console.error('[Seed Items] Upsert error:', error);
        throw error;
      }

      processed += chunk.length;
      console.log(`[Seed Items] Processed ${processed}/${rows.length}...`);
    }

    console.log(`[Seed Items] ✅ Complete! Seeded ${processed} items.`);

    return NextResponse.json({
      success: true,
      processed,
      message: `Successfully seeded ${processed} items`,
    });
  } catch (error) {
    console.error('[Seed Items] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
