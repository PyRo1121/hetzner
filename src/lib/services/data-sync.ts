/**
 * Automatic Data Sync Service
 * Runs in the background to keep database updated with latest prices
 * Pulls items from ao-bin-dumps items.json automatically
 */

import { backend } from '@/backend';

const AODP_BASE_URL = 'https://www.albion-online-data.com/api/v2/stats';
const ITEMS_JSON_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master/formatted/items.json';
const SYNC_INTERVAL = 60 * 60 * 1000; // 1 hour

let syncInterval: NodeJS.Timeout | null = null;
let trackedItems: string[] = [];

/**
 * Fetch popular items from ao-bin-dumps
 */
async function fetchPopularItems(): Promise<string[]> {
  try {
    const response = await fetch(ITEMS_JSON_URL);
    const itemsArray = await response.json();
    
    // Extract UniqueName from each item
    const allItems = itemsArray.map((item: any) => item.UniqueName);
    
    // Get T4-T8 items (most traded)
    const popular = allItems.filter((id: string) => {
      const match = id.match(/^T([4-8])_/);
      if (!match) {return false;}
      
      // Include popular categories
      return id.includes('BAG') || 
             id.includes('SWORD') || 
             id.includes('AXE') ||
             id.includes('HAMMER') ||
             id.includes('BOW') ||
             id.includes('CROSSBOW') ||
             id.includes('ARMOR') ||
             id.includes('SHOES') ||
             id.includes('HEAD');
    });
    
    console.log(`[DataSync] Tracking ${popular.length} items from ao-bin-dumps`);
    return popular.slice(0, 100); // Limit to 100 most common items
  } catch (error) {
    console.error('[DataSync] Error fetching items:', error);
    return [];
  }
}

/**
 * Sync latest prices from AODP
 */
async function syncPrices() {
  if (trackedItems.length === 0) {
    console.log('[DataSync] No items to track yet, fetching...');
    trackedItems = await fetchPopularItems();
    if (trackedItems.length === 0) {return;}
  }

  try {
    const supabase = backend.admin;

    const cities = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];
    
    // Fetch prices in chunks to avoid URL length limits
    const CHUNK_SIZE = 20;
    let totalSynced = 0;

    for (let i = 0; i < trackedItems.length; i += CHUNK_SIZE) {
      const chunk = trackedItems.slice(i, i + CHUNK_SIZE);
      const itemIds = chunk.join(',');
      const locations = cities.join(',');
      
      const url = `${AODP_BASE_URL}/prices/${itemIds}?locations=${locations}&qualities=1,2,3,4,5`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[DataSync] AODP API error: ${response.status}`);
        continue;
      }

      const prices = await response.json();
      
      // Transform and insert
      const records = prices.map((price: any) => ({
        id: crypto.randomUUID(),
        itemId: price.item_id,
        itemName: price.item_id,
        city: price.city,
        quality: price.quality,
        sellPriceMin: price.sell_price_min,
        sellPriceMax: price.sell_price_max,
        buyPriceMin: price.buy_price_min,
        buyPriceMax: price.buy_price_max,
        timestamp: new Date(price.sell_price_min_date).toISOString(),
        server: 'Americas',
        createdAt: new Date().toISOString(),
      }));

      if (records.length > 0) {
        const { error } = await supabase
          .from('market_prices')
          .insert(records);

        if (!error) {
          totalSynced += records.length;
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[DataSync] Synced ${totalSynced} price records`);
  } catch (error) {
    console.error('[DataSync] Sync error:', error);
  }
}

/**
 * Start automatic sync service
 */
export function startDataSync() {
  if (syncInterval) {
    console.log('[DataSync] Already running');
    return;
  }

  console.log('[DataSync] Starting automatic data sync...');
  
  // Initial sync
  syncPrices();
  
  // Schedule hourly syncs
  syncInterval = setInterval(syncPrices, SYNC_INTERVAL);
  
  console.log('[DataSync] Service started - syncing every hour');
}

/**
 * Stop automatic sync service
 */
export function stopDataSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[DataSync] Service stopped');
  }
}

/**
 * Manually trigger a sync
 */
export async function triggerSync() {
  console.log('[DataSync] Manual sync triggered');
  await syncPrices();
}
