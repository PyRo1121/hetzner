import { backend } from '@/backend';

import { retryWithBackoff, CircuitBreaker } from '@/lib/utils/retry';

const ITEMS_SOURCE_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master/formatted/items.json';
const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];
const CHUNK_SIZE = 100; // Reduced from 230 to prevent 414 errors
const RATE_LIMIT_DELAY_MS = 2000; // Increased to 2s to prevent connection issues
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout

// Circuit breaker for external API
const apiCircuitBreaker = new CircuitBreaker(5, 60000);

type SyncSummary = {
  totalItems: number;
  batchesProcessed: number;
  recordsInserted: number;
  skipped: number;
  errors: number;
};

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTradeableItems(): Promise<string[]> {
  const response = await fetch(ITEMS_SOURCE_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch items: ${response.status}`);
  }

  const items = await response.json();

  return (Array.isArray(items) ? items : [])
    .filter((item: any) => {
      const id = item?.UniqueName as string | undefined;
      if (!id) {return false;}

      return (
        /^T[4-8]_/.test(id) &&
        !id.includes('_BABY') &&
        !id.includes('_JOURNAL') &&
        !id.includes('_TREASURE') &&
        !id.includes('_RANDOM') &&
        !id.includes('_QUESTITEM') &&
        !id.includes('_TUTORIAL')
      );
    })
    .map((item: any) => item.UniqueName);
}

export async function syncMarketPrices(): Promise<SyncSummary> {
  const supabase = backend.admin;

  const summary: SyncSummary = {
    totalItems: 0,
    batchesProcessed: 0,
    recordsInserted: 0,
    skipped: 0,
    errors: 0,
  };

  const items = await fetchTradeableItems();
  summary.totalItems = items.length;

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const batch = items.slice(i, i + CHUNK_SIZE);
    const itemIds = batch.join(',');

    try {
      // Use circuit breaker and retry logic
      const prices = await apiCircuitBreaker.execute(async () => {
        return await retryWithBackoff(
          async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            
            try {
              const response = await fetch(
                `https://www.albion-online-data.com/api/v2/stats/prices/${itemIds}?locations=${CITIES.join(',')}`,
                {
                  signal: controller.signal,
                  headers: {
                    'User-Agent': 'AlbionDashboard/1.0',
                    'Accept': 'application/json',
                  },
                }
              );
              
              clearTimeout(timeoutId);

              if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
              }

              return await response.json();
            } catch (error) {
              clearTimeout(timeoutId);
              throw error;
            }
          },
          {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 5000,
            onRetry: (attempt, error) => {
              console.warn(`[MarketSync] Retry ${attempt}/3 for batch ${i}-${i + CHUNK_SIZE}:`, error.message);
            },
          }
        );
      });

      if (Array.isArray(prices) && prices.length > 0) {
        const { error } = await supabase.from('market_prices').insert(
          prices.map(price => ({
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
          }))
        );

        if (error) {
          summary.errors++;
        } else {
          summary.recordsInserted += prices.length;
        }
      } else {
        summary.skipped++;
      }
    } catch (error) {
      console.error('[MarketSync] Batch error:', error);
      summary.errors++;
    }

    summary.batchesProcessed++;
    await delay(RATE_LIMIT_DELAY_MS);
  }

  return summary;
}
