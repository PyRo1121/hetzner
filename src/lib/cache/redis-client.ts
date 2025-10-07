/**
 * Redis Client (redis.com)
 * Production-ready caching and rate limiting
 *
 * Important: Avoid importing Node-only modules in client bundles.
 * We lazily import `ioredis` only on the server at runtime.
 */

type RedisClient = {
  setex: (key: string, ttl: number, value: string) => Promise<any>;
  get: (key: string) => Promise<string | null>;
  del: (...keys: string[]) => Promise<any>;
  keys: (pattern: string) => Promise<string[]>;
  flushdb: () => Promise<any>;
  exists: (key: string) => Promise<number>;
  quit: () => Promise<void>;
  on: (event: string, listener: (arg?: any) => void) => void;
};

let redis: RedisClient | null = null;

const isServer = typeof window === 'undefined';

/**
 * Get or create Redis client (server-only)
 */
export async function getRedisClient(): Promise<RedisClient> {
  if (!isServer) {
    throw new Error('Redis client is only available on the server');
  }

  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('REDIS_URL not configured, using in-memory cache fallback');
    throw new Error('Redis not configured');
  }

  const { default: IORedis } = await import('ioredis');

  const client: any = new IORedis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err: Error) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  client.on('error', (err: any) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.info('✅ Connected to Redis');
  });

  client.on('ready', () => {
    console.info('✅ Redis client ready');
  });

  client.on('close', () => {
    console.warn('⚠️ Redis connection closed');
  });

  redis = client as RedisClient;
  return redis;
}

/**
 * Check if Redis is available (server-only)
 */
export function isRedisAvailable(): boolean {
  return isServer && !!process.env.REDIS_URL;
}

/**
 * Disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

// Adaptive TTLs (in seconds)
export const REDIS_TTL = {
  VOLATILE: 5 * 60, // 5 minutes - for prices
  STANDARD: 15 * 60, // 15 minutes - for general data
  STABLE: 60 * 60, // 1 hour - for item metadata
  LONG: 24 * 60 * 60, // 24 hours - for static data
} as const;
