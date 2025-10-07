/**
 * Populate ao_items table with data from ao-bin-dumps
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('[Items] Creating ao_items table if not exists...');
  
  // Create table
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ao_items (
        unique_name TEXT PRIMARY KEY,
        localized_en TEXT NOT NULL,
        tier INTEGER DEFAULT 0,
        category TEXT,
        subcategory TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_ao_items_category ON ao_items(category);
      CREATE INDEX IF NOT EXISTS idx_ao_items_tier ON ao_items(tier);
    `
  });
  
  if (createError) {
    console.warn('[Items] Table might already exist:', createError.message);
  }
  
  console.log('[Items] Fetching items from ao-bin-dumps...');
  
  // Fetch items.json from GitHub
  const response = await fetch('https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json');
  const items = await response.json();
  
  console.log(`[Items] Found ${items.length} items`);
  
  // Clear existing data
  console.log('[Items] Clearing existing ao_items table...');
  const { error: deleteError } = await supabase
    .from('ao_items')
    .delete()
    .neq('unique_name', ''); // Delete all rows
  
  if (deleteError) {
    console.error('[Items] Error clearing table:', deleteError);
  }
  
  // Transform and insert data in batches
  const batchSize = 500;
  let inserted = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const rows = batch.map((item: any) => ({
      unique_name: item.UniqueName,
      localized_en: item.LocalizedNames?.['EN-US'] || item.UniqueName,
      tier: item.Tier || 0,
      category: item.CategoryId || 'unknown',
      subcategory: item.SubCategoryId || null,
    }));
    
    const { error } = await supabase
      .from('ao_items')
      .insert(rows);
    
    if (error) {
      console.error(`[Items] Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      inserted += rows.length;
      console.log(`[Items] Progress: ${inserted}/${items.length} (${Math.round(inserted / items.length * 100)}%)`);
    }
  }
  
  console.log(`[Items] ✅ Successfully populated ${inserted} items!`);
}

main().catch(console.error);
