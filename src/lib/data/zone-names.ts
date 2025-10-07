/**
 * Zone Name Mapping Service
 * Maps zone IDs to human-readable names using world.json from ao-bin-dumps
 */

const WORLD_JSON_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/world.json';

interface ZoneData {
  Index: string;
  UniqueName: string;
  DisplayName?: string;
  Type?: string;
}

let zoneCache: Map<string, string> | null = null;
let loadingPromise: Promise<void> | null = null;

/**
 * Load zone data from world.json
 */
async function loadZoneData(): Promise<void> {
  if (zoneCache) {
    return;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const response = await fetch(WORLD_JSON_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch world.json: ${response.status}`);
      }

      const data = await response.json();
      zoneCache = new Map();

      // Process world data
      if (Array.isArray(data)) {
        data.forEach((zone: ZoneData) => {
          if (zone.UniqueName) {
            // Use DisplayName if available, otherwise format UniqueName
            const displayName = zone.DisplayName ?? formatZoneName(zone.UniqueName);
            zoneCache!.set(zone.UniqueName, displayName);
            
            // Also map by Index if available
            if (zone.Index) {
              zoneCache!.set(zone.Index, displayName);
            }
          }
        });
      }

      console.log(`[ZoneNames] Loaded ${zoneCache.size} zone mappings`);
    } catch (error) {
      console.error('[ZoneNames] Failed to load zone data:', error);
      zoneCache = new Map(); // Empty map to prevent repeated failures
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * Format zone unique name to display name
 */
function formatZoneName(uniqueName: string): string {
  return uniqueName
    .replace(/@\d+$/, '') // Remove @number suffix
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize words
}

/**
 * Get zone display name from unique name or ID
 */
export async function getZoneName(zoneId: string | null | undefined): Promise<string> {
  if (!zoneId) {
    return 'Unknown';
  }

  // Ensure zone data is loaded
  await loadZoneData();

  // Try to find in cache
  const displayName = zoneCache?.get(zoneId);
  
  if (displayName) {
    return displayName;
  }

  // Fallback to formatted unique name
  return formatZoneName(zoneId);
}

/**
 * Get multiple zone names at once
 */
export async function getZoneNames(zoneIds: (string | null | undefined)[]): Promise<Map<string, string>> {
  await loadZoneData();
  
  const result = new Map<string, string>();
  
  for (const zoneId of zoneIds) {
    if (zoneId) {
      result.set(zoneId, await getZoneName(zoneId));
    }
  }
  
  return result;
}

/**
 * Preload zone data (call on app startup)
 */
export async function preloadZoneData(): Promise<void> {
  await loadZoneData();
}

/**
 * Get all zone mappings (for debugging)
 */
export function getAllZoneMappings(): Map<string, string> | null {
  return zoneCache;
}
