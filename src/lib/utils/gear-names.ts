/**
 * Gear Name Utilities
 * Converts gear IDs to localized names for display in PvP pages
 */

import { itemsService } from '@/lib/services/items.service';

// Cache for gear names to avoid repeated lookups
const gearNameCache = new Map<string, string>();

/**
 * Get localized name for a gear piece
 * @param gearId - The unique gear ID (e.g., "T4_HEAD_PLATE_SET1")
 * @param locale - Locale code (default: EN-US)
 * @returns Localized name or formatted ID as fallback
 */
export async function getGearName(
  gearId: string | null,
  locale: string = 'EN-US'
): Promise<string> {
  if (!gearId) {
    return 'None';
  }

  // Check cache first
  const cacheKey = `${gearId}_${locale}`;
  if (gearNameCache.has(cacheKey)) {
    return gearNameCache.get(cacheKey)!;
  }

  try {
    // Fetch item data
    const item = await itemsService.getById(gearId);

    if (item) {
      const localizedName = itemsService.getLocalizedName(item);

      // Only cache if we got a real localized name (not the UniqueName fallback)
      if (localizedName && localizedName !== gearId) {
        gearNameCache.set(cacheKey, localizedName);
        return localizedName;
      }
    }
  } catch (error) {
    console.warn(`Failed to get localized name for ${gearId}:`, error);
  }

  // Fallback: Format the ID to be more readable
  // Remove tier prefix and format nicely
  const formatted = formatGearId(gearId);
  gearNameCache.set(cacheKey, formatted);
  return formatted;
}

/**
 * Format gear ID to be more readable
 * Converts "T4_HEAD_PLATE_SET1" to "Tier 4 Head Plate"
 * Removes technical suffixes and makes it human-readable
 */
function formatGearId(gearId: string): string {
  const parts = gearId.split('@');
  return parts[0].replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
}

/**
 * Get localized names for an entire build
 */
export async function getLocalizedBuildNames(
  build: {
    mainHand: string;
    offHand: string | null;
    head: string;
    armor: string;
    shoes: string;
    cape?: string | null;
    food?: string | null;
    potion?: string | null;
  },
  locale: string = 'EN-US'
): Promise<{
  mainHand: string;
  offHand: string;
  head: string;
  armor: string;
  shoes: string;
  cape: string;
  food: string;
  potion: string;
}> {
  const [mainHand, offHand, head, armor, shoes, cape, food, potion] = await Promise.all([
    getGearName(build.mainHand, locale),
    getGearName(build.offHand, locale),
    getGearName(build.head, locale),
    getGearName(build.armor, locale),
    getGearName(build.shoes, locale),
    getGearName(build.cape ?? null, locale),
    getGearName(build.food ?? null, locale),
    getGearName(build.potion ?? null, locale),
  ]);

  return {
    mainHand,
    offHand,
    head,
    armor,
    shoes,
    cape,
    food,
    potion,
  };
}

/**
 * Clear the gear name cache
 */
export function clearGearNameCache(): void {
  gearNameCache.clear();
}
