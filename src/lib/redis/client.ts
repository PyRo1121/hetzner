/**
 * Redis Client with Automatic Failover
 * Supports both development (localhost) and production (Kubernetes)
 */

import Redis from 'ioredis';

import { getRedisUrl } from '@/lib/config/production';

let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Get or create Redis client singleton
 */
export function getRedisClient(): Redis {
  if (redisClient && isConnected) {
    return redisClient;
  }

  const redisUrl = getRedisUrl();

  redisClient = new Redis(redisUrl, {
    // Retry strategy
    retryStrategy: (times) => {
      if (times > 10) {
        console.error('❌ Redis: Max retries reached, giving up');
        return null; // Stop retrying
      }

      const delay = Math.min(times * 100, 3000);
      console.warn(`⚠️  Redis: Retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },

    // Connection options
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,

    // Timeouts
    connectTimeout: 10000,
    commandTimeout: 5000,

    // Keep-alive
    keepAlive: 30000,

    // Reconnect on error
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true; // Reconnect
      }
      return false;
    },
  });

  // Event handlers
  redisClient.on('connect', () => {
    console.info('✅ Redis: Connected');
    isConnected = true;
  });

  redisClient.on('ready', () => {
    console.info('✅ Redis: Ready to accept commands');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
    isConnected = false;
  });

  redisClient.on('close', () => {
    console.warn('⚠️  Redis: Connection closed');
    isConnected = false;
  });

  redisClient.on('reconnecting', () => {
    console.info('🔄 Redis: Reconnecting...');
  });

  return redisClient;
}

/**
 * Cache wrapper with automatic fallback
 */
export class CacheService {
  private redis: Redis;
  private fallbackCache: Map<string, { value: any; expires: number }>;

  constructor() {
    this.redis = getRedisClient();
    this.fallbackCache = new Map();
  }

  /**
   * Get value from cache (Redis first, fallback to memory)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      const value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
    } catch (_error) {
      console.warn(`⚠️  Redis get failed for key ${key}, checking fallback cache`);
    }

    // Fallback to memory cache
    const cached = this.fallbackCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value as T;
    }

    return null;
  }

  /**
   * Set value in cache (Redis + memory fallback)
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const serialized = JSON.stringify(value);

    try {
      // Try Redis first
      await this.redis.setex(key, ttlSeconds, serialized);
    } catch (_error) {
      console.warn(`⚠️  Redis set failed for key ${key}, using fallback cache`);
    }

    // Always set in fallback cache
    this.fallbackCache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });

    // Clean up expired entries periodically
    if (this.fallbackCache.size > 1000) {
      this.cleanupFallbackCache();
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (_error) {
      console.warn(`⚠️  Redis del failed for key ${key}`);
    }

    this.fallbackCache.delete(key);
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (_error) {
      console.warn(`⚠️  Redis delPattern failed for pattern ${pattern}`);
    }

    // Clean fallback cache
    for (const key of this.fallbackCache.keys()) {
      if (key.match(pattern.replace('*', '.*'))) {
        this.fallbackCache.delete(key);
      }
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (_error) {
      return this.fallbackCache.has(key);
    }
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (_error) {
      const cached = this.fallbackCache.get(key);
      if (cached) {
        return Math.floor((cached.expires - Date.now()) / 1000);
      }
      return -1;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (_error) {
      const cached = this.fallbackCache.get(key);
      const current = (cached?.value as number) || 0;
      const newValue = current + 1;
      this.fallbackCache.set(key, { value: newValue, expires: Date.now() + 3600000 });
      return newValue;
    }
  }

  /**
   * Clean up expired entries from fallback cache
   */
  private cleanupFallbackCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.fallbackCache.entries()) {
      if (cached.expires < now) {
        this.fallbackCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const info = await this.redis.info('memory');
      const dbSize = await this.redis.dbsize();

      return {
        redis: {
          connected: isConnected,
          dbSize,
          memory: info,
        },
        fallback: {
          size: this.fallbackCache.size,
        },
      };
    } catch (error) {
      return {
        redis: {
          connected: false,
          error: (error as Error).message,
        },
        fallback: {
          size: this.fallbackCache.size,
        },
      };
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.info('✅ Redis: Connection closed gracefully');
  }
}
