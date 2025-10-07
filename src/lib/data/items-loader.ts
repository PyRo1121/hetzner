/**
 * Items Data Loader
 * Fetches and caches item data from ao-bin-dumps
 * Source: https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master/formatted/items.json
 */

import { z } from 'zod';

const ITEMS_JSON_URL =
  'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master/formatted/items.json';

// Zod schema for item validation
const LocalizationSchema = z.object({
  'EN-US': z.string().optional(),
  'DE-DE': z.string().optional(),
  'FR-FR': z.string().optional(),
  'RU-RU': z.string().optional(),
  'PL-PL': z.string().optional(),
  'ES-ES': z.string().optional(),
  'PT-BR': z.string().optional(),
  'IT-IT': z.string().optional(),
  'ZH-CN': z.string().optional(),
  'KO-KR': z.string().optional(),
  'JA-JP': z.string().optional(),
  'ZH-TW': z.string().optional(),
  'ID-ID': z.string().optional(),
  'TR-TR': z.string().optional(),
  'AR-SA': z.string().optional(),
});

const ItemSchema = z.object({
  UniqueName: z.string(),
  LocalizedNames: LocalizationSchema.nullable().optional(),
  LocalizedDescriptions: LocalizationSchema.nullable().optional(),
  Index: z.union([z.number(), z.string()]).optional(), // Can be number or string
  Tier: z.number().optional(),
}).passthrough(); // Allow additional fields

export type AlbionItem = z.infer<typeof ItemSchema>;
export type ItemsDatabase = Record<string, AlbionItem>;

let cachedItems: ItemsDatabase | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch items from ao-bin-dumps
 */
export async function fetchItems(): Promise<ItemsDatabase> {
  try {
    console.log('📦 Fetching items from ao-bin-dumps...');
    const response = await fetch(ITEMS_JSON_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
    }

    console.log('✅ Items response received, parsing JSON...');
    const data = await response.json();
    
    // Check if data is an array or object
    const isArray = Array.isArray(data);
    console.log(`✅ Items loaded: ${isArray ? data.length : Object.keys(data).length} items (${isArray ? 'array' : 'object'} format)`);
    
    // Validate the data structure
    if (!data) {
      throw new Error('Invalid items data format');
    }

    // Validate each item and convert to object keyed by UniqueName
    const validatedItems: ItemsDatabase = {};
    
    if (isArray) {
      // Data is an array - convert to object
      for (const item of data) {
        try {
          const validatedItem = ItemSchema.parse(item);
          validatedItems[validatedItem.UniqueName] = validatedItem;
        } catch (error) {
          // Skip invalid items silently
        }
      }
    } else {
      // Data is already an object
      for (const [key, value] of Object.entries(data)) {
        try {
          validatedItems[key] = ItemSchema.parse(value);
        } catch (error) {
          // Skip invalid items silently
        }
      }
    }

    return validatedItems;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
}

/**
 * Get items with caching
 */
export async function getItems(forceRefresh = false): Promise<ItemsDatabase> {
  const now = Date.now();
  
  // Return cached items if available and not expired
  if (!forceRefresh && cachedItems && now - lastFetchTime < CACHE_DURATION) {
    return cachedItems;
  }

  // Fetch fresh data
  cachedItems = await fetchItems();
  lastFetchTime = now;
  
  return cachedItems;
}

/**
 * Search items by name (localized)
 */
export async function searchItems(
  query: string,
  locale: string = 'EN-US',
  limit: number = 50
): Promise<AlbionItem[]> {
  const items = await getItems();
  const lowerQuery = query.toLowerCase();
  
  const results: AlbionItem[] = [];
  
  for (const item of Object.values(items)) {
    // Search in localized name
    const localizedName = item.LocalizedNames?.[locale as keyof typeof item.LocalizedNames];
    if (localizedName?.toLowerCase().includes(lowerQuery)) {
      results.push(item);
      if (results.length >= limit) {break;}
    }
    
    // Also search in UniqueName as fallback
    if (results.length < limit && item.UniqueName.toLowerCase().includes(lowerQuery)) {
      if (!results.find(r => r.UniqueName === item.UniqueName)) {
        results.push(item);
      }
    }
  }
  
  return results;
}

/**
 * Get item by UniqueName
 */
export async function getItemByUniqueName(uniqueName: string): Promise<AlbionItem | null> {
  const items = await getItems();
  return items[uniqueName] || null;
}

/**
 * Get localized item name
 */
export function getLocalizedName(item: AlbionItem, locale: string = 'EN-US'): string {
  return item.LocalizedNames?.[locale as keyof typeof item.LocalizedNames] || item.UniqueName;
}

/**
 * Get items by tier
 */
export async function getItemsByTier(tier: number): Promise<AlbionItem[]> {
  const items = await getItems();
  return Object.values(items).filter(item => item.Tier === tier);
}

/**
 * Get all unique tiers
 */
export async function getAllTiers(): Promise<number[]> {
  const items = await getItems();
  const tiers = new Set<number>();
  
  for (const item of Object.values(items)) {
    if (item.Tier !== undefined) {
      tiers.add(item.Tier);
    }
  }
  
  return Array.from(tiers).sort((a, b) => a - b);
}
