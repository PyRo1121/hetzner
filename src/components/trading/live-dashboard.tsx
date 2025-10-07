'use client';

import { useState, useEffect, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Zap } from 'lucide-react';

import {
  findBestOpportunities,
  formatSilver,
  type ArbitrageInput,
  type ArbitrageResult,
} from '@/lib/trading/arbitrage';

interface OpportunityWithResult extends ArbitrageInput {
  result: ArbitrageResult;
  isNew?: boolean;
  priceChange?: 'up' | 'down' | 'stable';
}

export function LiveDashboard() {
  const [opportunities, setOpportunities] = useState<OpportunityWithResult[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Mock data generator
  const generateMockOpportunities = useCallback((): ArbitrageInput[] => {
    const items = [
      'T8_MAIN_SWORD',
      'T8_HEAD_PLATE_SET1',
      'T8_ARMOR_PLATE_SET1',
      'T8_SHOES_PLATE_SET1',
      'T8_OFF_SHIELD',
      'T8_2H_AXE',
      'T8_MAIN_MACE',
      'T8_2H_BOW',
    ];

    const cities = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];

    return items.map((item) => {
      const buyCity = cities[Math.floor(Math.random() * cities.length)];
      let sellCity = cities[Math.floor(Math.random() * cities.length)];
      while (sellCity === buyCity) {
        sellCity = cities[Math.floor(Math.random() * cities.length)];
      }

      const basePrice = Math.floor(Math.random() * 50000) + 50000;
      const priceVariation = Math.random() * 0.3 + 0.1; // 10-40% variation

      return {
        itemId: item,
        buyCity,
        sellCity,
        buyPrice: basePrice,
        sellPrice: Math.floor(basePrice * (1 + priceVariation)),
        quantity: Math.floor(Math.random() * 20) + 5,
      };
    });
  }, []);

  // Simulate real-time updates
  const updateOpportunities = useCallback(() => {
    const newData = generateMockOpportunities();
    const results = findBestOpportunities(newData, 5);

    // Mark new opportunities and price changes
    const updatedResults = results.map((newOpp) => {
      const existing = opportunities.find((opp) => opp.itemId === newOpp.itemId);
      
      let priceChange: 'up' | 'down' | 'stable' = 'stable';
      if (existing) {
        if (newOpp.result.roi > existing.result.roi) {priceChange = 'up';}
        else if (newOpp.result.roi < existing.result.roi) {priceChange = 'down';}
      }

      return {
        ...newOpp,
        isNew: !existing,
        priceChange,
      };
    });

    setOpportunities(updatedResults);
    setLastUpdate(new Date());
    setUpdateCount((prev) => prev + 1);
  }, [opportunities, generateMockOpportunities]);

  // Auto-update when live
  useEffect(() => {
    if (!isLive) {return;}

    // Initial update
    updateOpportunities();

    // Update every 10 seconds (reduced frequency)
    const interval = setInterval(updateOpportunities, 10000);

    return () => clearInterval(interval);
  }, [isLive, updateOpportunities]);

  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      updateOpportunities();
    }
  };

  const getChangeIcon = (change?: 'up' | 'down' | 'stable') => {
    switch (change) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-neon-green" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-albion-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-neon-gold" />
          <div>
            <h2 className="text-2xl font-bold text-white">Live Opportunities</h2>
            <p className="text-sm text-albion-gray-500">
              Real-time trading opportunities updated every 5 seconds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastUpdate ? <div className="text-sm text-albion-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div> : null}
          <button
            onClick={toggleLive}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-all ${
              isLive
                ? 'bg-neon-green text-white hover:bg-neon-green/80'
                : 'border border-albion-gray-700 bg-albion-gray-900 text-white hover:border-neon-green'
            }`}
          >
            {isLive ? (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                Live
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Start Live
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      {isLive ? <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel-float"
          >
            <div className="text-sm text-albion-gray-500">Active Opportunities</div>
            <div className="mt-1 text-3xl font-bold text-white">{opportunities.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="panel-float"
          >
            <div className="text-sm text-albion-gray-500">Updates</div>
            <div className="mt-1 text-3xl font-bold text-neon-blue">{updateCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="panel-float"
          >
            <div className="text-sm text-albion-gray-500">Best ROI</div>
            <div className="mt-1 text-3xl font-bold text-neon-green">
              {opportunities[0]?.result.roi.toFixed(1) || '0'}%
            </div>
          </motion.div>
        </div> : null}

      {/* Opportunities List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {opportunities.map((opp, index) => (
            <motion.div
              key={opp.itemId}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`panel-float relative overflow-hidden ${
                opp.isNew ? 'ring-2 ring-neon-gold' : ''
              }`}
            >
              {/* New Badge */}
              {opp.isNew ? <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-4 top-4 rounded-full bg-neon-gold px-3 py-1 text-xs font-bold text-white"
                >
                  NEW
                </motion.div> : null}

              <div className="grid gap-4 md:grid-cols-4">
                {/* Item Info */}
                <div>
                  <div className="text-sm text-albion-gray-500">Item</div>
                  <div className="mt-1 font-semibold text-white">{opp.itemId}</div>
                  <div className="mt-1 text-xs text-albion-gray-500">
                    {opp.buyCity} → {opp.sellCity}
                  </div>
                </div>

                {/* Prices */}
                <div>
                  <div className="text-sm text-albion-gray-500">Prices</div>
                  <div className="mt-1 space-y-1 text-sm">
                    <div className="text-red-400">Buy: {formatSilver(opp.buyPrice)}</div>
                    <div className="text-neon-green">Sell: {formatSilver(opp.sellPrice)}</div>
                  </div>
                </div>

                {/* Profit */}
                <div>
                  <span className="text-xs text-albion-gray-500">Profit: &quot;{opp.result.netProfit}&quot;</span>
                  <div className="mt-1 text-xl font-bold text-neon-green">
                    {formatSilver(opp.result.netProfit)}
                  </div>
                  <div className="mt-1 text-xs text-albion-gray-500">
                    Qty: {opp.quantity}
                  </div>
                </div>

                {/* ROI */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-albion-gray-500">ROI</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-2xl font-bold text-neon-blue">
                        {opp.result.roi.toFixed(1)}%
                      </span>
                      {getChangeIcon(opp.priceChange)}
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  <div className="text-right">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        opp.result.recommendation === 'excellent'
                          ? 'bg-neon-green/20 text-neon-green'
                          : opp.result.recommendation === 'good'
                            ? 'bg-neon-blue/20 text-neon-blue'
                            : 'bg-neon-gold/20 text-neon-gold'
                      }`}
                    >
                      {opp.result.recommendation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pulse Animation for New Items */}
              {opp.isNew ? <motion.div
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: 2 }}
                  className="absolute inset-0 bg-neon-gold/10"
                /> : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!isLive && opportunities.length === 0 ? <div className="panel-float py-12 text-center">
          <Zap className="mx-auto mb-4 h-12 w-12 text-albion-gray-700" />
          <h3 className="mb-2 text-lg font-semibold text-white">Live Mode Inactive</h3>
          <p className="text-sm text-albion-gray-500">
            Click "Start Live" to begin monitoring opportunities in real-time
          </p>
        </div> : null}
    </div>
  );
}
