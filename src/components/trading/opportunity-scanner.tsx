'use client';

import { useState, useMemo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, Filter, Download, RefreshCw } from 'lucide-react';

import {
  findBestOpportunities,
  formatSilver,
  type ArbitrageInput,
  type ArbitrageResult,
} from '@/lib/trading/arbitrage';

interface OpportunityWithResult extends ArbitrageInput {
  result: ArbitrageResult;
}

type SortField = 'roi' | 'netProfit' | 'profitPerUnit' | 'quantity';
type SortDirection = 'asc' | 'desc';

export function OpportunityScanner() {
  const [opportunities, setOpportunities] = useState<OpportunityWithResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('roi');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [minROI, setMinROI] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demonstration
  const mockOpportunities: ArbitrageInput[] = [
    {
      itemId: 'T8_MAIN_SWORD',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      buyPrice: 90000,
      sellPrice: 120000,
      quantity: 10,
    },
    {
      itemId: 'T8_HEAD_PLATE_SET1',
      buyCity: 'Lymhurst',
      sellCity: 'Caerleon',
      buyPrice: 50000,
      sellPrice: 65000,
      quantity: 15,
    },
    {
      itemId: 'T8_ARMOR_PLATE_SET1',
      buyCity: 'Thetford',
      sellCity: 'Caerleon',
      buyPrice: 80000,
      sellPrice: 100000,
      quantity: 8,
    },
    {
      itemId: 'T8_SHOES_PLATE_SET1',
      buyCity: 'Fort Sterling',
      sellCity: 'Caerleon',
      buyPrice: 40000,
      sellPrice: 52000,
      quantity: 20,
    },
    {
      itemId: 'T8_OFF_SHIELD',
      buyCity: 'Bridgewatch',
      sellCity: 'Caerleon',
      buyPrice: 30000,
      sellPrice: 42000,
      quantity: 12,
    },
  ];

  const handleScan = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const results = findBestOpportunities(mockOpportunities, minROI);
      setOpportunities(results);
      setIsLoading(false);
    }, 1000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = opportunities;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((opp) =>
        opp.itemId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      const aValue = sortField === 'quantity' ? a.quantity : a.result[sortField];
      const bValue = sortField === 'quantity' ? b.quantity : b.result[sortField];
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [opportunities, searchQuery, sortField, sortDirection]);

  const exportToCSV = () => {
    const headers = ['Item ID', 'Buy City', 'Sell City', 'Buy Price', 'Sell Price', 'Quantity', 'Net Profit', 'ROI', 'Profit/Unit'];
    const rows = filteredAndSorted.map((opp) => [
      opp.itemId,
      opp.buyCity,
      opp.sellCity,
      opp.buyPrice,
      opp.sellPrice,
      opp.quantity,
      opp.result.netProfit,
      opp.result.roi.toFixed(2),
      opp.result.profitPerUnit.toFixed(0),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-opportunities-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRecommendationColor = (rec: ArbitrageResult['recommendation']) => {
    switch (rec) {
      case 'excellent': return 'text-neon-green';
      case 'good': return 'text-neon-blue';
      case 'fair': return 'text-neon-gold';
      case 'poor': return 'text-orange-500';
      case 'avoid': return 'text-red-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-neon-blue" />
          <div>
            <h2 className="text-2xl font-bold text-white">Opportunity Scanner</h2>
            <p className="text-sm text-albion-gray-500">
              Find the best arbitrage opportunities across all cities
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            disabled={opportunities.length === 0}
            className="flex items-center gap-2 rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:border-neon-blue hover:bg-albion-gray-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="panel-float space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-albion-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 py-2 pl-10 pr-4 text-white placeholder-albion-gray-500 focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
            />
          </div>

          {/* Min ROI Filter */}
          <div>
            <label htmlFor="minROI" className="mb-2 block text-sm font-medium text-white">
              Minimum ROI: {minROI}%
            </label>
            <input
              id="minROI"
              type="range"
              min="0"
              max="50"
              step="5"
              value={minROI}
              onChange={(e) => setMinROI(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Scan Button */}
          <div className="flex items-end">
            <button
              onClick={handleScan}
              disabled={isLoading}
              className="btn-forge w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 inline h-5 w-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Filter className="mr-2 inline h-5 w-5" />
                  Scan Opportunities
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {opportunities.length > 0 ? <div className="panel-float overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Found {filteredAndSorted.length} Opportunities
            </h3>
            <div className="text-sm text-albion-gray-500">
              Sorted by {sortField} ({sortDirection})
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-albion-gray-700 text-left text-sm">
                  <th className="px-4 py-3 font-semibold text-albion-gray-400">Item</th>
                  <th className="px-4 py-3 font-semibold text-albion-gray-400">Route</th>
                  <th
                    className="cursor-pointer px-4 py-3 font-semibold text-albion-gray-400 hover:text-white"
                    onClick={() => handleSort('quantity')}
                  >
                    Qty {sortField === 'quantity' ? sortDirection === 'asc' ? '↑' : '↓' : null}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 font-semibold text-albion-gray-400 hover:text-white"
                    onClick={() => handleSort('netProfit')}
                  >
                    Net Profit {sortField === 'netProfit' ? sortDirection === 'asc' ? '↑' : '↓' : null}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 font-semibold text-albion-gray-400 hover:text-white"
                    onClick={() => handleSort('roi')}
                  >
                    ROI {sortField === 'roi' ? sortDirection === 'asc' ? '↑' : '↓' : null}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 font-semibold text-albion-gray-400 hover:text-white"
                    onClick={() => handleSort('profitPerUnit')}
                  >
                    Profit/Unit {sortField === 'profitPerUnit' ? sortDirection === 'asc' ? '↑' : '↓' : null}
                  </th>
                  <th className="px-4 py-3 font-semibold text-albion-gray-400">Rating</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredAndSorted.map((opp, index) => (
                    <motion.tr
                      key={opp.itemId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="border-b border-albion-gray-700/50 transition-colors hover:bg-albion-gray-800"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{opp.itemId}</div>
                        <div className="text-xs text-albion-gray-500">
                          Buy: {formatSilver(opp.buyPrice)} | Sell: {formatSilver(opp.sellPrice)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-albion-gray-400">
                        {opp.buyCity} → {opp.sellCity}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{opp.quantity}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-neon-green">
                          {formatSilver(opp.result.netProfit)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${opp.result.roi >= 20 ? 'text-neon-green' : 'text-neon-gold'}`}>
                          {opp.result.roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">
                        {formatSilver(opp.result.profitPerUnit)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold uppercase ${getRecommendationColor(opp.result.recommendation)}`}>
                          {opp.result.recommendation}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div> : null}

      {/* Empty State */}
      {opportunities.length === 0 && !isLoading ? <div className="panel-float py-12 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-albion-gray-700" />
          <h3 className="mb-2 text-lg font-semibold text-white">No Opportunities Yet</h3>
          <p className="text-sm text-albion-gray-500">
            Click "Scan Opportunities" to find profitable trades
          </p>
        </div> : null}
    </div>
  );
}
