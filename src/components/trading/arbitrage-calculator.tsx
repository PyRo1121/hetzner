'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import { Calculator, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

import {
  calculateArbitrage,
  getCityDistance,
  formatSilver,
  type ArbitrageInput,
  type TransportCosts,
  type ArbitrageResult,
} from '@/lib/trading/arbitrage';

const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];
const MOUNT_TYPES = [
  { value: 'none', label: 'Walking', speed: 'Slowest', cost: 'Free' },
  { value: 'ox', label: 'Transport Ox', speed: 'Slow', cost: 'Cheap' },
  { value: 'horse', label: 'Riding Horse', speed: 'Medium', cost: 'Moderate' },
  { value: 'direwolf', label: 'Direwolf', speed: 'Fast', cost: 'Expensive' },
  { value: 'swiftclaw', label: 'Swiftclaw', speed: 'Fastest', cost: 'Very Expensive' },
] as const;

export function ArbitrageCalculator() {
  const [input, setInput] = useState<ArbitrageInput>({
    itemId: 'T8_MAIN_SWORD',
    buyCity: 'Martlock',
    sellCity: 'Caerleon',
    buyPrice: 90000,
    sellPrice: 110000,
    quantity: 10,
    quality: 1,
  });

  const [transport, setTransport] = useState<TransportCosts>({
    mountType: 'horse',
    weight: 50, // kg
    distance: getCityDistance(input.buyCity, input.sellCity),
    riskFactor: 0.3,
  });

  const [result, setResult] = useState<ArbitrageResult | null>(null);

  const handleCalculate = () => {
    const calculatedResult = calculateArbitrage(input, transport);
    setResult(calculatedResult);
  };

  const handleCityChange = (field: 'buyCity' | 'sellCity', value: string) => {
    const newInput = { ...input, [field]: value };
    setInput(newInput);
    
    // Update distance
    const newDistance = getCityDistance(
      field === 'buyCity' ? value : input.buyCity,
      field === 'sellCity' ? value : input.sellCity
    );
    setTransport({ ...transport, distance: newDistance });
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

  const getRecommendationIcon = (rec: ArbitrageResult['recommendation']) => {
    if (rec === 'excellent' || rec === 'good') {
      return <CheckCircle className="h-5 w-5" />;
    }
    return <AlertCircle className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="h-8 w-8 text-neon-blue" />
        <div>
          <h2 className="text-2xl font-bold text-white">Arbitrage Calculator</h2>
          <p className="text-sm text-albion-gray-500">
            Calculate profit opportunities between cities
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <div className="panel-float space-y-4">
          <h3 className="text-lg font-semibold text-white">Trade Details</h3>

          {/* Item ID */}
          <div>
            <label htmlFor="itemId" className="mb-2 block text-sm font-medium text-white">
              Item ID
            </label>
            <input
              id="itemId"
              type="text"
              value={input.itemId}
              onChange={(e) => setInput({ ...input, itemId: e.target.value })}
              className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              placeholder="e.g., T8_MAIN_SWORD"
            />
          </div>

          {/* Cities */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="buyCity" className="mb-2 block text-sm font-medium text-white">
                Buy From
              </label>
              <select
                id="buyCity"
                value={input.buyCity}
                onChange={(e) => handleCityChange('buyCity', e.target.value)}
                className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sellCity" className="mb-2 block text-sm font-medium text-white">
                Sell To
              </label>
              <select
                id="sellCity"
                value={input.sellCity}
                onChange={(e) => handleCityChange('sellCity', e.target.value)}
                className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="buyPrice" className="mb-2 block text-sm font-medium text-white">
                Buy Price (Silver)
              </label>
              <input
                id="buyPrice"
                type="number"
                value={input.buyPrice}
                onChange={(e) => setInput({ ...input, buyPrice: Number(e.target.value) })}
                className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="sellPrice" className="mb-2 block text-sm font-medium text-white">
                Sell Price (Silver)
              </label>
              <input
                id="sellPrice"
                type="number"
                value={input.sellPrice}
                onChange={(e) => setInput({ ...input, sellPrice: Number(e.target.value) })}
                className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                min="0"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="mb-2 block text-sm font-medium text-white">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              value={input.quantity}
              onChange={(e) => setInput({ ...input, quantity: Number(e.target.value) })}
              className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              min="1"
            />
          </div>

          {/* Transport Options */}
          <div className="border-t border-albion-gray-700 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-white">Transport Options</h4>

            <div className="space-y-3">
              <div>
                <label htmlFor="mountType" className="mb-2 block text-sm font-medium text-white">
                  Mount Type
                </label>
                <select
                  id="mountType"
                  value={transport.mountType}
                  onChange={(e) =>
                    setTransport({ ...transport, mountType: e.target.value as TransportCosts['mountType'] })
                  }
                  className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                >
                  {MOUNT_TYPES.map((mount) => (
                    <option key={mount.value} value={mount.value}>
                      {mount.label} ({mount.speed}, {mount.cost})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weight" className="mb-2 block text-sm font-medium text-white">
                    Weight (kg)
                  </label>
                  <input
                    id="weight"
                    type="number"
                    value={transport.weight}
                    onChange={(e) => setTransport({ ...transport, weight: Number(e.target.value) })}
                    className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="riskFactor" className="mb-2 block text-sm font-medium text-white">
                    Risk Factor
                  </label>
                  <input
                    id="riskFactor"
                    type="number"
                    value={transport.riskFactor}
                    onChange={(e) => setTransport({ ...transport, riskFactor: Number(e.target.value) })}
                    className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
                    min="0"
                    max="1"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="text-xs text-albion-gray-500">
                Distance: {transport.distance} zones
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            className="btn-forge w-full"
          >
            <Calculator className="mr-2 inline h-5 w-5" />
            Calculate Profit
          </button>
        </div>

        {/* Results */}
        {result ? <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="panel-float space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Results</h3>
              <div className={`flex items-center gap-2 ${getRecommendationColor(result.recommendation)}`}>
                {getRecommendationIcon(result.recommendation)}
                <span className="text-sm font-semibold uppercase">{result.recommendation}</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-albion-gray-800 p-4">
                <div className="text-sm text-albion-gray-500">Net Profit</div>
                <div className={`text-2xl font-bold ${result.netProfit >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                  {formatSilver(result.netProfit)}
                </div>
              </div>

              <div className="rounded-lg bg-albion-gray-800 p-4">
                <div className="text-sm text-albion-gray-500">ROI</div>
                <div className={`text-2xl font-bold ${result.roi >= 10 ? 'text-neon-green' : 'text-neon-gold'}`}>
                  {result.roi.toFixed(1)}%
                </div>
              </div>

              <div className="rounded-lg bg-albion-gray-800 p-4">
                <div className="text-sm text-albion-gray-500">Profit/Unit</div>
                <div className="text-xl font-bold text-white">
                  {formatSilver(result.profitPerUnit)}
                </div>
              </div>

              <div className="rounded-lg bg-albion-gray-800 p-4">
                <div className="text-sm text-albion-gray-500">Margin</div>
                <div className="text-xl font-bold text-white">
                  {result.profitMargin.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-albion-gray-700 pt-4">
              <h4 className="mb-3 text-sm font-semibold text-white">Cost Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-albion-gray-500">Total Cost</span>
                  <span className="font-medium text-white">{formatSilver(result.totalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-albion-gray-500">Market Tax (4.5%)</span>
                  <span className="font-medium text-red-400">-{formatSilver(result.marketTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-albion-gray-500">Setup Fee (1.5%)</span>
                  <span className="font-medium text-red-400">-{formatSilver(result.setupFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-albion-gray-500">Transport Cost</span>
                  <span className="font-medium text-red-400">-{formatSilver(result.transportCost)}</span>
                </div>
                <div className="flex justify-between border-t border-albion-gray-700 pt-2">
                  <span className="text-white">Total Revenue</span>
                  <span className="font-bold text-neon-green">{formatSilver(result.totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Break-even Analysis */}
            <div className="rounded-lg bg-neon-blue/10 p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-neon-blue" />
                <div>
                  <div className="text-sm font-semibold text-white">Break-even Point</div>
                  <div className="text-xs text-albion-gray-500">
                    {result.breakEvenQuantity === Infinity
                      ? 'Not profitable at any quantity'
                      : `Need to sell ${result.breakEvenQuantity} units to break even`}
                  </div>
                </div>
              </div>
            </div>
          </motion.div> : null}
      </div>
    </div>
  );
}
