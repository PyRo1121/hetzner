/**
 * Items Service (Singleton)
 * Handles all item-related business logic
 * Single source of truth for item data
 */

import { supabase } from '@/backend/supabase/clients';

export interface Item {
  id: string;
  name: string;
  tier: number;
  category: string;
  subcategory?: string;
  iconUrl?: string;
}

class ItemsService {
  private static instance: ItemsService;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): ItemsService {
    if (!ItemsService.instance) {
      ItemsService.instance = new ItemsService();
    }
    return ItemsService.instance;
  }

  /**
   * Get all items - direct query
   */
  async getAll(): Promise<Item[]> {
    const { data, error } = await supabase.from('ao_items').select('*').order('localized_en');

    if (error) {throw error;}

    return data.map(item => ({
      id: item.unique_name,
      name: item.localized_en,
      tier: item.tier ?? 0,
      category: item.category ?? 'Unknown',
      subcategory: item.subcategory,
      iconUrl: undefined,
    }));
  }

  /**
   * Get item by ID - direct query
   */
  async getById(id: string): Promise<Item | null> {
    const { data, error } = await supabase
      .from('ao_items')
      .select('*')
      .eq('unique_name', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {return null;}
      throw error;
    }

    return {
      id: data.unique_name,
      name: data.localized_en,
      tier: data.tier ?? 0,
      category: data.category ?? 'Unknown',
      subcategory: data.subcategory,
      iconUrl: undefined,
    };
  }

  /**
   * Get multiple items by IDs - batched queries to avoid URL length limits
   */
  async getByIds(ids: string[]): Promise<Map<string, Item>> {
    if (ids.length === 0) {
      return new Map();
    }

    const result = new Map<string, Item>();
    
    // Batch size to avoid 414 Request-URI Too Large error
    // Supabase/Cloudflare has URL length limits
    const BATCH_SIZE = 100;
    
    // Split into batches
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabase
        .from('ao_items')
        .select('*')
        .in('unique_name', batch);

      if (error) {
        console.error(`[ItemsService] Batch ${i / BATCH_SIZE + 1} failed:`, error);
        throw error;
      }

      data.forEach((item) => {
        result.set(item.unique_name, {
          id: item.unique_name,
          name: item.localized_en,
          tier: item.tier ?? 0,
          category: item.category ?? 'Unknown',
          subcategory: item.subcategory,
          iconUrl: undefined,
        });
      });
    }

    return result;
  }

  /**
   * Search items by name - direct query
   */
  async search(query: string, limit: number = 10): Promise<Item[]> {
    const { data, error } = await supabase
      .from('ao_items')
      .select('*')
      .ilike('localized_en', `%${query}%`)
      .limit(limit);

    if (error) {throw error;}

    return data.map(item => ({
      id: item.unique_name,
      name: item.localized_en,
      tier: item.tier ?? 0,
      category: item.category ?? 'Unknown',
      subcategory: item.subcategory,
      iconUrl: undefined,
    }));
  }

  /**
   * Get items by category - direct query
   */
  async getByCategory(category: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from('ao_items')
      .select('*')
      .eq('category', category)
      .order('localized_en');

    if (error) {throw error;}

    return data.map(item => ({
      id: item.unique_name,
      name: item.localized_en,
      tier: item.tier ?? 0,
      category: item.category ?? 'Unknown',
      subcategory: item.subcategory,
      iconUrl: undefined,
    }));
  }

  /**
   * Get localized name for an item
   */
  getLocalizedName(item: Item): string {
    return item.name;
  }
}

// Export singleton instance
export const itemsService = ItemsService.getInstance();
