// lib/performance/monitor.ts
// Extreme Performance Monitoring (October 2025)
// Real-time metrics for sub-1-second dashboard optimization

export interface PerformanceMetrics {
  // Core Web Vitals
  ttfb: number;        // Time to First Byte
  fcp: number;         // First Contentful Paint
  lcp: number;         // Largest Contentful Paint
  cls: number;         // Cumulative Layout Shift
  fid: number;         // First Input Delay
  inp: number;         // Interaction to Next Paint

  // Custom metrics
  apiResponseTime: number;
  wasmProcessingTime: number;
  cacheHitRate: number;
  bundleLoadTime: number;
  realtimeLatency: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private targets = {
    ttfb: 100,   // < 100ms
    fcp: 500,    // < 500ms
    lcp: 800,    // < 800ms
    cls: 0.1,    // < 0.1
    fid: 100,    // < 100ms
    inp: 200,    // < 200ms
  };

  constructor() {
    this.initializeObservers();
  }

  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.observers.forEach(observer => observer.observe({ entryTypes: observer.takeRecords().map(() => '') }));

    // Start custom metric collection
    this.startCustomMonitoring();

    if (__PERFORMANCE_MONITORING__) {
      console.log('🚀 Extreme Performance Monitoring Started (October 2025)');
    }
  }

  stop(): void {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
  }

  private initializeObservers(): void {
    // Core Web Vitals Observer
    const webVitalsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordWebVital(entry);
        this.checkPerformanceTargets(entry);
      }
    });

    // Navigation Timing Observer
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
        }
      }
    });

    // Resource Timing Observer
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('/api/')) {
          this.recordApiMetrics(entry as PerformanceResourceTiming);
        }
      }
    });

    this.observers = [webVitalsObserver, navigationObserver, resourceObserver];
  }

  private recordWebVital(entry: PerformanceEntry): void {
    const metricName = entry.name.toLowerCase();

    if (metricName.includes('first-contentful-paint')) {
      this.recordMetric('fcp', entry.startTime);
    } else if (metricName.includes('largest-contentful-paint')) {
      this.recordMetric('lcp', entry.startTime);
    } else if (metricName.includes('first-input')) {
      const fidEntry = entry as any;
      this.recordMetric('fid', fidEntry.processingStart - entry.startTime);
    } else if (metricName.includes('layout-shift')) {
      const clsEntry = entry as any;
      this.recordMetric('cls', clsEntry.value);
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    this.recordMetric('ttfb', entry.responseStart - entry.requestStart);
    this.recordMetric('domContentLoaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
    this.recordMetric('loadComplete', entry.loadEventEnd - entry.loadEventStart);
  }

  private recordApiMetrics(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.requestStart;
    this.recordMetric('apiResponseTime', duration);

    // Alert on slow API calls
    if (duration > 500 && __PERFORMANCE_MONITORING__) {
      console.warn(`🐌 Slow API call: ${entry.name} took ${duration.toFixed(0)}ms`);
    }
  }

  // Public method to record metrics
  public recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }

    // Real-time alerting
    this.checkPerformanceTargets({ name, startTime: value } as PerformanceEntry);
  }

  private checkPerformanceTargets(entry: PerformanceEntry): void {
    const metricName = entry.name.toLowerCase();
    const value = entry.startTime;
    const target = (this.targets as any)[metricName];

    if (target && value > target) {
      this.alertSlowPerformance(metricName, value, target);
    }
  }

  private alertSlowPerformance(metric: string, actual: number, target: number): void {
    const alert = `🚨 Performance Alert: ${metric.toUpperCase()} is ${actual.toFixed(0)}ms (target: ${target}ms)`;

    if (__PERFORMANCE_MONITORING__) {
      console.warn(alert);

      // Send to monitoring service
      this.sendAlertToMonitoring({
        metric,
        actual,
        target,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    }
  }

  private startCustomMonitoring(): void {
    // Monitor bundle load time
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordMetric('bundleLoadTime', navigation.loadEventEnd - navigation.fetchStart);
      }
    }

    // Monitor WebSocket latency
    this.monitorWebSocketLatency();

    // Monitor cache hit rate
    this.monitorCacheHitRate();

    // Monitor WASM processing time
    this.monitorWasmPerformance();
  }

  private monitorWebSocketLatency(): void {
    // Monitor real-time data latency
    const checkLatency = () => {
      const start = performance.now();

      // Send ping through WebSocket
      if ((window as any).albionWebSocket) {
        (window as any).albionWebSocket.send(JSON.stringify({ type: 'ping', timestamp: start }));

        // Measure response time
        const originalOnMessage = (window as any).albionWebSocket.onmessage;
        (window as any).albionWebSocket.onmessage = (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            const latency = performance.now() - start;
            this.recordMetric('realtimeLatency', latency);
          }
          originalOnMessage?.(event);
        };
      }
    };

    // Check every 30 seconds
    setInterval(checkLatency, 30000);
  }

  private monitorCacheHitRate(): void {
    // Monitor browser cache hits
    let cacheHits = 0;
    let totalRequests = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('/api/')) {
          totalRequests++;
          const resourceEntry = entry as PerformanceResourceTiming;

          // Check if served from cache
          if (resourceEntry.transferSize === 0) {
            cacheHits++;
          }

          if (totalRequests >= 10) {
            const hitRate = (cacheHits / totalRequests) * 100;
            this.recordMetric('cacheHitRate', hitRate);
            cacheHits = 0;
            totalRequests = 0;
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private monitorWasmPerformance(): void {
    // Monitor WebAssembly processing time
    if ((window as any).wasmPerformanceMarks) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('wasm-')) {
            this.recordMetric('wasmProcessingTime', entry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
    }
  }

  private async sendAlertToMonitoring(data: any): Promise<void> {
    try {
      await fetch('/api/performance-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }

  // Public API
  getMetrics(): Record<string, { average: number; latest: number; count: number }> {
    const result: Record<string, { average: number; latest: number; count: number }> = {};

    for (const [name, values] of this.metrics.entries()) {
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const latest = values[values.length - 1];

      result[name] = {
        average,
        latest,
        count: values.length,
      };
    }

    return result;
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;

    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  isPerformanceHealthy(): boolean {
    const metrics = this.getMetrics();

    return (
      metrics.fcp?.average < 500 &&
      metrics.lcp?.average < 800 &&
      metrics.cls?.average < 0.1 &&
      metrics.apiResponseTime?.average < 200
    );
  }
}

// Global performance monitor instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
    performanceMonitorInstance.start();
  }
  return performanceMonitorInstance;
};

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = getPerformanceMonitor();
  const [metrics, setMetrics] = React.useState(monitor.getMetrics());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    isHealthy: monitor.isPerformanceHealthy(),
    averageApiResponseTime: monitor.getAverageMetric('apiResponseTime'),
    averageFcp: monitor.getAverageMetric('fcp'),
  };
};
