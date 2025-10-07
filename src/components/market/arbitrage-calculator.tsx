'use client';

import { useState, useMemo } from 'react';

import { ArrowRight, TrendingUp, Search } from 'lucide-react';

import { useItemSearch } from '@/hooks/use-items';
import { useMarketPrices } from '@/hooks/use-market-prices';

const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];

export function ArbitrageCalculator() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [fromCity, setFromCity] = useState('Caerleon');
  const [toCity, setToCity] = useState('Bridgewatch');
  const [quality, setQuality] = useState(1);

  // Search for items
  const { data: searchResults } = useItemSearch(searchTerm, 10);

  // Fetch market prices for selected item
  const { data: marketData, isLoading: isPricesLoading } = useMarketPrices({
    itemIds: selectedItem ? [selectedItem] : undefined,
    locations: [fromCity, toCity],
    qualities: [String(quality)],
    enabled: !!selectedItem,
  });

  // Calculate arbitrage opportunities
  const arbitrageData = useMemo(() => {
    if (!marketData || marketData.length === 0) {
      return null;
    }

    const fromPrices = marketData.filter(p => p.city === fromCity);
    const toPrices = marketData.filter(p => p.city === toCity);

    if (fromPrices.length === 0 || toPrices.length === 0) {
      return null;
    }

    const buyPrice = Math.min(...fromPrices.map(p => p.sellPriceMin).filter(p => p > 0));
    const sellPrice = Math.max(...toPrices.map(p => p.buyPriceMax).filter(p => p > 0));

    if (buyPrice === Infinity || sellPrice === 0) {
      return null;
    }

    const profit = sellPrice - buyPrice;
    const roi = buyPrice > 0 ? (profit / buyPrice) * 100 : 0;
    const taxRate = 0.065; // 6.5% market tax
    const netProfit = profit - (sellPrice * taxRate);
    const netROI = buyPrice > 0 ? (netProfit / buyPrice) * 100 : 0;

    return {
      buyPrice,
      sellPrice,
      profit,
      roi,
      netProfit,
      netROI,
      taxAmount: sellPrice * taxRate,
    };
  }, [marketData, fromCity, toCity]);

  return (
    <div className="space-y-6">
      {/* Search & Select Item */}
      <div className="panel-float">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-neon-blue" />
          Select Item
        </h3>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-albion-gray-500" />
          <input
            type="text"
            placeholder="Search for items (e.g., 'sword', 'bag', 'armor')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 py-3 pl-10 pr-4 text-sm text-white placeholder-albion-gray-500 transition-colors focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
          />
        </div>

        {/* Search Results */}
        {searchTerm.length >= 2 && searchResults && searchResults.length > 0 ? (
          <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-albion-gray-700 bg-albion-gray-900">
            {searchResults.slice(0, 10).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedItem(item.id);
                  setSearchTerm(item.name);
                }}
                className="w-full px-4 py-3 text-left hover:bg-albion-gray-800 transition-colors border-b border-albion-gray-800 last:border-b-0"
              >
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-albion-gray-500">{item.id}</p>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* City Selection & Quality */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* From City */}
        <div className="panel-float">
          <h3 className="text-lg font-bold mb-4 text-neon-green">Buy From</h3>
          <div className="grid grid-cols-2 gap-2">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setFromCity(city)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  fromCity === city
                    ? 'bg-neon-green text-white shadow-lg shadow-neon-green/50'
                    : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* To City */}
        <div className="panel-float">
          <h3 className="text-lg font-bold mb-4 text-neon-blue">Sell To</h3>
          <div className="grid grid-cols-2 gap-2">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setToCity(city)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  toCity === city
                    ? 'bg-neon-blue text-white shadow-lg shadow-neon-blue/50'
                    : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quality Selector */}
      <div className="panel-float">
        <h3 className="text-lg font-bold mb-4">Quality Level</h3>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                quality === q
                  ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/50'
                  : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white'
              }`}
            >
              Q{q}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {selectedItem && arbitrageData ? (
        <div className="panel-float">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-neon-green" />
            Arbitrage Analysis
          </h3>

          {/* Trade Flow Visualization */}
          <div className="flex items-center justify-between mb-8 p-6 rounded-xl bg-gradient-to-r from-neon-green/10 via-transparent to-neon-blue/10 border border-albion-gray-700">
            <div className="text-center">
              <p className="text-sm text-albion-gray-500 mb-2">{fromCity}</p>
              <p className="text-3xl font-bold text-neon-green">
                {arbitrageData.buyPrice.toLocaleString()}
              </p>
              <p className="text-xs text-albion-gray-500 mt-1">Buy Price</p>
            </div>

            <ArrowRight className="h-8 w-8 text-albion-gray-600" />

            <div className="text-center">
              <p className="text-sm text-albion-gray-500 mb-2">{toCity}</p>
              <p className="text-3xl font-bold text-neon-blue">
                {arbitrageData.sellPrice.toLocaleString()}
              </p>
              <p className="text-xs text-albion-gray-500 mt-1">Sell Price</p>
            </div>
          </div>

          {/* Profit Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-albion-gray-800/50 border border-albion-gray-700">
              <p className="text-xs text-albion-gray-500 mb-1">Gross Profit</p>
              <p className={`text-2xl font-bold ${arbitrageData.profit > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {arbitrageData.profit > 0 ? '+' : ''}{arbitrageData.profit.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-albion-gray-800/50 border border-albion-gray-700">
              <p className="text-xs text-albion-gray-500 mb-1">Market Tax (6.5%)</p>
              <p className="text-2xl font-bold text-neon-red">
                -{Math.round(arbitrageData.taxAmount).toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-albion-gray-800/50 border border-neon-blue/30">
              <p className="text-xs text-albion-gray-500 mb-1">Net Profit</p>
              <p className={`text-2xl font-bold ${arbitrageData.netProfit > 0 ? 'text-neon-blue' : 'text-neon-red'}`}>
                {arbitrageData.netProfit > 0 ? '+' : ''}{Math.round(arbitrageData.netProfit).toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-albion-gray-800/50 border border-neon-purple/30">
              <p className="text-xs text-albion-gray-500 mb-1">Net ROI</p>
              <p className={`text-2xl font-bold ${arbitrageData.netROI > 0 ? 'text-neon-purple' : 'text-neon-red'}`}>
                {arbitrageData.netROI > 0 ? '+' : ''}{arbitrageData.netROI.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Recommendation */}
          <div className={`mt-6 p-4 rounded-lg border ${
            arbitrageData.netProfit > 0 
              ? 'bg-neon-green/10 border-neon-green/30' 
              : 'bg-neon-red/10 border-neon-red/30'
          }`}>
            <p className={`text-sm font-medium ${
              arbitrageData.netProfit > 0 ? 'text-neon-green' : 'text-neon-red'
            }`}>
              {arbitrageData.netProfit > 0 
                ? `✅ Profitable! Buy in ${fromCity} and sell in ${toCity} for ${Math.round(arbitrageData.netProfit).toLocaleString()} silver profit per item.`
                : `❌ Not profitable. Consider different cities or wait for better prices.`
              }
            </p>
          </div>
        </div>
      ) : selectedItem && isPricesLoading ? (
        <div className="panel-float p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neon-blue border-t-transparent" />
          <p className="mt-4 text-albion-gray-400">Calculating arbitrage opportunities...</p>
        </div>
      ) : (
        <div className="panel-float p-12 text-center">
          <p className="text-albion-gray-400">Search and select an item above to calculate arbitrage opportunities</p>
        </div>
      )}
    </div>
  );
}
