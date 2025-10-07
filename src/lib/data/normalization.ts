/**
 * Data Normalization Layer
 * Handles format inconsistencies across different API sources
 * Transforms and validates all external data with Zod
 */

import { z } from 'zod';

// ============================================================================
// TIMESTAMP NORMALIZATION
// ============================================================================

/**
 * Normalize various timestamp formats to ISO 8601
 */
export function normalizeTimestamp(timestamp: string | number | Date): string {
  try {
    if (typeof timestamp === 'number') {
      // Unix timestamp (seconds or milliseconds)
      const date = timestamp > 10000000000 
        ? new Date(timestamp) 
        : new Date(timestamp * 1000);
      return date.toISOString();
    }
    
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    
    // Try parsing as ISO string
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    throw new Error(`Invalid timestamp format: ${timestamp}`);
  } catch (error) {
    console.error('Timestamp normalization error:', error);
    return new Date().toISOString(); // Fallback to current time
  }
}

// ============================================================================
// PRICE NORMALIZATION
// ============================================================================

/**
 * Normalize price values (handle null, negative, or invalid prices)
 */
export function normalizePrice(price: number | null | undefined): number {
  if (price === null || price === undefined || price < 0) {
    return 0;
  }
  return Math.round(price); // Ensure integer
}

/**
 * Normalize price range
 */
export function normalizePriceRange(min: number, max: number): { min: number; max: number } {
  const normalizedMin = normalizePrice(min);
  const normalizedMax = normalizePrice(max);
  
  // Ensure min <= max
  if (normalizedMin > normalizedMax) {
    return { min: normalizedMax, max: normalizedMin };
  }
  
  return { min: normalizedMin, max: normalizedMax };
}

// ============================================================================
// LOCATION/CITY NORMALIZATION
// ============================================================================

const CITY_NAME_MAP: Record<string, string> = {
  'Caerleon': 'Caerleon',
  'caerleon': 'Caerleon',
  'CAERLEON': 'Caerleon',
  'Bridgewatch': 'Bridgewatch',
  'bridgewatch': 'Bridgewatch',
  'Lymhurst': 'Lymhurst',
  'lymhurst': 'Lymhurst',
  'Martlock': 'Martlock',
  'martlock': 'Martlock',
  'Fort Sterling': 'Fort Sterling',
  'fort sterling': 'Fort Sterling',
  'FortSterling': 'Fort Sterling',
  'Thetford': 'Thetford',
  'thetford': 'Thetford',
  'Black Market': 'Black Market',
  'black market': 'Black Market',
  'BlackMarket': 'Black Market',
  'blackmarket': 'Black Market',
};

/**
 * Normalize city names to consistent format
 */
export function normalizeCity(city: string): string {
  return CITY_NAME_MAP[city] || city;
}

// ============================================================================
// SERVER NORMALIZATION
// ============================================================================

const SERVER_MAP: Record<string, 'Americas' | 'Europe' | 'Asia'> = {
  'Americas': 'Americas',
  'americas': 'Americas',
  'AMERICAS': 'Americas',
  'US': 'Americas',
  'NA': 'Americas',
  'Europe': 'Europe',
  'europe': 'Europe',
  'EUROPE': 'Europe',
  'EU': 'Europe',
  'Asia': 'Asia',
  'asia': 'Asia',
  'ASIA': 'Asia',
  'AS': 'Asia',
};

/**
 * Normalize server names
 */
export function normalizeServer(server: string): 'Americas' | 'Europe' | 'Asia' {
  return SERVER_MAP[server] || 'Americas';
}

// ============================================================================
// QUALITY NORMALIZATION
// ============================================================================

/**
 * Normalize quality values (1-5)
 */
export function normalizeQuality(quality: number | null | undefined): number {
  if (quality === null || quality === undefined) {
    return 1; // Default to Normal quality
  }
  
  // Clamp between 1 and 5
  return Math.max(1, Math.min(5, Math.round(quality)));
}

// ============================================================================
// ITEM ID NORMALIZATION
// ============================================================================

/**
 * Normalize item IDs (trim, uppercase certain parts)
 */
export function normalizeItemId(itemId: string): string {
  return itemId.trim();
}

// ============================================================================
// COMPREHENSIVE DATA SCHEMAS WITH TRANSFORMS
// ============================================================================

/**
 * Normalized Market Price Schema
 */
export const NormalizedMarketPriceSchema = z.object({
  itemId: z.string().transform(normalizeItemId),
  itemName: z.string(),
  city: z.string().transform(normalizeCity),
  quality: z.number().transform(normalizeQuality),
  sellPriceMin: z.number().transform(normalizePrice),
  sellPriceMax: z.number().transform(normalizePrice),
  buyPriceMin: z.number().transform(normalizePrice),
  buyPriceMax: z.number().transform(normalizePrice),
  timestamp: z.string().transform(normalizeTimestamp),
  server: z.string().transform(normalizeServer),
});

