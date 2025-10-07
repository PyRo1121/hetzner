/**
 * Image URL Utilities
 * Provides Supabase Storage URLs for item images with fallback to Albion API
 */

import { supabase } from '@/backend/supabase/clients';

const SUPABASE_STORAGE_BUCKET = 'item-images';

export type Quality = 1 | 2 | 3 | 4 | 5;
export type Enchantment = 0 | 1 | 2 | 3 | 4;

interface ImageOptions {
  quality?: Quality;
  enchantment?: Enchantment;
  size?: number;
}

/**
 * Get item image URL from Supabase Storage with fallback to Albion API
 * @param itemId - Item unique name (e.g., "T8_HEAD_LEATHER_SET3")
 * @param options - Image rendering options
 * @returns Image URL (Supabase Storage or Albion API)
 */
export function getItemImageUrl(
  itemId: string,
  options: ImageOptions = {}
): string {
  const { quality = 1, enchantment = 0, size = 64 } = options;

  // Construct Supabase Storage URL
  // Format: itemId/q{quality}_e{enchantment}_s{size}.png
  const sanitizedItemId = itemId.replace(/@\d+$/, '');
  const storagePath = `${sanitizedItemId}/q${quality}_e${enchantment}_s${size}.png`;
  const { data } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  // Return Supabase CDN URL (Next.js Image component will handle 404 fallback to Albion API)
  return data.publicUrl;
}

/**
 * Get item image URL with Next.js Image optimization
 * Uses a proxy API route that handles Supabase Storage + fallback
 * @param itemId - Item unique name
 * @param options - Image rendering options
 * @returns Proxied image URL through our API
 */
export function getItemImageUrlOptimized(
  itemId: string,
  options: ImageOptions = {}
): string {
  const { quality = 1, size = 64 } = options;
  const params = new URLSearchParams({
    itemId,
    quality: quality.toString(),
    size: size.toString(),
  });

  return `/api/render/item?${params.toString()}`;
}
