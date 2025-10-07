/**
 * Render Service API Client
 * Documentation: https://wiki.albiononline.com/wiki/API:Render_service
 * Base URL: https://render.albiononline.com/v1/
 * Provides game icons and images
 * 
 * Features:
 * - Exponential backoff for retries
 * - Icon URL caching with TTL
 * - Fallback to default icons
 * - Timeout configurations
 */

const BASE_URL = 'https://render.albiononline.com/v1';
const DEFAULT_ICON_URL = '/images/default-item.png'; // Fallback icon
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export type Quality = 1 | 2 | 3 | 4 | 5;
export type Enchantment = 0 | 1 | 2 | 3 | 4;

interface CachedUrl {
  url: string;
  timestamp: number;
}

/**
 * Render Service API Client with caching and error handling
 */
export class RenderClient {
  private baseUrl: string;
  private urlCache: Map<string, CachedUrl> = new Map();
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

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
   * Check if URL is cached and valid
   */
  private getCachedUrl(key: string): string | null {
    const cached = this.urlCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.url;
    }
    return null;
  }

  /**
   * Cache URL with timestamp
   */
  private cacheUrl(key: string, url: string): void {
    this.urlCache.set(key, {
      url,
      timestamp: Date.now(),
    });
  }

  /**
   * Verify URL is accessible with retries
   */
  private async verifyUrl(url: string): Promise<boolean> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (response.ok) {
          return true;
        }
        
        if (attempt < this.maxRetries - 1) {
          await this.delay(attempt);
        }
      } catch (_error) {
        if (attempt < this.maxRetries - 1) {
          await this.delay(attempt);
        } else {
          console.warn(`Failed to verify URL after ${this.maxRetries} attempts:`, url);
          return false;
        }
      }
    }
    return false;
  }

  /**
   * Get item icon URL with caching
   * @param itemId - Item ID
   * @param options - Rendering options
   */
  getItemIconUrl(
    itemId: string,
    options?: {
      quality?: Quality;
      enchantment?: Enchantment;
      size?: number;
      useCache?: boolean;
    }
  ): string {
    const cacheKey = `item-${itemId}-${options?.quality ?? 1}-${options?.enchantment ?? 0}-${options?.size ?? 217}`;
    
    // Check cache if enabled
    if (options?.useCache !== false) {
      const cached = this.getCachedUrl(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const params = new URLSearchParams();
    if (options?.quality) {params.append('quality', options.quality.toString());}
    if (options?.enchantment) {params.append('enchantment', options.enchantment.toString());}
    if (options?.size) {params.append('size', options.size.toString());}

    const url = `${this.baseUrl}/item/${itemId}.png${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    
    // Cache the URL
    this.cacheUrl(cacheKey, url);
    
    return url;
  }

  /**
   * Get item icon URL with fallback
   * Verifies URL is accessible, returns default if not
   */
  async getItemIconUrlSafe(
    itemId: string,
    options?: {
      quality?: Quality;
      enchantment?: Enchantment;
      size?: number;
    }
  ): Promise<string> {
    const url = this.getItemIconUrl(itemId, options);
    const isValid = await this.verifyUrl(url);
    return isValid ? url : DEFAULT_ICON_URL;
  }

  /**
   * Get spell icon URL
   * @param spellId - Spell ID
   */
  getSpellIconUrl(spellId: string): string {
    return `${this.baseUrl}/spell/${spellId}.png`;
  }

  /**
   * Get guild icon URL
   * @param guildId - Guild ID
   * @param options - Rendering options
   */
  getGuildIconUrl(
    guildId: string,
    options?: {
      size?: number;
      format?: 'svg' | 'png';
    }
  ): string {
    const params = new URLSearchParams();
    if (options?.size) {params.append('size', options.size.toString());}
    if (options?.format) {params.append('format', options.format);}

    return `${this.baseUrl}/guild/${guildId}.${options?.format ?? 'png'}${
      params.toString() ? `?${params.toString()}` : ''
    }`;
  }

  /**
   * Get destiny board node icon URL
   * @param nodeId - Node ID
   */
  getDestinyBoardNodeUrl(nodeId: string): string {
    return `${this.baseUrl}/destinyboard/${nodeId}.png`;
  }
}

// Export singleton instance
export const renderClient = new RenderClient();
