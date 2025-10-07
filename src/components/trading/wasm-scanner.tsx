'use client';

import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { Zap, Download, Filter, TrendingUp } from 'lucide-react';

import { scanOpportunities, testWasm, type TradeOpportunity, type MarketDataInput } from '@/lib/wasm/trade-scanner';

export function WasmScanner() {
  const [isWasmReady, setIsWasmReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [opportunities, setOpportunities] = useState<TradeOpportunity[]>([]);
  const [minROI, setMinROI] = useState(15);
  const [scanTime, setScanTime] = useState(0);

  useEffect(() => {
    // Test WASM availability
    testWasm().then((result) => {
      setIsWasmReady(result.includes('working'));
    });
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    const startTime = performance.now();

    // Generate sample market data (in production, fetch from API)
    const sampleData: MarketDataInput[] = generateSampleData();

    try {
      const results = await scanOpportunities(sampleData, minROI, 100);
      setOpportunities(results);
      const endTime = performance.now();
      setScanTime(endTime - startTime);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Item', 'Buy City', 'Sell City', 'Buy Price', 'Sell Price', 'Quantity', 'Profit', 'ROI %'];
    const rows = opportunities.map(opp => [
      opp.item_name,
      opp.buy_city,
      opp.sell_city,
      opp.buy_price.toFixed(0),
      opp.sell_price.toFixed(0),
      opp.quantity,
      opp.profit.toFixed(0),
      opp.roi.toFixed(2),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-opportunities-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-neon-blue" />
            <div>
              <h2 className="text-2xl font-bold text-white">WASM Trade Scanner</h2>
              <p className="text-sm text-albion-gray-500">
                High-performance bulk opportunity scanning
                {isWasmReady ? <span className="ml-2 text-neon-green">• WASM Active</span> : null}
              </p>
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="btn-forge flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {isScanning ? 'Scanning...' : 'Scan Opportunities'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="panel-float">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-albion-gray-400">
              Minimum ROI: {minROI}%
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={minROI}
              onChange={(e) => setMinROI(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {opportunities.length > 0 && (
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>

        {scanTime > 0 && (
          <div className="mt-4 text-sm text-albion-gray-500">
            Scanned in <span className="font-bold text-neon-blue">{scanTime.toFixed(2)}ms</span>
            {' • '}
            Found <span className="font-bold text-neon-green">{opportunities.length}</span> opportunities
          </div>
        )}
      </div>

      {/* Results */}
      {opportunities.length > 0 && (
        <div className="panel-float">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-neon-blue" />
            <h3 className="text-lg font-semibold text-white">Top Opportunities</h3>
          </div>

          <div className="space-y-2">
            {opportunities.slice(0, 20).map((opp, index) => (
              <motion.div
                key={`${opp.item_id}-${opp.buy_city}-${opp.sell_city}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-center justify-between rounded-lg bg-albion-gray-800 p-4 transition-colors hover:bg-albion-gray-700"
              >
                <div className="flex-1">
                  <div className="font-semibold text-white">{opp.item_name}</div>
                  <div className="text-sm text-albion-gray-400">
                    {opp.buy_city} → {opp.sell_city} • Qty: {opp.quantity}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-albion-gray-500">Buy</div>
                    <div className="font-medium text-white">{opp.buy_price.toLocaleString()}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-albion-gray-500">Sell</div>
                    <div className="font-medium text-white">{opp.sell_price.toLocaleString()}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-albion-gray-500">Profit</div>
                    <div className="font-bold text-neon-green">
                      {opp.profit.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 rounded-full bg-neon-blue/20 px-3 py-1">
                    <TrendingUp className="h-4 w-4 text-neon-blue" />
                    <span className="font-bold text-neon-blue">{opp.roi.toFixed(1)}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isScanning && opportunities.length === 0 && (
        <div className="panel-float py-12 text-center">
          <Zap className="mx-auto mb-4 h-16 w-16 text-albion-gray-700" />
          <h3 className="mb-2 text-lg font-semibold text-white">No Scan Results Yet</h3>
          <p className="text-sm text-albion-gray-500">
            Click "Scan Opportunities" to find profitable trades
          </p>
        </div>
      )}
    </div>
  );
}

// Generate sample market data for testing
function generateSampleData(): MarketDataInput[] {
  const items = [
    'Adept\'s Bow', 'Expert\'s Sword', 'Master\'s Plate Armor',
    'Grandmaster\'s Hood', 'Elder\'s Boots', 'Adept\'s Staff',
  ];
  const cities = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];
  const data: MarketDataInput[] = [];

  items.forEach((item, itemIndex) => {
    cities.forEach((city) => {
      const basePrice = 10000 + itemIndex * 5000;
      const variance = Math.random() * 0.3 - 0.15; // ±15%
      
      data.push({
        item_id: `T${itemIndex + 4}_ITEM_${itemIndex}`,
        item_name: item,
        city,
        buy_price: Math.floor(basePrice * (1 + variance)),
        sell_price: Math.floor(basePrice * (1 + variance + 0.1)),
        quantity: Math.floor(Math.random() * 100) + 10,
      });
    });
  });

  return data;
}