export type NormalizedMarketPrice = z.infer<typeof NormalizedMarketPriceSchema>;

/**
 * Normalized Price History Schema
 */
export const NormalizedPriceHistorySchema = z.object({
  itemId: z.string().transform(normalizeItemId),
  location: z.string().transform(normalizeCity),
  quality: z.number().transform(normalizeQuality),
  avgPrice: z.number().transform(normalizePrice),
  itemCount: z.number().int().nonnegative(),
  timestamp: z.string().transform(normalizeTimestamp),
  server: z.string().transform(normalizeServer),
});

export type NormalizedPriceHistory = z.infer<typeof NormalizedPriceHistorySchema>;

/**
 * Normalized Gold Price Schema
 */
export const NormalizedGoldPriceSchema = z.object({
  price: z.number().transform(normalizePrice),
  timestamp: z.string().transform(normalizeTimestamp),
  server: z.string().transform(normalizeServer),
});

export type NormalizedGoldPrice = z.infer<typeof NormalizedGoldPriceSchema>;

// ============================================================================
// BATCH NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize array of market prices with error logging
 */
export function normalizeMarketPrices(
  data: unknown[],
  source: string = 'unknown'
): NormalizedMarketPrice[] {
  const normalized: NormalizedMarketPrice[] = [];
  const errors: Array<{ index: number; error: string; data: unknown }> = [];

  data.forEach((item, index) => {
    try {
      const result = NormalizedMarketPriceSchema.parse(item);
      normalized.push(result);
    } catch (error) {
      errors.push({
        index,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: item,
      });
    }
  });

  if (errors.length > 0) {
    console.warn(`[${source}] Failed to normalize ${errors.length}/${data.length} market prices:`, {
      errorCount: errors.length,
      totalCount: data.length,
      sampleErrors: errors.slice(0, 3), // Log first 3 errors
    });
  }

  return normalized;
}

/**
 * Normalize array of price history with error logging
 */
export function normalizePriceHistory(
  data: unknown[],
  source: string = 'unknown'
): NormalizedPriceHistory[] {
  const normalized: NormalizedPriceHistory[] = [];
  const errors: Array<{ index: number; error: string; data: unknown }> = [];

  data.forEach((item, index) => {
    try {
      const result = NormalizedPriceHistorySchema.parse(item);
      normalized.push(result);
    } catch (error) {
      errors.push({
        index,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: item,
      });
    }
  });

  if (errors.length > 0) {
    console.warn(`[${source}] Failed to normalize ${errors.length}/${data.length} price history entries:`, {
      errorCount: errors.length,
      totalCount: data.length,
      sampleErrors: errors.slice(0, 3),
    });
  }

  return normalized;
}

/**
 * Normalize array of gold prices with error logging
 */
export function normalizeGoldPrices(
  data: unknown[],
  source: string = 'unknown'
): NormalizedGoldPrice[] {
  const normalized: NormalizedGoldPrice[] = [];
  const errors: Array<{ index: number; error: string; data: unknown }> = [];

  data.forEach((item, index) => {
    try {
      const result = NormalizedGoldPriceSchema.parse(item);
      normalized.push(result);
    } catch (error) {
      errors.push({
        index,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: item,
      });
    }
  });

  if (errors.length > 0) {
    console.warn(`[${source}] Failed to normalize ${errors.length}/${data.length} gold prices:`, {
      errorCount: errors.length,
      totalCount: data.length,
      sampleErrors: errors.slice(0, 3),
    });
  }

  return normalized;
}

// ============================================================================
// DATA CONSISTENCY CHECKS
// ============================================================================

/**
 * Validate data consistency across sources
 */
export function validateDataConsistency(
  data1: NormalizedMarketPrice[],
  data2: NormalizedMarketPrice[]
): { consistent: boolean; differences: string[] } {
  const differences: string[] = [];

  // Check for same items
  const items1 = new Set(data1.map(d => d.itemId));
  const items2 = new Set(data2.map(d => d.itemId));

  const onlyIn1 = [...items1].filter(id => !items2.has(id));
  const onlyIn2 = [...items2].filter(id => !items1.has(id));

  if (onlyIn1.length > 0) {
    differences.push(`Items only in source 1: ${onlyIn1.slice(0, 5).join(', ')}`);
  }

  if (onlyIn2.length > 0) {
    differences.push(`Items only in source 2: ${onlyIn2.slice(0, 5).join(', ')}`);
  }

  return {
    consistent: differences.length === 0,
    differences,
  };
}
