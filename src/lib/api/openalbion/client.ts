/**
 * OpenAlbion API Client
 * Documentation: https://openalbion.com/
 * Base URL: https://api.openalbion.com/api/v3/
 * Provides static game metadata (items, categories, etc.)
 */

import { z } from 'zod';

const BASE_URL = 'https://api.openalbion.com/api/v3';

// Zod schemas for validation
const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  subcategories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ).optional(),
});

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.number(),
  item_power: z.number().optional(),
  icon: z.string().optional(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
export type Item = z.infer<typeof ItemSchema>;

/**
 * OpenAlbion API Client
 */
export class OpenAlbionClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  /**
   * Get categories by type
   * @param type - Category type (weapon, armor, accessory, consumable)
   */
  async getCategories(type?: 'weapon' | 'armor' | 'accessory' | 'consumable'): Promise<Category[]> {
    const params = new URLSearchParams();
    if (type) {params.append('type', type);}

    const url = `${this.baseUrl}/categories${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAlbion API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return z.object({ data: z.array(CategorySchema) }).parse(data).data;
  }

  /**
   * Get weapons
   * @param options - Query options
   */
  async getWeapons(options?: {
    categoryId?: string;
    subcategoryId?: string;
    tier?: number;
  }): Promise<Item[]> {
    const params = new URLSearchParams();
    if (options?.categoryId) {params.append('category_id', options.categoryId);}
    if (options?.subcategoryId) {params.append('subcategory_id', options.subcategoryId);}
    if (options?.tier) {params.append('tier', options.tier.toString());}

    const url = `${this.baseUrl}/weapons${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAlbion API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return z.object({ data: z.array(ItemSchema) }).parse(data).data;
  }

  /**
   * Get armors
   * @param options - Query options
   */
  async getArmors(options?: {
    categoryId?: string;
    subcategoryId?: string;
    tier?: number;
  }): Promise<Item[]> {
    const params = new URLSearchParams();
    if (options?.categoryId) {params.append('category_id', options.categoryId);}
    if (options?.subcategoryId) {params.append('subcategory_id', options.subcategoryId);}
    if (options?.tier) {params.append('tier', options.tier.toString());}

    const url = `${this.baseUrl}/armors${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAlbion API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return z.object({ data: z.array(ItemSchema) }).parse(data).data;
  }

  /**
   * Get accessories
   * @param options - Query options
   */
  async getAccessories(options?: {
    categoryId?: string;
    subcategoryId?: string;
    tier?: number;
  }): Promise<Item[]> {
    const params = new URLSearchParams();
    if (options?.categoryId) {params.append('category_id', options.categoryId);}
    if (options?.subcategoryId) {params.append('subcategory_id', options.subcategoryId);}
    if (options?.tier) {params.append('tier', options.tier.toString());}

    const url = `${this.baseUrl}/accessories${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAlbion API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return z.object({ data: z.array(ItemSchema) }).parse(data).data;
  }

  /**
   * Get consumables
   * @param options - Query options
   */
  async getConsumables(options?: {
    categoryId?: string;
    subcategoryId?: string;
    tier?: number;
  }): Promise<Item[]> {
    const params = new URLSearchParams();
    if (options?.categoryId) {params.append('category_id', options.categoryId);}
    if (options?.subcategoryId) {params.append('subcategory_id', options.subcategoryId);}
    if (options?.tier) {params.append('tier', options.tier.toString());}

    const url = `${this.baseUrl}/consumables${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAlbion API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return z.object({ data: z.array(ItemSchema) }).parse(data).data;
  }
}

// Export singleton instance
export const openAlbionClient = new OpenAlbionClient();
