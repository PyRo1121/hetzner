'use client';

import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  itemName: string;
  price: number;
  change: number;
}

export function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([
    { itemName: 'Adept\'s Bow', price: 12500, change: 5.2 },
    { itemName: 'Expert\'s Plate Armor', price: 45000, change: -2.1 },
    { itemName: 'Master\'s Greataxe', price: 89000, change: 8.7 },
    { itemName: 'Grandmaster\'s Hood', price: 156000, change: 3.4 },
    { itemName: 'Elder\'s Boots', price: 234000, change: -1.8 },
  ]);

  // Simulate real-time updates - reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          change: item.change + (Math.random() - 0.5) * 2,
        }))
      );
    }, 15000); // Changed from 5s to 15s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-albion-gray-800 bg-albion-gray-900/50">
      <div className="border-b border-albion-gray-800 px-4 py-2">
        <h3 className="text-sm font-semibold text-white">Market Ticker</h3>
      </div>
      
      <div className="relative h-12 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute flex items-center gap-8 whitespace-nowrap px-4"
        >
          {[...items, ...items].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{item.itemName}</span>
              <span className="text-sm text-albion-gray-400">
                {item.price.toLocaleString()}
              </span>
              <div
                className={`flex items-center gap-1 text-xs ${
                  item.change >= 0 ? 'text-neon-green' : 'text-red-500'
                }`}
              >
                {item.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(item.change).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
