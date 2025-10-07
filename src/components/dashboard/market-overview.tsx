'use client';

import { useState, useMemo } from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useMarketPrices } from '@/hooks/use-market-prices';

const timeRanges = ['24H', '7D', '30D', '90D', 'ALL'];

export function MarketOverview() {
  const [selectedRange, setSelectedRange] = useState('24H');

  // Fetch market data for popular items
  const { data: marketData, isLoading } = useMarketPrices({
    locations: ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'],
  });

  // Calculate aggregate statistics
  const stats = useMemo(() => {
    if (!marketData || marketData.length === 0) {
      return {
        avgPrice: 0,
        totalVolume: marketData?.length ?? 0,
        priceChange: 0,
        chartData: [],
      };
    }

    // Calculate average sell price
    const validPrices = marketData.filter(p => p.sellPriceMin > 0);
    const avgPrice = validPrices.length > 0
      ? Math.round(validPrices.reduce((sum, p) => sum + p.sellPriceMin, 0) / validPrices.length)
      : 0;

    // Group by hour for chart (simplified - using timestamp)
    const pricesByHour = new Map<string, number[]>();
    marketData.forEach(price => {
      const hour = new Date(price.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      if (!pricesByHour.has(hour)) {
        pricesByHour.set(hour, []);
      }
      if (price.sellPriceMin > 0) {
        pricesByHour.get(hour)!.push(price.sellPriceMin);
      }
    });

    // Create chart data
    const chartData = Array.from(pricesByHour.entries())
      .map(([time, prices]) => ({
        time,
        price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      }))
      .slice(-20); // Last 20 data points

    return {
      avgPrice,
      totalVolume: marketData.length,
      priceChange: 0, // Would need historical data to calculate
      chartData,
    };
  }, [marketData]);

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="text-center py-12">
          <p className="text-albion-gray-400">Loading market overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Market Overview</h2>
          <p className="text-sm text-albion-gray-500">Real-time price trends across all markets</p>
        </div>
        <div className="flex items-center gap-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                selectedRange === range
                  ? 'bg-neon-blue text-white'
                  : 'bg-albion-gray-800 text-albion-gray-500 hover:bg-albion-gray-700 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis
              dataKey="time"
              stroke="#6a6a6a"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6a6a6a"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#ffffff',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#00d4ff"
              strokeWidth={2}
              dot={{ fill: '#00d4ff', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-albion-gray-700 pt-4">
        <div>
          <p className="text-sm text-albion-gray-500">Avg Price</p>
          <p className="mt-1 text-lg font-bold text-white">
            {stats.avgPrice.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-albion-gray-500">24h Change</p>
          <p className="mt-1 text-lg font-bold text-albion-gray-400">
            {stats.priceChange > 0 ? '+' : ''}{stats.priceChange}%
          </p>
        </div>
        <div>
          <p className="text-sm text-albion-gray-500">Data Points</p>
          <p className="mt-1 text-lg font-bold text-white">
            {stats.totalVolume.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
