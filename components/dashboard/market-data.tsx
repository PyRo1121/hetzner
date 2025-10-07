'use client';

import React, { useEffect, useMemo, useState, memo } from 'react';

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

// Simple placeholder components to replace missing imports
const ItemIcon = ({ itemId, size, className }: any) => (
  <img
    src={`https://render.albiononline.com/v1/item/${itemId}.png?size=${size}`}
    alt={itemId}
    className={className}
    width={size}
    height={size}
  />
);

// Memoized individual market row with simple image
const MarketRow = memo(function MarketRow({
  item,
  isVisible
}: {
  item: MarketItem;
  isVisible: boolean;
}) {
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
          {/* Simple item icon */}
          <ItemIcon
            itemId={item.id}
            size={32}
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
  const [visibleRows, setVisibleRows] = useState<Set<number>>(new Set());

  // Simulate real-time data updates (simplified)
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => ({
        ...item,
        change: item.change + (Math.random() - 0.5) * 2,
        lastUpdate: Date.now()
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Intersection Observer for virtual scrolling
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
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    const rowElements = document.querySelectorAll('[data-index]');
    rowElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [marketData.length]);

  // Sort data by change percentage
  const sortedData = useMemo(() => {
    return [...marketData].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [marketData]);

  return (
    <div className={`market-data-container ${className}`}>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">Market Data Active</span>
        </div>
      </div>

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

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-50 rounded text-xs font-mono space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>Items: {marketData.length}</div>
            <div>Visible: {visibleRows.size}</div>
          </div>
        </div>
      )}
    </div>
  );
});

MarketData.displayName = 'MarketData';

// Utility functions
function calculateTrend(changes: number[]): 'bullish' | 'bearish' | 'neutral' {
  if (changes.length === 0) return 'neutral';

  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  if (avgChange > 0.5) return 'bullish';
  if (avgChange < -0.5) return 'bearish';
  return 'neutral';
}

function calculateVolatility(changes: number[]): number {
  if (changes.length === 0) return 0;

  const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
  return Math.sqrt(variance);
}
