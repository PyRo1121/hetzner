/**
 * Item Image Storage Service
 * Manages item images in Supabase Storage for fast CDN delivery
 */

import { Buffer } from 'buffer';
import { getSupabaseAdmin } from '@/backend/supabase/clients';

const BUCKET_NAME = 'item-images';
const RENDER_BASE_URL = 'https://render.albiononline.com/v1/item';

/**
 * Get image URL from Supabase Storage or upload if not exists
 */
export async function getItemImageUrl(
  itemId: string,
  quality: number = 1,
  enchantment: number = 0,
  size: number = 64
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  
  // Build file path: items/T8_HEAD_LEATHER_SET3/q1_e0_s64.png
  const folder = itemId.replace(/@\d+$/, ''); // Strip enchantment from ID
  const fileName = `q${quality}_e${enchantment}_s${size}.png`;
  const filePath = `${folder}/${fileName}`;

  // Get public URL (will work if file exists)
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  // Check if file exists by trying to fetch it
  try {
    const checkResponse = await fetch(data.publicUrl, { method: 'HEAD' });
    if (checkResponse.ok) {
      return data.publicUrl;
    }
  } catch {
    // File doesn't exist, continue to upload
  }

  // Image doesn't exist - download from Albion and upload
  try {
    const albionUrl = `${RENDER_BASE_URL}/${itemId}.png?quality=${quality}&size=${size}`;
    const response = await fetch(albionUrl);

    if (!response.ok) {
      console.warn(`[Storage] Failed to fetch from Albion: ${itemId}`);
      return null;
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1 year
        upsert: true,
      });

    if (uploadError) {
      console.error(`[Storage] Upload failed for ${itemId}:`, uploadError);
      return null;
    }

    // Return public URL
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error(`[Storage] Error processing ${itemId}:`, error);
    return null;
  }
}

/**
 * Pre-cache common items (run this after seeding items)
 */
export async function preCacheCommonItems(itemIds: string[]): Promise<void> {
  console.warn(`[Storage] Starting PARALLEL pre-cache for ${itemIds.length} items...`);
  
  // Reduce variants for faster caching
  const qualities = [1, 3, 5]; // Only low, mid, high quality
  const enchantments = [0, 2, 4]; // Only 0, 2, 4 enchantments
  const sizes = [64]; // Only 64px (most common size)

  let cached = 0;
  let failed = 0;
  let skipped = 0;
  const totalVariants = itemIds.length * qualities.length * enchantments.length * sizes.length;

  console.warn(`[Storage] Total variants to process: ${totalVariants}`);
  console.warn(`[Storage] Using PARALLEL processing with 20 concurrent requests`);

  // Process in batches of 20 items at a time (parallel) - Very conservative to avoid 429
  const batchSize = 20;
  
  for (let i = 0; i < itemIds.length; i += batchSize) {
    const batch = itemIds.slice(i, i + batchSize);
    console.warn(`[Storage] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(itemIds.length / batchSize)} (items ${i + 1}-${Math.min(i + batchSize, itemIds.length)})`);
    
    // Process all variants for this batch in parallel
    const promises = batch.flatMap(itemId =>
      qualities.flatMap(quality =>
        enchantments.flatMap(enchantment =>
          sizes.map(async (size) => {
            try {
              const url = await getItemImageUrl(itemId, quality, enchantment, size);
              if (url) {
                cached++;
              } else {
                skipped++;
              }
            } catch (_error) {
              failed++;
            }
          })
        )
      )
    );

    // Wait for entire batch to complete
    await Promise.all(promises);
    
    console.warn(`[Storage] Progress: ${cached} cached, ${skipped} skipped, ${failed} failed`);
    
    // Significant delay to completely avoid 429 errors
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.warn(`[Storage] Pre-cache complete: ${cached} cached, ${skipped} skipped, ${failed} failed`);
}

/**
 * Ensure storage bucket exists
 */
export async function ensureBucketExists(): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 1024 * 1024, // 1MB max per file
      allowedMimeTypes: ['image/png', 'image/webp'],
    });

    if (error) {
      console.error('[Storage] Failed to create bucket:', error);
      return false;
    }

    console.log('[Storage] Created bucket:', BUCKET_NAME);
  }

  return true;
}
