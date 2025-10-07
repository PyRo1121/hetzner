/**
 * Redis Cache Wrapper
 * Provides caching with fallback to memory cache
 */

import { memoryCache } from './memory-cache';
import { getRedisClient, isRedisAvailable, REDIS_TTL } from './redis-client';

/**
 * Set cache entry with TTL
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = REDIS_TTL.STANDARD
): Promise<void> {
  try {
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      await redis.setex(key, ttl, JSON.stringify(data));
    } else {
      // Fallback to memory cache (convert seconds to milliseconds)
      memoryCache.set(key, data, ttl * 1000);
    }
  } catch (error) {
    console.error('Cache set error:', error);
    // Fallback to memory cache on Redis error
    memoryCache.set(key, data, ttl * 1000);
  }
}

/**
 * Get cache entry
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      // Fallback to memory cache
      return memoryCache.get<T>(key);
    }
  } catch (error) {
    console.error('Cache get error:', error);
    // Fallback to memory cache on Redis error
    return memoryCache.get<T>(key);
  }
}

/**
 * Delete cache entry
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    console.error('Cache delete error:', error);
    memoryCache.delete(key);
  }
}

/**
 * Clear all cache (use with caution)
 */
export async function clearCache(pattern?: string): Promise<void> {
  try {
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      if (pattern) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        await redis.flushdb();
      }
    } else {
      memoryCache.clear();
    }
  } catch (error) {
    console.error('Cache clear error:', error);
    memoryCache.clear();
  }
}

/**
 * Check if key exists
 */
export async function hasCache(key: string): Promise<boolean> {
  try {
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      const exists = await redis.exists(key);
      return exists === 1;
    } else {
      return memoryCache.has(key);
    }
  } catch (error) {
    console.error('Cache exists error:', error);
    return memoryCache.has(key);
  }
}

// Export TTL constants
export { REDIS_TTL as CACHE_TTL };
