/**
 * Client-side instrumentation for performance monitoring
 * Tracks Web Vitals, navigation timing, and custom metrics
 */

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performance.mark('app-init');
}

// Track navigation events
export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse'
) {
  const timestamp = Date.now();
  performance.mark(`nav-start-${timestamp}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Navigation] ${navigationType} to ${url}`);
  }
}

// Track Web Vitals
export function reportWebVitals(metric: any) {
  const { name, value, rating, id } = metric;
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${name}:`, {
      value: Math.round(value),
      rating,
      id,
    });
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Custom Next.js metrics
    switch (name) {
      case 'Next.js-hydration':
        // Track hydration time
        break;
      case 'Next.js-route-change-to-render':
        // Track route change performance
        break;
      case 'Next.js-render':
        // Track render time
        break;
      default:
        // Core Web Vitals (CLS, FID, FCP, LCP, TTFB, INP)
        break;
    }
    
    // Send to your analytics service
    // Example: analytics.track('web-vital', { name, value, rating });
  }
}

// Monitor long tasks
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('[Long Task]', {
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Long task API not supported
  }
}

// Track errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', {
      message: event.error?.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
    });
    
    // Send to error tracking service
    // Example: Sentry.captureException(event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', {
      reason: event.reason,
    });
    
    // Send to error tracking service
  });
}
