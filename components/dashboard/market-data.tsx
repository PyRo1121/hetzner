// components/dashboard/market-data.tsx
// Extreme Performance Market Data Component (October 2025)
// Updated with Dual CDN, Analytics, and Security Integration

'use client';

import React, { useEffect, useMemo, useState, memo } from 'react';
import { getWasmEngine, WasmMarketEngine } from '@/lib/wasm/market-engine';
import { useRealTimeData } from '@/lib/realtime/engine';
import { usePerformanceMonitor } from '@/lib/performance/monitor';
import { OptimizedImage, ItemIcon, useCDN } from '@/lib/cdn/dual-cdn';
import { useSecureFetch } from '@/lib/security/enterprise-security';

interface MarketItem {
  id: string;
  name: string;
  prices: number[];
  lastUpdate: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  change: number;
  volatility: number;
  itemIcon?: string;
}

// Memoized individual market row with Dual CDN images
const MarketRow = memo(function MarketRow({
  item,
  isVisible
}: {
  item: MarketItem;
  isVisible: boolean;
}) {
  const { getMetrics } = useCDN();
  const secureFetch = useSecureFetch();

  // Only render if visible (intersection observer)
  if (!isVisible) {
    return <tr style={{ height: '40px' }} />; // Placeholder
  }

  const priceColor = item.change > 0 ? 'text-green-600' :
                     item.change < 0 ? 'text-red-600' : 'text-gray-600';

  const trendIcon = item.trend === 'bullish' ? '📈' :
                   item.trend === 'bearish' ? '📉' : '➡️';

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Dual CDN optimized item icon */}
          <ItemIcon
            itemId={item.id}
            size={32}
            showTooltip={true}
            className="flex-shrink-0"
          />
          <span className="font-medium truncate max-w-[200px]" title={item.name}>
            {item.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-2 text-right font-mono">
        {item.prices[item.prices.length - 1]?.toLocaleString() || 'N/A'}
      </td>
      <td className={`px-4 py-2 text-right font-mono ${priceColor}`}>
        {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%
      </td>
      <td className="px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="text-lg">{trendIcon}</span>
          <span className="text-xs text-gray-500">
            {item.volatility.toFixed(1)}
          </span>
        </div>
      </td>
      <td className="px-4 py-2 text-right text-xs text-gray-500">
        <span title={new Date(item.lastUpdate).toLocaleString()}>
          {new Date(item.lastUpdate).toLocaleTimeString()}
        </span>
      </td>
    </tr>
  );
});

MarketRow.displayName = 'MarketRow';

