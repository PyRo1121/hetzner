/**
 * Server Status API Client
 * Base URL: https://serverstatus.albiononline.com/
 * Provides server status and player counts
 * 
 * Features:
 * - Exponential backoff for retries
 * - Timeout configurations
 * - Status caching
 */

import { z } from 'zod';

const BASE_URL = 'https://serverstatus.albiononline.com';
const TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const CACHE_TTL = 60 * 1000; // 1 minute

// Zod schema for server status
const ServerStatusSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  players: z.object({
    online: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  timestamp: z.string().optional(),
});

export type ServerStatus = z.infer<typeof ServerStatusSchema>;

interface CachedStatus {
  data: ServerStatus;
  timestamp: number;
}

/**
 * Server Status API Client
 */
export class StatusClient {
  private baseUrl: string;
  private cache: CachedStatus | null = null;
  private maxRetries = MAX_RETRIES;
  private baseDelay = BASE_DELAY;
  private timeout = TIMEOUT_MS;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  /**
   * Exponential backoff delay
   */
  private async delay(attempt: number): Promise<void> {
    const delayMs = this.baseDelay * Math.pow(2, attempt);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) {return false;}
    return Date.now() - this.cache.timestamp < CACHE_TTL;
  }

  /**
   * Get server status with retries and caching
   */
  async getStatus(useCache = true): Promise<ServerStatus> {
    // Return cached data if valid
    if (useCache && this.isCacheValid() && this.cache) {
      return this.cache.data;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}/`, {
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Status API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const validated = ServerStatusSchema.parse(data);

        // Cache the result
        this.cache = {
          data: validated,
          timestamp: Date.now(),
        };

        return validated;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries - 1) {
          console.warn(`Status API attempt ${attempt + 1} failed, retrying...`);
          await this.delay(attempt);
        }
      }
    }

    // If all retries failed, throw the last error
    console.error(`Status API failed after ${this.maxRetries} attempts`);
    throw lastError ?? new Error('Failed to fetch server status');
  }

  /**
   * Check if server is online
   */
  async isServerOnline(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.status.toLowerCase() === 'online';
    } catch (error) {
      console.error('Error checking server status:', error);
      return false;
    }
  }

  /**
   * Get player count
   */
  async getPlayerCount(): Promise<{ online: number; max: number } | null> {
    try {
      const status = await this.getStatus();
      return (status.players as { online: number; max: number; } | null) ?? null;
    } catch (error) {
      console.error('Error getting player count:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Configure timeout
   */
  setTimeout(ms: number): void {
    this.timeout = ms;
  }

  /**
   * Configure max retries
   */
  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }
}

// Export singleton instance
export const statusClient = new StatusClient();
