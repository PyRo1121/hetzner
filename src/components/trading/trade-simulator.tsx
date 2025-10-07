'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';

import { formatSilver } from '@/lib/trading/arbitrage';
import {
  runMonteCarloSimulation,
  calculateSharpeRatio,
  calculateVaR,
  calculateCVaR,
  type SimulationInput,
  type SimulationResult,
} from '@/lib/trading/monte-carlo';

export function TradeSimulator() {
  const [input, setInput] = useState<SimulationInput>({
    itemId: 'T8_MAIN_SWORD',
    buyPrice: 90000,
    sellPrice: 110000,
    quantity: 10,
    priceVolatility: 0.1, // 10% volatility
    marketTax: 0.045,
    setupFee: 0.015,
    transportCost: 5000,
    iterations: 1000,
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleSimulate = async () => {
    setIsRunning(true);
    
    // Simulate delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const simulationResult = runMonteCarloSimulation(input);
    setResult(simulationResult);
    setIsRunning(false);
  };

  const getRiskLevel = (probability: number): { label: string; color: string } => {
    if (probability >= 0.8) {return { label: 'Low Risk', color: 'text-neon-green' };}
    if (probability >= 0.6) {return { label: 'Medium Risk', color: 'text-neon-gold' };}
    return { label: 'High Risk', color: 'text-red-500' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-neon-purple" />
        <div>
          <h2 className="text-2xl font-bold text-white">Trade Simulator</h2>
          <p className="text-sm text-albion-gray-500">
            Monte Carlo simulation to assess risk and probability
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <div className="panel-float space-y-4">
          <h3 className="text-lg font-semibold text-white">Simulation Parameters</h3>

          {/* Item ID */}
          <div>
            <label htmlFor="simItemId" className="mb-2 block text-sm font-medium text-white">
              Item ID
            </label>
            <input
              id="simItemId"
              type="text"
              value={input.itemId}
              onChange={(e) => setInput({ ...input, itemId: e.target.value })}
              className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="simBuyPrice" className="mb-2 block text-sm font-medium text-white">
                Buy Price
              </label>
              <input
                id="simBuyPrice"
                type="number"
                value={input.buyPrice}
                onChange={(e) => setInput({ ...input, buyPrice: Number(e.target.value) })}
                className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              />
            </div>

            <div>
              <label htmlFor="simSellPrice" className="mb-2 block text-sm font-medium text-white">
                Sell Price
              </label>
              <input
                id="simSellPrice"
                type="number"
                value={input.sellPrice}
                onChange={(e) => setInput({ ...input, sellPrice: Number(e.target.value) })}
                className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              />
            </div>
          </div>

          {/* Quantity & Transport */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="simQuantity" className="mb-2 block text-sm font-medium text-white">
                Quantity
              </label>
              <input
                id="simQuantity"
                type="number"
                value={input.quantity}
                onChange={(e) => setInput({ ...input, quantity: Number(e.target.value) })}
                className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              />
            </div>

            <div>
              <label htmlFor="simTransport" className="mb-2 block text-sm font-medium text-white">
                Transport Cost
              </label>
              <input
                id="simTransport"
                type="number"
                value={input.transportCost}
                onChange={(e) => setInput({ ...input, transportCost: Number(e.target.value) })}
                className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
              />
            </div>
          </div>

          {/* Volatility */}
          <div>
            <label htmlFor="simVolatility" className="mb-2 block text-sm font-medium text-white">
              Price Volatility: {(input.priceVolatility * 100).toFixed(0)}%
            </label>
            <input
              id="simVolatility"
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={input.priceVolatility}
              onChange={(e) => setInput({ ...input, priceVolatility: Number(e.target.value) })}
              className="w-full"
            />
            <div className="mt-1 text-xs text-albion-gray-500">
              Higher volatility = more price variation
            </div>
          </div>

          {/* Iterations */}
          <div>
            <label htmlFor="simIterations" className="mb-2 block text-sm font-medium text-white">
              Simulations: {input.iterations.toLocaleString()}
            </label>
            <input
              id="simIterations"
              type="range"
              min="100"
              max="10000"
              step="100"
              value={input.iterations}
              onChange={(e) => setInput({ ...input, iterations: Number(e.target.value) })}
              className="w-full"
            />
            <div className="mt-1 text-xs text-albion-gray-500">
              More simulations = more accurate results
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleSimulate}
            disabled={isRunning}
            className="btn-forge w-full"
          >
            {isRunning ? (
              <>
                <Activity className="mr-2 inline h-5 w-5 animate-spin" />
                Running Simulation...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 inline h-5 w-5" />
                Run Simulation
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result ? <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Risk Assessment */}
            <div className="panel-float">
              <h3 className="mb-4 text-lg font-semibold text-white">Risk Assessment</h3>
              
              <div className="space-y-4">
                {/* Profit Probability */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-albion-gray-500">Profit Probability</span>
                    <span className={`text-xl font-bold ${getRiskLevel(result.profitProbability).color}`}>
                      {(result.profitProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-albion-gray-700">
                    <div
                      className="h-full bg-neon-green transition-all"
                      style={{ width: `${result.profitProbability * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-albion-gray-500">
                    {getRiskLevel(result.profitProbability).label}
                  </div>
                </div>

                {/* Expected Value */}
                <div className="flex items-center justify-between rounded-lg bg-albion-gray-800 p-3">
                  <div>
                    <div className="text-sm text-albion-gray-500">Expected Profit</div>
                    <div className={`text-2xl font-bold ${result.expectedValue >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                      {formatSilver(result.expectedValue)}
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-neon-blue" />
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="panel-float">
              <h3 className="mb-4 text-lg font-semibold text-white">Statistics</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-albion-gray-800 p-3">
                  <div className="text-xs text-albion-gray-500">Mean</div>
                  <div className="text-lg font-bold text-white">{formatSilver(result.mean)}</div>
                </div>

                <div className="rounded-lg bg-albion-gray-800 p-3">
                  <div className="text-xs text-albion-gray-500">Median</div>
                  <div className="text-lg font-bold text-white">{formatSilver(result.median)}</div>
                </div>

                <div className="rounded-lg bg-albion-gray-800 p-3">
                  <div className="text-xs text-albion-gray-500">Std Dev</div>
                  <div className="text-lg font-bold text-white">{formatSilver(result.stdDev)}</div>
                </div>

                <div className="rounded-lg bg-albion-gray-800 p-3">
                  <div className="text-xs text-albion-gray-500">Sharpe Ratio</div>
                  <div className="text-lg font-bold text-white">
                    {calculateSharpeRatio(result).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Range */}
            <div className="panel-float">
              <h3 className="mb-4 text-lg font-semibold text-white">Outcome Range</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-albion-gray-500">Best Case</span>
                  <span className="font-bold text-neon-green">{formatSilver(result.max)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-albion-gray-500">90% Confidence (Upper)</span>
                  <span className="font-medium text-white">{formatSilver(result.confidenceInterval.upper)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-albion-gray-500">90% Confidence (Lower)</span>
                  <span className="font-medium text-white">{formatSilver(result.confidenceInterval.lower)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-albion-gray-500">Worst Case</span>
                  <span className="font-bold text-red-500">{formatSilver(result.min)}</span>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="panel-float">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Risk Metrics
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-albion-gray-500">Value at Risk (95%)</span>
                  <span className="font-bold text-orange-500">{formatSilver(calculateVaR(result))}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-albion-gray-500">Conditional VaR (95%)</span>
                  <span className="font-bold text-red-500">{formatSilver(calculateCVaR(result))}</span>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-orange-500/10 p-3 text-xs text-orange-400">
                <strong>VaR:</strong> Maximum expected loss at 95% confidence<br />
                <strong>CVaR:</strong> Average loss in worst 5% of scenarios
              </div>
            </div>
          </motion.div> : null}

        {/* Empty State */}
        {!result && !isRunning ? <div className="panel-float flex flex-col items-center justify-center py-12">
            <BarChart3 className="mb-4 h-16 w-16 text-albion-gray-700" />
            <h3 className="mb-2 text-lg font-semibold text-white">No Simulation Yet</h3>
            <p className="text-center text-sm text-albion-gray-500">
              Configure parameters and click "Run Simulation" to see results
            </p>
          </div> : null}
      </div>
    </div>
  );
}
