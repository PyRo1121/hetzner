import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  console.log('=== Checking ao_items table ===\n');
  
  // Check if table exists and count rows
  const { data, error, count } = await supabase
    .from('ao_items')
    .select('unique_name, localized_en', { count: 'exact' })
    .limit(5);
  
  if (error) {
    console.error('❌ Error accessing ao_items table:', error.message);
    console.log('\nThe table probably doesn\'t exist. Run populate-items.ts to create and populate it.');
    return;
  }
  
  console.log(`✅ Table exists with ${count} rows\n`);
  
  if (count === 0) {
    console.log('⚠️  Table is empty. Run populate-items.ts to populate it.');
    return;
  }
  
  console.log('Sample items:');
  data?.forEach(item => {
    console.log(`  ${item.unique_name} → ${item.localized_en}`);
  });
  
  // Test specific items that meta builds is looking for
  console.log('\n=== Testing meta build items ===\n');
  const testIds = ['2H_AXE_AVALON', 'MAIN_1HCROSSBOW', 'HEAD_LEATHER_SET3', 'ARMOR_CLOTH_SET2'];
  
  for (const id of testIds) {
    // Try exact match first
    const { data: exact } = await supabase
      .from('ao_items')
      .select('unique_name, localized_en')
      .eq('unique_name', id)
      .maybeSingle();
    
    if (exact) {
      console.log(`✅ ${id} → ${exact.localized_en}`);
    } else {
      // Try with tier prefix (search for items containing the ID)
      const { data: withTier } = await supabase
        .from('ao_items')
        .select('unique_name, localized_en')
        .like('unique_name', `%${id}%`)
        .limit(3);
      
      if (withTier && withTier.length > 0) {
        console.log(`⚠️  ${id}: Not found exactly, but found with tiers:`);
        withTier.forEach(item => {
          console.log(`   ${item.unique_name} → ${item.localized_en}`);
        });
      } else {
        console.log(`❌ ${id}: Not found in database at all`);
      }
    }
  }
}

check().catch(console.error);
