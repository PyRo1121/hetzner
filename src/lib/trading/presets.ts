/**
 * Trading Filter Presets
 * Save and load filter configurations using localStorage
 */

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: {
    minROI: number;
    minProfit?: number;
    maxInvestment?: number;
    cities?: string[];
    itemCategories?: string[];
    minQuantity?: number;
    maxQuantity?: number;
  };
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'albion-trading-presets';

/**
 * Get all saved presets
 */
export function getPresets(): FilterPreset[] {
  if (typeof window === 'undefined') {return [];}
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading presets:', error);
    return [];
  }
}

/**
 * Save a new preset
 */
export function savePreset(preset: Omit<FilterPreset, 'id' | 'createdAt' | 'updatedAt'>): FilterPreset {
  const newPreset: FilterPreset = {
    ...preset,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const presets = getPresets();
  presets.push(newPreset);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return newPreset;
  } catch (error) {
    console.error('Error saving preset:', error);
    throw new Error('Failed to save preset');
  }
}

/**
 * Update an existing preset
 */
export function updatePreset(id: string, updates: Partial<Omit<FilterPreset, 'id' | 'createdAt'>>): FilterPreset | null {
  const presets = getPresets();
  const index = presets.findIndex((p) => p.id === id);
  
  if (index === -1) {return null;}

  presets[index] = {
    ...presets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    return presets[index];
  } catch (error) {
    console.error('Error updating preset:', error);
    throw new Error('Failed to update preset');
  }
}

/**
 * Delete a preset
 */
export function deletePreset(id: string): boolean {
  const presets = getPresets();
  const filtered = presets.filter((p) => p.id !== id);
  
  if (filtered.length === presets.length) {return false;}

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting preset:', error);
    throw new Error('Failed to delete preset');
  }
}

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): FilterPreset | null {
  const presets = getPresets();
  return presets.find((p) => p.id === id) || null;
}

/**
 * Export presets to JSON
 */
export function exportPresets(): string {
  const presets = getPresets();
  return JSON.stringify(presets, null, 2);
}

/**
 * Import presets from JSON
 */
export function importPresets(json: string): number {
  try {
    const imported = JSON.parse(json) as FilterPreset[];
    
    if (!Array.isArray(imported)) {
      throw new Error('Invalid preset format');
    }

    const existing = getPresets();
    const merged = [...existing, ...imported];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return imported.length;
  } catch (error) {
    console.error('Error importing presets:', error);
    throw new Error('Failed to import presets');
  }
}

/**
 * Default presets
 */
export const DEFAULT_PRESETS: Omit<FilterPreset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'High ROI',
    description: 'Find opportunities with 20%+ ROI',
    filters: {
      minROI: 20,
      minProfit: 50000,
    },
  },
  {
    name: 'Quick Flips',
    description: 'Fast trades with moderate profit',
    filters: {
      minROI: 10,
      minProfit: 20000,
      maxInvestment: 500000,
    },
  },
  {
    name: 'Bulk Trading',
    description: 'Large quantity trades',
    filters: {
      minROI: 5,
      minQuantity: 20,
    },
  },
  {
    name: 'Safe Bets',
    description: 'Lower risk, steady profits',
    filters: {
      minROI: 8,
      minProfit: 30000,
      cities: ['Caerleon', 'Bridgewatch'],
    },
  },
];

/**
 * Initialize default presets if none exist
 */
export function initializeDefaultPresets(): void {
  const existing = getPresets();
  
  if (existing.length === 0) {
    DEFAULT_PRESETS.forEach((preset) => savePreset(preset));
  }
}
