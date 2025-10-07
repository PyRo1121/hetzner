'use client';

import { useCallback, useEffect, useState } from 'react';

import { Calculator, ArrowRight, Coins } from 'lucide-react';

import { marketService, type ArbitrageOpportunity } from '@/lib/services/market.service';
import { ServerSelector } from '@/components/ui/server-selector';
import { useAppStore } from '@/lib/store/app-store';

interface ArbitrageCalculatorProps {
  itemIds?: string[];
  onItemSelect?: (itemId: string) => void;
}

export function ArbitrageCalculator({ itemIds = [], onItemSelect }: ArbitrageCalculatorProps) {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minProfit, setMinProfit] = useState(1000);
  const { selectedServer } = useAppStore();

  // Default popular items if none provided
  const defaultItems = [
    'T4_BAG', 'T5_BAG', 'T6_BAG', 'T7_BAG', 'T8_BAG',
    'T4_2H_SWORD', 'T5_2H_SWORD', 'T6_2H_SWORD', 'T7_2H_SWORD', 'T8_2H_SWORD',
    'T4_ARMOR_PLATE_SET1', 'T5_ARMOR_PLATE_SET1', 'T6_ARMOR_PLATE_SET1',
    'T4_HEAD_PLATE_SET1', 'T5_HEAD_PLATE_SET1', 'T6_HEAD_PLATE_SET1',
  ];

  const itemsToScan = itemIds.length > 0 ? itemIds : defaultItems;

  const loadOpportunities = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await marketService.findArbitrageOpportunities(itemsToScan, {
        minProfit,
        maxItems: 50,
        server: selectedServer,
      });
      setOpportunities(data);
    } catch (err) {
      setError('Failed to load arbitrage opportunities');
      console.error('Arbitrage error:', err);
    } finally {
      setLoading(false);
    }
  }, [itemsToScan, minProfit, selectedServer]);

  useEffect(() => {
    void loadOpportunities();
  }, [minProfit, itemsToScan, loadOpportunities]);

  const getQualityColor = (quality: number) => {
    switch (quality) {
      case 1: return 'text-gray-400';
      case 2: return 'text-green-400';
      case 3: return 'text-blue-400';
      case 4: return 'text-purple-400';
      case 5: return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityName = (quality: number) => {
    switch (quality) {
      case 1: return 'Normal';
      case 2: return 'Good';
      case 3: return 'Outstanding';
      case 4: return 'Excellent';
      case 5: return 'Masterpiece';
      default: return 'Unknown';
    }
  };

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-neon-green" />
          <div>
            <h3 className="text-xl font-bold">Arbitrage Calculator</h3>
            <p className="text-sm text-albion-gray-500">
              Find profitable cross-city trades
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="min-profit-input" className="text-sm text-albion-gray-400">Min Profit:</label>
            <input
              id="min-profit-input"
              type="number"
              value={minProfit}
              onChange={(e) => setMinProfit(Number(e.target.value))}
              className="w-24 px-2 py-1 bg-albion-gray-800 border border-albion-gray-700 rounded text-white text-sm"
              min="0"
              step="100"
            />
          </div>
          <ServerSelector />
          <button
            onClick={() => void loadOpportunities()}
            disabled={loading}
            className="px-4 py-2 bg-neon-green text-black rounded-lg hover:bg-neon-green/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Scanning...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      ) : null}

      {/* Results */}
      <div className="space-y-3">
        {opportunities.map((opp, index) => (
          <div
            key={`${opp.itemId}-${opp.quality}-${index}`}
            className="rounded-lg bg-albion-gray-800/50 p-4 border border-albion-gray-700 hover:bg-albion-gray-800 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onItemSelect?.(opp.itemId)}
                  className="font-medium text-white hover:text-neon-blue transition-colors"
                >
                  {opp.itemName}
                </button>
                <span className={`text-sm px-2 py-1 rounded ${getQualityColor(opp.quality)} bg-current/20`}>
                  {getQualityName(opp.quality)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-right">
                <Coins className="h-5 w-5 text-neon-gold" />
                <div>
                  <div className="text-lg font-bold text-neon-gold">
                    {opp.profit.toLocaleString()}
                  </div>
                  <div className="text-sm text-albion-gray-400">
                    {opp.profitMargin.toFixed(1)}% margin
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-albion-gray-400">Buy in</span>
                  <span className="font-medium text-neon-red">{opp.buyCity}</span>
                  <span className="text-albion-gray-400">for</span>
                  <span className="font-bold text-white">{opp.buyPrice.toLocaleString()}</span>
                </div>

                <ArrowRight className="h-4 w-4 text-albion-gray-500" />

                <div className="flex items-center gap-2">
                  <span className="text-albion-gray-400">Sell in</span>
                  <span className="font-medium text-neon-green">{opp.sellCity}</span>
                  <span className="text-albion-gray-400">for</span>
                  <span className="font-bold text-white">{opp.sellPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-albion-gray-500">
                Qty: {opp.quantity}
              </div>
            </div>
          </div>
        ))}
      </div>

      {opportunities.length === 0 && !loading ? (
        <div className="text-center py-12 text-albion-gray-500">
          <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No arbitrage opportunities found</p>
          <p className="text-sm mt-2">Try lowering the minimum profit threshold</p>
        </div>
      ) : null}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-albion-gray-500">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400/20 border border-gray-400" />
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-400/20 border border-green-400" />
          <span>Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-400/20 border border-blue-400" />
          <span>Outstanding</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-purple-400/20 border border-purple-400" />
          <span>Excellent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-orange-400/20 border border-orange-400" />
          <span>Masterpiece</span>
        </div>
      </div>
    </div>
  );
}
