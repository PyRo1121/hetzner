import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkMarketPrices() {
  console.log('=== Checking market_prices table ===\n');
  
  // Check if table exists and count rows
  const { data, error, count } = await supabase
    .from('market_prices')
    .select('*', { count: 'exact' })
    .limit(5);
  
  if (error) {
    console.error('❌ Error accessing market_prices table:', error.message);
    console.log('\nThe table probably doesn\'t exist or has permission issues.');
    return;
  }
  
  console.log(`✅ Table exists with ${count} rows\n`);
  
  if (count === 0) {
    console.log('⚠️  Table is empty. No market data synced yet.');
    return;
  }
  
  console.log('Sample market prices:');
  console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'N/A');
  console.log('\nFirst 5 records:');
  data?.forEach((price, i) => {
    console.log(`\n${i + 1}. Item: ${price.item_id || price.itemId}`);
    console.log(`   City: ${price.city}`);
    console.log(`   Quality: ${price.quality}`);
    console.log(`   Sell Price: ${price.sell_price_min || price.sellPriceMin}`);
    console.log(`   Buy Price: ${price.buy_price_max || price.buyPriceMax}`);
  });
  
  // Test search functionality
  console.log('\n=== Testing Search Functionality ===\n');
  
  // Test 1: Search by item_id pattern
  const { data: searchData, error: searchError } = await supabase
    .from('market_prices')
    .select('*')
    .ilike('item_id', '%SWORD%')
    .limit(3);
  
  if (searchError) {
    console.error('❌ Search error:', searchError.message);
  } else {
    console.log(`✅ Found ${searchData?.length || 0} items matching 'SWORD'`);
    searchData?.forEach(item => {
      console.log(`   - ${item.item_id || item.itemId}`);
    });
  }
}

checkMarketPrices().catch(console.error);
