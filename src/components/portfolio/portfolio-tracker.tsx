'use client';

import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Plus, Download, Upload, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { portfolioManager, type PortfolioItem, type PortfolioStats } from '@/lib/portfolio/portfolio-manager';

export function PortfolioTracker() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [profitData, setProfitData] = useState<{ date: string; profit: number }[]>([]);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = () => {
    const portfolioItems = portfolioManager.getAllItems();
    const portfolioStats = portfolioManager.getStats();
    const profitOverTime = portfolioManager.getProfitOverTime(30);

    setItems(portfolioItems);
    setStats(portfolioStats);
    setProfitData(profitOverTime);
  };

  const handleExport = () => {
    const json = portfolioManager.exportPortfolio();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `albion-portfolio-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {return;}

      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        if (portfolioManager.importPortfolio(json)) {
          loadPortfolio();
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your entire portfolio? This cannot be undone.')) {
      portfolioManager.clearPortfolio();
      loadPortfolio();
    }
  };

  if (!stats) {
    return <div className="panel-float h-64 animate-pulse" />;
  }

  const isProfit = stats.totalProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-neon-blue" />
            <div>
              <h2 className="text-2xl font-bold text-white">Portfolio Tracker</h2>
              <p className="text-sm text-albion-gray-500">
                Track your investments and trading performance
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button onClick={handleImport} className="btn-secondary flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button onClick={handleClear} className="btn-secondary flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-float"
        >
          <div className="text-xs text-albion-gray-500">Total Value</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {stats.totalValue.toLocaleString()} 🪙
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel-float"
        >
          <div className="text-xs text-albion-gray-500">Total Cost</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {stats.totalCost.toLocaleString()} 🪙
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel-float"
        >
          <div className="flex items-center gap-2">
            {isProfit ? (
              <TrendingUp className="h-4 w-4 text-neon-green" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <div className="text-xs text-albion-gray-500">Profit/Loss</div>
          </div>
          <div className={`mt-1 text-2xl font-bold ${isProfit ? 'text-neon-green' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}{stats.totalProfit.toLocaleString()} 🪙
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="panel-float"
        >
          <div className="text-xs text-albion-gray-500">ROI</div>
          <div className={`mt-1 text-2xl font-bold ${isProfit ? 'text-neon-green' : 'text-red-500'}`}>
            {isProfit ? '+' : ''}{stats.profitPercentage.toFixed(2)}%
          </div>
        </motion.div>
      </div>

      {/* Profit Chart */}
      {profitData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="panel-float"
        >
          <h3 className="mb-4 text-lg font-semibold text-white">Profit Over Time (30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Portfolio Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="panel-float"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Holdings ({stats.itemCount})</h3>
          <button 
            onClick={() => alert('Add item functionality - use portfolioManager.addItem() API')} 
            className="btn-forge flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="mx-auto mb-4 h-16 w-16 text-albion-gray-700" />
            <h4 className="mb-2 text-lg font-semibold text-white">No Items Yet</h4>
            <p className="text-sm text-albion-gray-500">
              Portfolio tracking coming soon - add items manually via API
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const cost = item.purchasePrice * item.quantity;
              const value = (item.currentPrice || item.purchasePrice) * item.quantity;
              const profit = value - cost;
              const profitPercent = (profit / cost) * 100;
              const isProfitable = profit >= 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-albion-gray-800 p-4 transition-colors hover:bg-albion-gray-700"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-white">{item.itemName}</div>
                    <div className="text-sm text-albion-gray-500">
                      {item.quantity}x @ {item.purchasePrice.toLocaleString()} • {item.city}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-albion-gray-500">Cost</div>
                      <div className="font-medium text-white">{cost.toLocaleString()}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-albion-gray-500">Value</div>
                      <div className="font-medium text-white">{value.toLocaleString()}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-albion-gray-500">P/L</div>
                      <div className={`font-bold ${isProfitable ? 'text-neon-green' : 'text-red-500'}`}>
                        {isProfitable ? '+' : ''}{profit.toLocaleString()}
                        <span className="ml-1 text-xs">({profitPercent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