export const MarketData: React.FC<{
  initialData?: MarketItem[];
  className?: string;
  enableAnalytics?: boolean;
  enableSecurity?: boolean;
}> = memo(function MarketData({
  initialData = [],
  className = '',
  enableAnalytics = true,
  enableSecurity = true
}) {
  const [marketData, setMarketData] = useState<MarketItem[]>(initialData);
  const [wasmEngine, setWasmEngine] = useState<WasmMarketEngine | null>(null);
  const [visibleRows, setVisibleRows] = useState<Set<number>>(new Set());
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);

  const { isHealthy } = usePerformanceMonitor();
  const { getDualCDNUrls } = useCDN();
  const secureFetch = useSecureFetch();

  // Real-time data subscription
  const { data: realtimeData, isConnected } = useRealTimeData('market');

  // Initialize WebAssembly engine
  useEffect(() => {
    let mounted = true;

    getWasmEngine().then(engine => {
      if (mounted) {
        setWasmEngine(engine);
      }
    });

    return () => { mounted = false; };
  }, []);

  // Load analytics data
  useEffect(() => {
    if (!enableAnalytics) return;

    const loadAnalytics = async () => {
      try {
        const response = await secureFetch('/api/analytics/market/realtime');
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.warn('Failed to load market analytics:', error);
      }
    };

    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [enableAnalytics, secureFetch]);

  // Load security metrics
  useEffect(() => {
    if (!enableSecurity) return;

    const loadSecurityMetrics = async () => {
      try {
        const response = await secureFetch('/api/security/metrics');
        const data = await response.json();
        setSecurityMetrics(data);
      } catch (error) {
        console.warn('Failed to load security metrics:', error);
      }
    };

    loadSecurityMetrics();
    const interval = setInterval(loadSecurityMetrics, 60000); // Every minute
    return () => clearInterval(interval);
  }, [enableSecurity, secureFetch]);

  // Process real-time market data with WebAssembly
  useEffect(() => {
    if (!realtimeData.length || !wasmEngine) return;

    const processStart = performance.now();

    // Batch process with WebAssembly SIMD
    const processedData = realtimeData.map((item: any) => {
      const prices = item.prices || [];
      const changes = wasmEngine.calculatePriceMovements(prices);

      return {
        id: item.id,
        name: item.name || item.id,
        prices,
        lastUpdate: item.timestamp || Date.now(),
        trend: calculateTrend(changes),
        change: changes[changes.length - 1] || 0,
        volatility: calculateVolatility(changes),
        itemIcon: item.icon
      };
    });

    // Performance monitoring
    if (__PERFORMANCE_MONITORING__) {
      performance.measure('wasm-market-processing',
        { start: processStart, end: performance.now() });
    }

    setMarketData(prev => {
      // Merge with existing data using efficient Map operations
      const merged = new Map(prev.map(item => [item.id, item]));

      processedData.forEach(item => {
        merged.set(item.id, item);
      });

      return Array.from(merged.values());
    });
  }, [realtimeData, wasmEngine]);

  // Intersection Observer for virtual scrolling (extreme performance)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = new Set<number>();

        entries.forEach(entry => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          if (entry.isIntersecting) {
            visible.add(index);
          }
        });

        setVisibleRows(visible);
      },
      {
        rootMargin: '100px', // Preload more aggressively
        threshold: 0.1,
      }
    );

    // Observe all rows with efficient cleanup
    const rowElements = document.querySelectorAll('[data-index]');
    rowElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [marketData.length]);

  // Sort data by change percentage with analytics weighting
  const sortedData = useMemo(() => {
    let data = [...marketData];

    // Apply analytics-based sorting if available
    if (analyticsData?.topMovers) {
      const moverIds = new Set(analyticsData.topMovers.map((m: any) => m.itemId));
      data.sort((a, b) => {
        const aIsTop = moverIds.has(a.id) ? 1 : 0;
        const bIsTop = moverIds.has(b.id) ? 1 : 0;

        if (aIsTop !== bIsTop) return bIsTop - aIsTop;
        return Math.abs(b.change) - Math.abs(a.change);
      });
    } else {
      // Fallback to volatility sorting
      data.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }

    return data;
  }, [marketData, analyticsData]);

  // Performance and security indicators
  const statusIndicators = (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Real-time Connected' : 'Real-time Offline'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          isHealthy ? 'bg-green-500' : 'bg-orange-500'
        }`} />
        <span className="text-sm text-gray-600">
          {isHealthy ? 'Performance Optimal' : 'Performance Issues'}
        </span>
      </div>

      {securityMetrics && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            securityMetrics.waf.blockedRequests < 10 ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600">
            Security: {securityMetrics.waf.blockedRequests} threats blocked
          </span>
        </div>
      )}

      {analyticsData && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">
            Analytics: {analyticsData.totalItems?.toLocaleString() || 0} items tracked
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className={`market-data-container ${className}`}>
      {statusIndicators}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold">Item</th>
              <th className="px-4 py-3 text-right font-semibold">Price</th>
              <th className="px-4 py-3 text-right font-semibold">Change</th>
              <th className="px-4 py-3 text-center font-semibold">Trend</th>
              <th className="px-4 py-3 text-right font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <MarketRow
                key={item.id}
                item={item}
                isVisible={visibleRows.has(index)}
                data-index={index}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance metrics (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-50 rounded text-xs font-mono space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>Items: {marketData.length}</div>
            <div>Visible: {visibleRows.size}</div>
            <div>WebAssembly: {wasmEngine ? 'Enabled' : 'Disabled'}</div>
            <div>Real-time: {isConnected ? 'Connected' : 'Disconnected'}</div>
            <div>CDN: {getDualCDNUrls ? 'Dual Available' : 'Single CDN'}</div>
            <div>Analytics: {analyticsData ? 'Loaded' : 'Disabled'}</div>
            <div>Security: {securityMetrics ? 'Active' : 'Disabled'}</div>
            <div>Performance: {isHealthy ? 'Healthy' : 'Issues'}</div>
          </div>
        </div>
      )}
    </div>
  );
});

MarketData.displayName = 'MarketData';

// Utility functions
function calculateTrend(changes: Float32Array): 'bullish' | 'bearish' | 'neutral' {
  if (changes.length === 0) return 'neutral';

  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  if (avgChange > 0.5) return 'bullish';
  if (avgChange < -0.5) return 'bearish';
  return 'neutral';
}

function calculateVolatility(changes: Float32Array): number {
  if (changes.length === 0) return 0;

  const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
  return Math.sqrt(variance);
}
