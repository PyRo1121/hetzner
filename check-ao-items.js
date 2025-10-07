/**
 * Check ao_items table in Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAoItems() {
  console.log('🔍 Checking ao_items table...\n');

  try {
    // Check if table exists and get count
    const { count, error: countError } = await supabase
      .from('ao_items')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error accessing ao_items table:', countError);
      return;
    }

    console.log(`📊 Total items in ao_items table: ${count}`);

    // Get a few sample items
    const { data: sampleItems, error: sampleError } = await supabase
      .from('ao_items')
      .select('unique_name, localized_en, tier, category')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error fetching sample items:', sampleError);
      return;
    }

    console.log('\n📦 Sample items:');
    sampleItems?.forEach(item => {
      console.log(`  - ${item.unique_name}: "${item.localized_en}" (T${item.tier}, ${item.category})`);
    });

    // Test specific market items
    const testItems = ['T4_BAG', 'T5_POTION_HEAL', 'T6_2H_SWORD'];
    console.log('\n🧪 Testing specific items:');
    
    for (const itemId of testItems) {
      const { data: item, error } = await supabase
        .from('ao_items')
        .select('unique_name, localized_en')
        .eq('unique_name', itemId)
        .single();

      if (error) {
        console.log(`  ❌ ${itemId}: Not found (${error.message})`);
      } else {
        console.log(`  ✅ ${itemId}: "${item.localized_en}"`);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkAoItems()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });