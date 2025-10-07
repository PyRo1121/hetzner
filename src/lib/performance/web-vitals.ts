/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 */

import type { Metric } from 'web-vitals';

interface AnalyticsEvent {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: AnalyticsEvent) {
  // Send to your analytics endpoint
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const body = JSON.stringify(metric);
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    // Fallback to fetch
    fetch('/api/analytics/vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(console.error);
  }
}

/**
 * Get rating for metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    case 'INP':
      return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    default:
      return 'good';
  }
}

/**
 * Report Web Vital metric
 */
export function reportWebVitals(metric: Metric) {
  const analyticsEvent: AnalyticsEvent = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
  };

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: Math.round(metric.value),
      rating: analyticsEvent.rating,
    });
  }

  // Send to analytics
  sendToAnalytics(analyticsEvent);
}

/**
 * Initialize Web Vitals tracking
 */
export async function initWebVitals() {
  if (typeof window === 'undefined') {return;}

  try {
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    onCLS(reportWebVitals);
    onFCP(reportWebVitals);
    onLCP(reportWebVitals);
    onTTFB(reportWebVitals);
    onINP(reportWebVitals);
  } catch (error) {
    console.error('Failed to load web-vitals:', error);
  }
}

/**
 * Performance observer for custom metrics
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * Start timing a custom metric
   */
  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  /**
   * End timing and report metric
   */
  measure(name: string): number | null {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${Math.round(duration)}ms`);
    }

    // Send to analytics
    sendToAnalytics({
      name: `custom_${name}`,
      value: duration,
      rating: duration < 1000 ? 'good' : duration < 3000 ? 'needs-improvement' : 'poor',
      delta: duration,
      id: `${name}_${Date.now()}`,
    });

    return duration;
  }

  /**
   * Measure async operation
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.mark(name);
    try {
      const result = await fn();
      this.measure(name);
      return result;
    } catch (error) {
      this.marks.delete(name);
      throw error;
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
