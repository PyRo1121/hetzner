/**
 * Redis Cache Wrapper (Client)
 * Client-side variant uses in-memory cache only.
 */

import { memoryCache } from './memory-cache';
import { REDIS_TTL } from './redis-client';

export async function setCache<T>(key: string, data: T, ttl: number = REDIS_TTL.STANDARD): Promise<void> {
  // Convert seconds to milliseconds
  memoryCache.set(key, data, ttl * 1000);
}

export async function getCache<T>(key: string): Promise<T | null> {
  return memoryCache.get<T>(key);
}

export async function deleteCache(key: string): Promise<void> {
  memoryCache.delete(key);
}

export async function clearCache(pattern?: string): Promise<void> {
  // Client memory cache clear ignores pattern
  void pattern;
  memoryCache.clear();
}

export async function hasCache(key: string): Promise<boolean> {
  return memoryCache.has(key);
}

export { REDIS_TTL as CACHE_TTL } from './redis-client';