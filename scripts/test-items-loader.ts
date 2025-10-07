/**
 * Test Items Loader
 * Verifies that items.json loads correctly and shows proper localized names
 */

import { getItemByUniqueName, getLocalizedName } from '../src/lib/data/items-loader';

async function testItemsLoader() {
  console.log('🧪 Testing Items Loader...\n');

  // Test items that appear in PvP
  const testItems = [
    'T6_2H_DAGGERPAIR',
    'T6_ARMOR_CLOTH_SET3',
    'T4_2H_WARBOW',
    'T4_ARMOR_LEATHER_SET3',
    'T8_2H_HARPOON_HELL',
    'T5_ARMOR_CLOTH_AVALON',
    'T6_MAIN_SPEAR_KEEPER',
    'T6_ARMOR_PLATE_SET1',
  ];

  for (const uniqueName of testItems) {
    try {
      console.log(`\n📦 Testing: ${uniqueName}`);
      
      const item = await getItemByUniqueName(uniqueName);
      
      if (item) {
        const localizedName = getLocalizedName(item);
        console.log(`  ✅ Found: "${localizedName}"`);
        console.log(`  📊 Tier: ${item.Tier || 'N/A'}`);
        
        // Show all available locales
        if (item.LocalizedNames) {
          console.log(`  🌍 Available locales:`, Object.keys(item.LocalizedNames));
        }
      } else {
        console.log(`  ❌ Item not found in items.json`);
      }
    } catch (error) {
      console.error(`  ❌ Error:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!');
  console.log('='.repeat(60));
}

// Run the test
testItemsLoader()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
