'use client';

import Link from 'next/link';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TradingOpportunity {
  itemId: string;
  itemName: string;
  buyCity: string;
  sellCity: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  roi: number;
}

interface TradingWidgetProps {
  opportunities?: TradingOpportunity[];
  isLoading?: boolean;
}

export function TradingWidget({ opportunities = [], isLoading = false }: TradingWidgetProps) {
  const formatSilver = (amount: number) => {
    if (amount >= 1000000) {return `${(amount / 1000000).toFixed(1)}M`;}
    if (amount >= 1000) {return `${(amount / 1000).toFixed(0)}K`;}
    return amount.toString();
  };

  return (
    <div className="panel-float">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Top Opportunities</h3>
        <Link
          href="/trading/scanner"
          className="text-sm text-neon-blue hover:underline"
        >
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-albion-gray-800" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="py-8 text-center">
          <Activity className="mx-auto mb-2 h-8 w-8 text-albion-gray-700" />
          <p className="text-sm text-albion-gray-500">No opportunities available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {opportunities.slice(0, 5).map((opp, index) => (
            <motion.div
              key={`${opp.itemId}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between rounded-lg bg-albion-gray-800 p-3 transition-colors hover:bg-albion-gray-700"
            >
              <div className="flex-1">
                <div className="font-medium text-white">{opp.itemName}</div>
                <div className="text-xs text-albion-gray-500">
                  {opp.buyCity} → {opp.sellCity}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-bold text-neon-green">
                    +{formatSilver(opp.profit)}
                  </div>
                  <div className="text-xs text-albion-gray-500">
                    {opp.roi.toFixed(0)}% ROI
                  </div>
                </div>

                {opp.roi >= 20 ? (
                  <TrendingUp className="h-5 w-5 text-neon-green" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-albion-gray-500" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
