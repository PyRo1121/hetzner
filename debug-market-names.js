/**
 * Debug Market Localized Names
 * Check what's happening with market data and name fetching
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMarketNames() {
  console.log('🔍 Debugging Market Localized Names...\n');

  try {
    // Get some recent market data
    console.log('📊 Fetching recent market data...');
    const { data: marketData, error: marketError } = await supabase
      .from('market_prices')
      .select('itemId, city, quality, sellPriceMin, buyPriceMax, timestamp')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (marketError) {
      console.error('❌ Error fetching market data:', marketError);
      return;
    }

    console.log(`✅ Found ${marketData?.length || 0} market entries`);
    
    if (!marketData || marketData.length === 0) {
      console.log('❌ No market data found!');
      return;
    }

    // Get unique item IDs
    const uniqueItemIds = [...new Set(marketData.map(p => p.itemId))];
    console.log(`\n🔍 Unique item IDs in market data: ${uniqueItemIds.length}`);
    uniqueItemIds.forEach(id => console.log(`  - ${id}`));

    // Check if these items exist in ao_items
    console.log('\n🧪 Checking if market items exist in ao_items...');
    for (const itemId of uniqueItemIds.slice(0, 5)) { // Check first 5
      const { data: item, error } = await supabase
        .from('ao_items')
        .select('unique_name, localized_en')
        .eq('unique_name', itemId)
        .maybeSingle();

      if (error) {
        console.log(`  ❌ ${itemId}: Error - ${error.message}`);
      } else if (item) {
        console.log(`  ✅ ${itemId}: "${item.localized_en}"`);
      } else {
        console.log(`  ❌ ${itemId}: Not found in ao_items`);
      }
    }

    // Test the getItemNames function simulation
    console.log('\n🔧 Testing batch item lookup...');
    const { data: batchItems, error: batchError } = await supabase
      .from('ao_items')
      .select('unique_name, localized_en')
      .in('unique_name', uniqueItemIds.slice(0, 5));

    if (batchError) {
      console.error('❌ Batch lookup error:', batchError);
    } else {
      console.log(`✅ Batch lookup found ${batchItems?.length || 0} items:`);
      batchItems?.forEach(item => {
        console.log(`  - ${item.unique_name}: "${item.localized_en}"`);
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugMarketNames()
  .then(() => {
    console.log('\n✅ Debug complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });