'use client';

/**
 * Gold Price Tracker Widget
 * Phase 1, Week 4, Day 22
 * - Real-time input converter with particle effects
 * - Updates immediately on Realtime subscription
 * - Proper currency formatting
 * - Handle negative value edge cases
 */

import { useState, useEffect } from 'react';

import Lottie from 'lottie-react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

import { useGoldPrices } from '@/hooks/use-gold-prices';

// Lottie animation data for particles (inline simple animation)
const particleAnimation = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Particles",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Particle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 1, k: [
          { t: 0, s: [50, 100, 0], e: [50, 0, 0] },
          { t: 60 }
        ]},
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [4, 4] }
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 0.84, 0, 1] },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ]
};

export function GoldPriceTracker() {
  const { data: goldPrices, isLoading } = useGoldPrices({ limit: 2 });
  const [silverAmount, setSilverAmount] = useState<string>('1000000');
  const [showParticles, setShowParticles] = useState(false);

  const latestPrice = goldPrices?.[0];
  const previousPrice = goldPrices?.[1];

  // Calculate change
  const priceChange = latestPrice && previousPrice 
    ? latestPrice.price - previousPrice.price 
    : 0;
  const percentChange = previousPrice && previousPrice.price > 0
    ? ((priceChange / previousPrice.price) * 100).toFixed(2)
    : '0.00';

  // Convert silver to gold
  const goldValue = latestPrice && parseFloat(silverAmount) > 0
    ? (parseFloat(silverAmount) / latestPrice.price).toFixed(2)
    : '0.00';

  // Trigger particles on price update
  useEffect(() => {
    if (latestPrice && priceChange !== 0) {
      setShowParticles(true);
      const timer = setTimeout(() => setShowParticles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [latestPrice, priceChange]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle input change
  const handleSilverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setSilverAmount(value || '0');
  };

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="text-center py-8">
          <p className="text-albion-gray-400">Loading gold prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float relative overflow-hidden">
      {/* Particle Effects */}
      {showParticles ? <div className="absolute inset-0 pointer-events-none z-10">
          <Lottie
            animationData={particleAnimation}
            loop={false}
            className="w-full h-full"
          />
        </div> : null}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-neon-gold" />
          <h2 className="text-xl font-bold">Gold Price Tracker</h2>
        </div>
        <div className="text-xs text-albion-gray-500">
          Real-time • Live
        </div>
      </div>

      {/* Current Price */}
      <div className="mb-6 rounded-lg bg-albion-gray-800 p-6">
        <p className="text-sm text-albion-gray-500 mb-2">Current Gold Price</p>
        <div className="flex items-baseline gap-3">
          <p className="text-4xl font-bold text-neon-gold">
            {latestPrice ? formatCurrency(latestPrice.price) : '—'}
          </p>
          <span className="text-sm text-albion-gray-500">silver</span>
        </div>

        {/* Price Change */}
        {priceChange !== 0 ? <div className="mt-3 flex items-center gap-2">
            {priceChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-neon-green" />
            ) : (
              <TrendingDown className="h-4 w-4 text-neon-red" />
            )}
            <span className={`text-sm font-medium ${
              priceChange > 0 ? 'text-neon-green' : 'text-neon-red'
            }`}>
              {priceChange > 0 ? '+' : ''}{formatCurrency(priceChange)} ({percentChange}%)
            </span>
            <span className="text-xs text-albion-gray-500">vs last update</span>
          </div> : null}
      </div>

      {/* Converter */}
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-albion-gray-400">
            Silver Amount
          </label>
          <input
            type="text"
            value={formatCurrency(parseInt(silverAmount) || 0)}
            onChange={handleSilverChange}
            className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-4 py-3 text-lg font-mono text-white transition-colors focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
            placeholder="1,000,000"
          />
        </div>

        {/* Conversion Result */}
        <div className="rounded-lg border-2 border-neon-gold bg-gradient-to-br from-neon-gold/10 to-transparent p-4">
          <p className="text-sm text-albion-gray-400 mb-1">Equals</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-neon-gold">
              {goldValue}
            </p>
            <span className="text-lg text-neon-gold">gold</span>
          </div>
        </div>
      </div>

      {/* Last Update */}
      {latestPrice ? <div className="mt-6 pt-4 border-t border-albion-gray-700">
          <p className="text-xs text-albion-gray-500">
            Last updated: {new Date(latestPrice.timestamp).toLocaleString()}
          </p>
        </div> : null}
    </div>
  );
}
