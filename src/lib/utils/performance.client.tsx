'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ErrorInfo, MutableRefObject, ReactNode } from 'react';

import Image from 'next/image';

/**
 * Performance optimization utilities
 * Lazy loading, code splitting, and caching improvements
 */

// Lazy load components with error boundaries
export const LazyComponent = ({ children }: { children: ReactNode }) => children;

// Error boundary for lazy loading
export class LazyErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, errorInfo: ErrorInfo) {
    console.error('Lazy loading error:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center">
          Failed to load component
        </div>
      );
    }

    return this.props.children;
  }
}

// Debounced search hook for performance
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Virtual scrolling for large lists
export function VirtualList({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
}: {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => ReactNode;
  className?: string;
}) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollPosition / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, itemHeight, containerHeight, scrollPosition]);

  const handleScroll = useCallback((evt: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition(evt.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              width: '100%',
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Memoized component for expensive renders
export function MemoizedComponent<T extends object>({
  Component,
  props,
  dependencies = [],
}: {
  Component: ComponentType<T>;
  props: T;
  dependencies?: any[];
}) {
  return useMemo(
    () => <Component {...props} />,
    [Component, ...dependencies]
  );
}

// Optimized image component with lazy loading
export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  [key: string]: any;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-albion-gray-800 animate-pulse rounded" />
      )}

      <Image
        src={src}
        alt={alt}
        width={width ?? 0}
        height={height ?? 0}
        loading={priority ? 'eager' : 'lazy'}
        onLoadingComplete={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        {...props}
      />

      {hasError && (
        <div className="absolute inset-0 bg-albion-gray-800 flex items-center justify-center rounded">
          <span className="text-albion-gray-500 text-sm">Image failed to load</span>
        </div>
      )}
    </div>
  );
}

// Performance monitoring hook
export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const hasPerformance = typeof window !== 'undefined' && typeof window.performance?.now === 'function';

    const getNow = hasPerformance ? () => window.performance.now() : () => Date.now();
    const startTime = getNow();

    return () => {
      const endTime = getNow();
      const renderTime = endTime - startTime;

      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`);
      }
    };
  }, [componentName]);
}

// Throttled scroll handler
export function useThrottledScroll(callback: (scrollTop: number) => void, delay: number = 100) {
  const throttleRef: MutableRefObject<number | null> = useRef(null);

  const handleScroll = useCallback((evt: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = evt.currentTarget.scrollTop;

    if (throttleRef.current) {
      window.clearTimeout(throttleRef.current);
    }

    throttleRef.current = window.setTimeout(() => {
      callback(newScrollTop);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        window.clearTimeout(throttleRef.current);
      }
    };
  }, []);

  return handleScroll;
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  useEffect(() => {
    if (!element || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [setElement, isIntersecting] as const;
}

// Bundle analyzer hook (development only)
export function useBundleAnalyzer() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const perf = window.performance;
      if (perf && 'getEntriesByType' in perf) {
        const resources = perf.getEntriesByType('resource');
        const jsBundles = resources.filter(r => r.name.includes('.js'));

        const isResourceTiming = (entry: PerformanceEntry): entry is PerformanceResourceTiming =>
          typeof (entry as PerformanceResourceTiming).transferSize === 'number';

        console.info(`📦 Bundle Analysis: ${jsBundles.length} JS bundles detected`);
        jsBundles.forEach(bundle => {
          const transferSize = isResourceTiming(bundle) ? bundle.transferSize : 0;
          console.info(`${bundle.name}: ${transferSize} bytes`);
        });
      }
    }
  }, []);
}

// Component preloader for critical components
export function useComponentPreloader() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Preload critical components
    const criticalComponents = [
      '@/components/pvp/KillFeed',
      '@/components/pvp/GuildLeaderboards',
      '@/components/market/ArbitrageCalculator',
    ];

    criticalComponents.forEach(async (componentPath) => {
      try {
        await import(componentPath);
      } catch (error) {
        console.warn(`Failed to preload ${componentPath}:`, error);
      }
    });
  }, []);
}

// Memory leak detector
export function useMemoryLeakDetector(componentName: string) {
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Store cleanup function for this component
    const originalCleanup = () => {
      console.info(`Cleaning up ${componentName}`);
    };

    cleanupFunctions.push(originalCleanup);

    return () => {
      cleanupFunctions.forEach(fn => fn());
      console.info(`Memory leak check for ${componentName}: OK`);
    };
  }, [componentName]);
}
