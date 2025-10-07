'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MiniPriceChartProps {
  data: Array<{ price: number; timestamp: string }>;
  itemName: string;
  currentPrice: number;
  priceChange: number;
}

export function MiniPriceChart({ data, itemName, currentPrice, priceChange }: MiniPriceChartProps) {
  const isPositive = priceChange >= 0;

  return (
    <div className="panel-float">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white">{itemName}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {currentPrice >= 1000 ? `${(currentPrice / 1000).toFixed(1)}K` : currentPrice}
            </span>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-neon-green' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{Math.abs(priceChange).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#10b981' : '#ef4444'}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
