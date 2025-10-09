// cache-handler.cjs
// Next.js 15 Redis Cache Handler for Kubernetes Horizontal Scaling
// Based on: https://dev.to/rafalsz/scaling-nextjs-with-redis-cache-handler-55lh
// Research: https://www.sherpa.sh/blog/secrets-of-self-hosting-nextjs-at-scale-in-2025

const { createClient } = require('redis');
const { CacheHandler } = require('@neshca/cache-handler');
const createLruCache = require('@neshca/cache-handler/local-lru').default;
const createRedisCache = require('@neshca/cache-handler/redis-strings').default;

CacheHandler.onCreation(async () => {
  // L1 Cache: In-memory LRU (fast, local to each pod)
  const localCache = createLruCache({
    maxItemsNumber: 10000,
    maxItemSizeBytes: 1024 * 1024 * 250, // 250 MB per pod
  });

  let redisCache;
  let isReady = false;

  if (!process.env.REDIS_URL) {
    console.warn('⚠️  REDIS_URL not set, using local cache only');
  } else {
    try {
      // Create Redis client with reconnection strategy
      const client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          // Only reconnect if we've successfully connected before
          reconnectStrategy: () => (isReady ? 5000 : false),
        },
      });

      // Error handling
      client.on('error', (error) => {
        console.error('❌ Redis error:', error.message);
      });

      // Track when Redis is ready
      client.on('ready', () => {
        isReady = true;
        console.log('✅ Redis cache handler connected');
      });

      // Connect to Redis
      await client.connect();

      // L2 Cache: Redis (shared across all pods)
      redisCache = createRedisCache({
        client,
        keyPrefix: `next-cache-${process.env.NEXT_PUBLIC_BUILD_NUMBER || 'v1'}:`,
        // Timeout for Redis operations (fallback to LRU if Redis is slow)
        timeoutMs: 5000,
      });

      console.log('✅ Redis cache handler initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Redis cache:', error.message);
      console.log('⚠️  Falling back to local LRU cache only');
    }
  }

  return {
    // Handler priority: Redis first, then LRU fallback
    handlers: redisCache ? [redisCache, localCache] : [localCache],
    ttl: {
      // Default cache time (also used for ISR revalidation)
      defaultStaleAge: parseInt(process.env.NEXT_PUBLIC_CACHE_IN_SECONDS || '3600'),
      // Prevent infinite storage in Redis
      estimateExpireAge: (staleAge) => staleAge * 2,
    },
  };
});

module.exports = CacheHandler;
