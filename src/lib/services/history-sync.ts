import { backend } from '@/backend';

import { validateGoldPrices } from '@/lib/data/outlier-detection';

type HistorySyncSummary = {
  itemsProcessed: number;
  priceRecordsInserted: number;
  priceErrors: number;
  goldRecordsInserted: number;
  goldRecordsRejected: number;
  goldErrors: number;
};

const ITEMS_SOURCE_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master/formatted/items.json';
const HISTORY_BASE_URL = 'https://www.albion-online-data.com/api/v2/stats/history';
const GOLD_HISTORY_URL = 'https://www.albion-online-data.com/api/v2/stats/gold';
const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];
const QUALITIES = [1, 2, 3, 4, 5];
const ITEM_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 5000;
const MAX_RETRIES = 3;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTrackedItems(): Promise<string[]> {
  const response = await fetch(ITEMS_SOURCE_URL);

  if (!response.ok) {
    throw new Error(`[HistorySync] Failed to fetch items: ${response.status}`);
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

async function fetchItemHistory(
  itemId: string,
  timeScale = 24,
  retries = MAX_RETRIES
): Promise<any[]> {
  const url = `${HISTORY_BASE_URL}/${itemId}?locations=${CITIES.join(',')}&qualities=${QUALITIES.join(',')}&time-scale=${timeScale}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url);

    if (response.status === 429) {
      await delay(attempt * RATE_LIMIT_DELAY_MS);
      continue;
    }

    if (!response.ok) {
      if (attempt === retries) {
        throw new Error(`[HistorySync] Failed to fetch history ${itemId}: ${response.status}`);
      }
      await delay(ITEM_DELAY_MS);
      continue;
    }

    return response.json();
  }

  return [];
}

async function fetchGoldHistory(count = 720): Promise<any[]> {
  const response = await fetch(`${GOLD_HISTORY_URL}?count=${count}`);

  if (!response.ok) {
    throw new Error(`[HistorySync] Failed to fetch gold history: ${response.status}`);
  }

  return response.json();
}

export async function backfillHistoricalData(): Promise<HistorySyncSummary> {
  const supabase = backend.admin;

  const summary: HistorySyncSummary = {
    itemsProcessed: 0,
    priceRecordsInserted: 0,
    priceErrors: 0,
    goldRecordsInserted: 0,
    goldRecordsRejected: 0,
    goldErrors: 0,
  };

  const items = await fetchTrackedItems();

  for (let index = 0; index < items.length; index++) {
    const itemId = items[index];

    try {
      const histories = await fetchItemHistory(itemId);

      for (const locationData of histories) {
        const records = (locationData?.data ?? []).map((point: any) => ({
          id: crypto.randomUUID(),
          itemId: locationData.item_id,
          itemName: locationData.item_id,
          city: locationData.location,
          quality: locationData.quality,
          avgPrice: Math.round(point.avg_price),
          itemCount: point.item_count,
          timestamp: new Date(point.timestamp).toISOString(),
          server: 'Americas',
          createdAt: new Date().toISOString(),
        }));

        if (!records.length) {
          continue;
        }

        const { error } = await supabase.from('price_history').insert(records);

        if (error) {
          console.error('[HistorySync] Insert error:', error);
          summary.priceErrors += records.length;
        } else {
          summary.priceRecordsInserted += records.length;
        }
      }
    } catch (error) {
      console.error(`[HistorySync] Error fetching ${itemId}:`, error);
      summary.priceErrors++;
      await delay(RATE_LIMIT_DELAY_MS);
    }

    summary.itemsProcessed++;
    await delay(ITEM_DELAY_MS);
  }

  try {
    const goldHistory = await fetchGoldHistory();
    const { valid, rejected } = validateGoldPrices(goldHistory);

    summary.goldRecordsRejected = rejected.length;

    if (valid.length) {
      const { error } = await supabase.from('gold_prices').insert(
        valid.map(price => ({
          id: crypto.randomUUID(),
          price: price.price,
          timestamp: new Date(price.timestamp).toISOString(),
          server: 'Americas',
          createdAt: new Date().toISOString(),
        }))
      );

      if (error) {
        console.error('[HistorySync] Gold insert error:', error);
        summary.goldErrors += valid.length;
      } else {
        summary.goldRecordsInserted = valid.length;
      }
    }
  } catch (error) {
    console.error('[HistorySync] Gold history error:', error);
    summary.goldErrors++;
  }

  return summary;
}
