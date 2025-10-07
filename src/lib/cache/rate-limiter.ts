/**
 * Token Bucket Rate Limiter
 * Implements rate limiting for API calls
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number; // tokens per second
}

export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();

  /**
   * Check if request is allowed and consume token
   */
  async tryConsume(key: string, tokens: number = 1, config?: {
    capacity?: number;
    refillRate?: number;
  }): Promise<boolean> {
    const capacity = config?.capacity ?? 180; // Default: 180 requests
    const refillRate = config?.refillRate ?? 3; // Default: 3 per second (180/min)

    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: capacity,
        lastRefill: Date.now(),
        capacity,
        refillRate,
      };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time passed
    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * bucket.refillRate;

    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if we have enough tokens
    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens for a key
   */
  getRemaining(key: string): number {
    const bucket = this.buckets.get(key);
    return bucket ? Math.floor(bucket.tokens) : 0;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.buckets.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configs
export const RATE_LIMITS = {
  AODP: {
    capacity: 180,
    refillRate: 3, // 180 per minute
  },
  GAMEINFO: {
    capacity: 300,
    refillRate: 5, // 300 per minute
  },
  DEFAULT: {
    capacity: 60,
    refillRate: 1, // 60 per minute
  },
} as const;
