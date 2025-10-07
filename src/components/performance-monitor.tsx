'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const metric = entry as PerformanceEntry & {
          value?: number;
          rating?: string;
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${entry.name}:`, {
            value: metric.value,
            rating: metric.rating,
            entryType: entry.entryType,
          });
        }

        // Send to analytics in production
        if (process.env.NODE_ENV === 'production' && metric.value) {
          // You can send to your analytics service here
          // Example: analytics.track('web-vital', { name: entry.name, value: metric.value });
        }
      }
    });

    // Observe different performance metrics
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Browser doesn't support all entry types
      console.warn('[Performance] Some metrics not supported:', e);
    }

    return () => observer.disconnect();
  }, []);

  return null; // This component doesn't render anything
}
