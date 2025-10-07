'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

import { useGoldPrices } from '@/hooks/use-gold-prices';

export function GoldPriceWidget() {
  const { data: goldPrices, isLoading } = useGoldPrices({ limit: 2 });
  
  const latestPrice = goldPrices?.[0];
  const previousPrice = goldPrices?.[1];
  
  const goldPrice = latestPrice?.price || 0;
  const change = latestPrice && previousPrice 
    ? ((latestPrice.price - previousPrice.price) / previousPrice.price) * 100
    : 0;
  const isPositive = change >= 0;

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-albion-gray-800 rounded w-1/2" />
          <div className="h-12 bg-albion-gray-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gold Price</h3>
        <div className="rounded-lg bg-neon-gold/10 p-2">
          <DollarSign className="h-5 w-5 text-neon-gold" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Price */}
        <div>
          <p className="text-sm text-albion-gray-500">Current Rate</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neon-gold">{goldPrice.toLocaleString()}</span>
            <span className="text-sm text-albion-gray-500">silver</span>
          </div>
        </div>

        {/* Change */}
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-neon-green" />
          ) : (
            <TrendingDown className="h-4 w-4 text-neon-red" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)}% (24h)
          </span>
        </div>

        {/* Mini Chart Placeholder */}
        <div className="h-16 rounded-lg bg-albion-gray-800 p-2">
          <div className="flex h-full items-end justify-between gap-1">
            {[40, 55, 45, 60, 50, 65, 58, 70, 65, 75, 68, 72].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="flex-1 rounded-sm bg-neon-gold/50"
              />
            ))}
          </div>
        </div>

        {/* Quick Converter */}
        <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-3">
          <p className="mb-2 text-xs font-medium text-albion-gray-500">Quick Convert</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Gold"
              className="flex-1 rounded bg-albion-gray-900 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-gold"
            />
            <span className="text-albion-gray-500">→</span>
            <input
              type="number"
              placeholder="Silver"
              className="flex-1 rounded bg-albion-gray-900 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-gold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
