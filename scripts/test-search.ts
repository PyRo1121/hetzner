import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testSearch() {
  console.log('=== Testing Market Price Search ===\n');
  
  // Test 1: Search by itemId (exact match)
  console.log('Test 1: Search by exact itemId');
  const { data: exactMatch, error: exactError } = await supabase
    .from('market_prices')
    .select('*')
    .eq('itemId', 'T4_BAG')
    .limit(3);
  
  if (exactError) {
    console.error('❌ Error:', exactError.message);
  } else {
    console.log(`✅ Found ${exactMatch?.length || 0} results for T4_BAG`);
    exactMatch?.forEach(item => {
      console.log(`   - ${item.itemId} in ${item.city} (Q${item.quality}): ${item.sellPriceMin} silver`);
    });
  }
  
  // Test 2: Search by itemId pattern (LIKE)
  console.log('\nTest 2: Search by itemId pattern (SWORD)');
  const { data: patternMatch, error: patternError } = await supabase
    .from('market_prices')
    .select('*')
    .ilike('itemId', '%SWORD%')
    .limit(5);
  
  if (patternError) {
    console.error('❌ Error:', patternError.message);
  } else {
    console.log(`✅ Found ${patternMatch?.length || 0} results matching SWORD`);
    patternMatch?.forEach(item => {
      console.log(`   - ${item.itemId} in ${item.city}`);
    });
  }
  
  // Test 3: Search by city
  console.log('\nTest 3: Search by city (Caerleon)');
  const { data: cityMatch, error: cityError, count } = await supabase
    .from('market_prices')
    .select('*', { count: 'exact' })
    .eq('city', 'Caerleon')
    .limit(5);
  
  if (cityError) {
    console.error('❌ Error:', cityError.message);
  } else {
    console.log(`✅ Found ${count} total results in Caerleon (showing 5)`);
    cityMatch?.forEach(item => {
      console.log(`   - ${item.itemId}: ${item.sellPriceMin} silver`);
    });
  }
  
  // Test 4: Combined filters (itemId + city + quality)
  console.log('\nTest 4: Combined filters (T5 items in Bridgewatch, Quality 1)');
  const { data: combinedMatch, error: combinedError } = await supabase
    .from('market_prices')
    .select('*')
    .ilike('itemId', 'T5%')
    .eq('city', 'Bridgewatch')
    .eq('quality', 1)
    .limit(5);
  
  if (combinedError) {
    console.error('❌ Error:', combinedError.message);
  } else {
    console.log(`✅ Found ${combinedMatch?.length || 0} results`);
    combinedMatch?.forEach(item => {
      console.log(`   - ${item.itemId}: ${item.sellPriceMin} silver`);
    });
  }
  
  console.log('\n=== Search Tests Complete ===');
}

testSearch().catch(console.error);
