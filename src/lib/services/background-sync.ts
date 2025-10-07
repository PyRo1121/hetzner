/**
 * Background Sync Initialization Service
 * Automatically starts market and PVP data syncing on app startup
 * Follows API rate limits: 1 call per second, 230 items at a time
 */

import { syncMarketPrices } from './market-sync';
import { syncPvpData } from './pvp-sync';

let isInitialized = false;
let marketSyncInterval: NodeJS.Timeout | null = null;
let pvpSyncInterval: NodeJS.Timeout | null = null;

// Sync intervals
const MARKET_SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes
const PVP_SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutes

/**
 * Initialize background sync services
 * Should be called once on app startup
 */
export async function initializeBackgroundSync() {
  if (isInitialized) {
    return;
  }

  // Run initial syncs
  try {
    // Running initial market sync
    await syncMarketPrices();
  } catch (error) {
    console.error('[BackgroundSync] Initial market sync failed:', error);
  }

  try {
    // Running initial PVP sync
    await syncPvpData(50);
  } catch (error) {
    console.error('[BackgroundSync] Initial PVP sync failed:', error);
  }

  // Schedule recurring syncs
  marketSyncInterval = setInterval(() => {
    void (async () => {
      try {
        await syncMarketPrices();
      } catch (error) {
        console.error('[BackgroundSync] Scheduled market sync failed:', error);
      }
    })();
  }, MARKET_SYNC_INTERVAL);

  pvpSyncInterval = setInterval(() => {
    void (async () => {
      try {
        await syncPvpData(50);
      } catch (error) {
        console.error('[BackgroundSync] Scheduled PVP sync failed:', error);
      }
    })();
  }, PVP_SYNC_INTERVAL);

  isInitialized = true;
}

/**
 * Stop all background sync services
 */
export function stopBackgroundSync() {
  if (marketSyncInterval) {
    clearInterval(marketSyncInterval);
    marketSyncInterval = null;
  }

  if (pvpSyncInterval) {
    clearInterval(pvpSyncInterval);
    pvpSyncInterval = null;
  }

  isInitialized = false;
}

/**
 * Check if background sync is running
 */
export function isBackgroundSyncRunning(): boolean {
  return isInitialized;
}

/**
 * Manually trigger all syncs
 */
export async function triggerManualSync() {
  // Manual sync triggered
  
  const results = await Promise.allSettled([
    syncMarketPrices(),
    syncPvpData(50),
  ]);

  return {
    market: results[0].status === 'fulfilled' ? results[0].value : null,
    pvp: results[1].status === 'fulfilled' ? results[1].value : null,
    errors: results.filter(r => r.status === 'rejected').map(r => (r).reason),
  };
}
