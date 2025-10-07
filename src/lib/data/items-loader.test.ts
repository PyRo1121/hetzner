import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchItems, searchItems, getItemByUniqueName, getLocalizedName } from './items-loader';

// Mock fetch
global.fetch = vi.fn();

describe('items-loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockItemsData = {
    T4_BAG: {
      UniqueName: 'T4_BAG',
      LocalizedNames: {
        'EN-US': "Adept's Bag",
        'DE-DE': 'Tasche des Adepten',
      },
      Tier: 4,
      Index: 1,
    },
    T5_2H_SWORD: {
      UniqueName: 'T5_2H_SWORD',
      LocalizedNames: {
        'EN-US': "Expert's Claymore",
      },
      Tier: 5,
      Index: 2,
    },
  };

  it('should fetch items successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsData,
    });

    const items = await fetchItems();
    expect(items).toHaveProperty('T4_BAG');
    expect(items.T4_BAG.UniqueName).toBe('T4_BAG');
  });

  it('should throw error on failed fetch', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchItems()).rejects.toThrow('Failed to fetch items');
  });

  it('should get item by UniqueName', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsData,
    });

    const item = await getItemByUniqueName('T4_BAG');
    expect(item).not.toBeNull();
    expect(item?.UniqueName).toBe('T4_BAG');
  });

  it('should return null for non-existent item', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsData,
    });

    const item = await getItemByUniqueName('NONEXISTENT');
    expect(item).toBeNull();
  });

  it('should search items by localized name', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockItemsData,
    });

    const results = await searchItems('bag', 'EN-US', 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].UniqueName).toBe('T4_BAG');
  });

  it('should get localized name', () => {
    const item = mockItemsData.T4_BAG;
    expect(getLocalizedName(item, 'EN-US')).toBe("Adept's Bag");
    expect(getLocalizedName(item, 'DE-DE')).toBe('Tasche des Adepten');
    expect(getLocalizedName(item, 'FR-FR')).toBe('T4_BAG'); // Fallback to UniqueName
  });
});
