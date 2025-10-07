// lib/cdn/dual-cdn.tsx
// Dual CDN Manager (October 2025)
// Intelligent CDN selection with OVH + Cloudflare failover

'use client';

import React, { useState, useEffect, useMemo } from 'react';

export interface CDNConfig {
  cloudflare: {
    baseUrl: string;
    token?: string;
  };
  ovh: {
    baseUrl: string;
    token?: string;
  };
}

export interface CDNImageOptions {
  size?: number;
  quality?: number;
  format?: 'png' | 'webp' | 'avif';
  fallback?: boolean;
}

class DualCDNManager {
  private config: CDNConfig;
  private cache = new Map<string, { url: string; cdn: 'cloudflare' | 'ovh'; timestamp: number }>();
  private userLocation: string | null = null;

  constructor(config: CDNConfig) {
    this.config = config;
    this.detectUserLocation();
  }

  private async detectUserLocation(): Promise<void> {
    try {
      // Use Cloudflare's geolocation API or similar
      const response = await fetch('/api/geo');
      const data = await response.json();
      this.userLocation = data.country;
    } catch (error) {
      // Fallback to navigator.language
      this.userLocation = navigator.language.split('-')[1] || 'US';
    }
  }

  // Intelligent CDN selection based on user location and performance
  getOptimalCDN(): 'cloudflare' | 'ovh' {
    if (!this.userLocation) return 'cloudflare'; // Default

    // European users get OVH (better performance from EU)
    const europeanCountries = ['DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'BA', 'RS', 'ME', 'MK', 'AL', 'GR', 'BG', 'RO', 'MD', 'UA', 'BY', 'LT', 'LV', 'EE'];

    return europeanCountries.includes(this.userLocation) ? 'ovh' : 'cloudflare';
  }

  // Get optimized image URL with CDN selection
  getImageUrl(imageId: string, options: CDNImageOptions = {}): string {
    const { size = 64, quality = 80, format = 'webp' } = options;

    // Check cache first
    const cacheKey = `${imageId}-${size}-${quality}-${format}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.url;
    }

    // Select optimal CDN
    const cdn = this.getOptimalCDN();
    const baseUrl = this.config[cdn].baseUrl;

    // Construct optimized URL
    const url = `${baseUrl}/items/${imageId}_${size}x${size}_q${quality}.${format}`;

    // Cache result
    this.cache.set(cacheKey, { url, cdn, timestamp: Date.now() });

    return url;
  }

  // Get dual CDN URLs for failover
  getDualCDNUrls(imageId: string, options: CDNImageOptions = {}): { primary: string; secondary: string } {
    const primaryCDN = this.getOptimalCDN();
    const secondaryCDN = primaryCDN === 'cloudflare' ? 'ovh' : 'cloudflare';

    const primaryUrl = this.getImageUrl(imageId, { ...options, fallback: false });
    const secondaryUrl = this.getImageUrl(imageId, { ...options, fallback: true });

    return {
      primary: primaryUrl.replace(this.config[primaryCDN].baseUrl, this.config[primaryCDN].baseUrl),
      secondary: secondaryUrl.replace(this.config[secondaryCDN].baseUrl, this.config[secondaryCDN].baseUrl)
    };
  }

  // Preload critical images
  async preloadCriticalImages(imageIds: string[]): Promise<void> {
    const promises = imageIds.map(async (id) => {
      const url = this.getImageUrl(id);
      try {
        const response = await fetch(url, { priority: 'low' });
        if (response.ok) {
          // Image preloaded successfully
          return { id, success: true };
        }
      } catch (error) {
        console.warn(`Failed to preload image ${id}:`, error);
      }
      return { id, success: false };
    });

    await Promise.allSettled(promises);
  }

  // Performance monitoring
  getPerformanceMetrics() {
    return {
      cacheHitRate: this.cache.size > 0 ? (this.cache.size / (this.cache.size + 10)) * 100 : 0,
      userLocation: this.userLocation,
      preferredCDN: this.getOptimalCDN()
    };
  }
}

// Global CDN manager instance
let cdnManagerInstance: DualCDNManager | null = null;

export const getCDNManager = (config?: CDNConfig): DualCDNManager => {
  if (!cdnManagerInstance) {
    const defaultConfig: CDNConfig = {
      cloudflare: {
        baseUrl: 'https://cdn.albiononline.com',
        token: process.env.NEXT_PUBLIC_CLOUDFLARE_TOKEN
      },
      ovh: {
        baseUrl: 'https://cdn.ovh.albiononline.com',
        token: process.env.NEXT_PUBLIC_OVH_TOKEN
      }
    };

    cdnManagerInstance = new DualCDNManager(config || defaultConfig);
  }
  return cdnManagerInstance;
};

// React hook for CDN management
export const useCDN = () => {
  const [manager] = useState(() => getCDNManager());

  return {
    getImageUrl: (imageId: string, options?: CDNImageOptions) => manager.getImageUrl(imageId, options),
    getDualCDNUrls: (imageId: string, options?: CDNImageOptions) => manager.getDualCDNUrls(imageId, options),
    preloadImages: (imageIds: string[]) => manager.preloadCriticalImages(imageIds),
    getMetrics: () => manager.getPerformanceMetrics()
  };
};

// Optimized Image Component with Dual CDN
interface OptimizedImageProps {
  itemId: string;
  size?: number;
  quality?: number;
  format?: 'png' | 'webp' | 'avif';
  alt?: string;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  itemId,
  size = 64,
  quality = 80,
  format = 'webp',
  alt = 'Item',
  className = '',
  priority = false,
  lazy = true
}) => {
  const { getDualCDNUrls } = useCDN();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const { primary, secondary } = getDualCDNUrls(itemId, { size, quality, format });
    setImageSrc(primary);

    // Preload secondary for failover
    const img = new Image();
    img.src = secondary;
  }, [itemId, size, quality, format, getDualCDNUrls]);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    if (!hasError) {
      // Try secondary CDN
      const { secondary } = getDualCDNUrls(itemId, { size, quality, format });
      setImageSrc(secondary);
      setHasError(true);
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={size}
        height={size}
        loading={lazy ? 'lazy' : 'eager'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${hasError ? 'filter grayscale' : ''}`}
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Item Icon Component with CDN optimization
interface ItemIconProps {
  itemId: string;
  size?: number;
  quality?: number;
  showTooltip?: boolean;
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = React.memo(({
  itemId,
  size = 64,
  quality = 80,
  showTooltip = false,
  className = ''
}) => {
  const [itemName, setItemName] = useState<string>('');

  // Fetch item name for tooltip (cached)
  useEffect(() => {
    const fetchItemName = async () => {
      try {
        // Check local cache first
        const cached = localStorage.getItem(`item:${itemId}`);
        if (cached) {
          setItemName(JSON.parse(cached).name);
          return;
        }

        // Fetch from API
        const response = await fetch(`/api/items/${itemId}`);
        const data = await response.json();
        setItemName(data.name);

        // Cache result
        localStorage.setItem(`item:${itemId}`, JSON.stringify({ name: data.name, timestamp: Date.now() }));
      } catch (error) {
        console.warn(`Failed to fetch item name for ${itemId}:`, error);
      }
    };

    if (showTooltip) {
      fetchItemName();
    }
  }, [itemId, showTooltip]);

  const imageElement = (
    <OptimizedImage
      itemId={itemId}
      size={size}
      quality={quality}
      alt={itemName || 'Item'}
      className={className}
    />
  );

  if (showTooltip && itemName) {
    return (
      <div className="relative group">
        {imageElement}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {itemName}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return imageElement;
});

ItemIcon.displayName = 'ItemIcon';

// CDN Performance Monitor Hook
export const useCDNPerformance = () => {
  const { getMetrics } = useCDN();
  const [metrics, setMetrics] = useState(getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [getMetrics]);

  return metrics;
};
