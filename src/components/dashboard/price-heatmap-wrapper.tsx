'use client';

import { useMemo } from 'react';

import dynamic from 'next/dynamic';

import { useMarketPrices } from '@/hooks/use-market-prices';

const PriceHeatmap = dynamic(
  () => import('@/components/charts/price-heatmap').then(mod => ({ default: mod.PriceHeatmap })),
  {
    ssr: false,
    loading: () => <div className="panel-float h-[500px] animate-pulse" />,
  }
);

export function PriceHeatmapWrapper() {
  // Fetch market data for popular items
  const { data: marketData, isLoading } = useMarketPrices({
    locations: ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'],
  });

  // Transform data for heatmap
  const heatmapData = useMemo(() => {
    if (!marketData || marketData.length === 0) {
      return [];
    }

    // Group by city and quality, calculate average price
    const grouped = new Map<string, { city: string; quality: number; prices: number[] }>();

    marketData.forEach(price => {
      if (price.sellPriceMin > 0) {
        const key = `${price.city}-${price.quality}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            city: price.city,
            quality: price.quality,
            prices: [],
          });
        }
        grouped.get(key)!.prices.push(price.sellPriceMin);
      }
    });

    // Calculate average price for each city-quality combination
    return Array.from(grouped.values()).map(({ city, quality, prices }) => ({
      city,
      quality,
      price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    }));
  }, [marketData]);

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="text-center py-12">
          <p className="text-albion-gray-400">Loading heatmap data...</p>
        </div>
      </div>
    );
  }

  return <PriceHeatmap data={heatmapData} />;
}
