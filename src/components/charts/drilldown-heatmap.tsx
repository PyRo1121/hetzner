'use client';

/**
 * Drilldown Price Heatmap
 * Phase 1, Week 5, Days 30-31
 * - Click-to-drilldown with Framer Motion transitions
 * - Browser back button support
 * - Touch device support
 * - Transitions <300ms
 */

import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, TrendingUp, TrendingDown } from 'lucide-react';

interface HeatmapCell {
  city: string;
  quality: number;
  price: number;
  change24h?: number;
}

interface DrilldownHeatmapProps {
  data: HeatmapCell[];
}

const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];
const QUALITIES = [1, 2, 3, 4, 5];
const QUALITY_LABELS = ['Normal', 'Good', 'Outstanding', 'Excellent', 'Masterpiece'];

export function DrilldownHeatmap({ data }: DrilldownHeatmapProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Browser back button support
  useEffect(() => {
    const handlePopState = () => {
      setSelectedCity(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Push state when drilling down
  const handleCityClick = (city: string) => {
    setSelectedCity(city);
    window.history.pushState({ city }, '', `#${city}`);
  };

  const handleBack = () => {
    setSelectedCity(null);
    window.history.back();
  };

  // Get color based on price
  const getColor = (price: number, maxPrice: number) => {
    if (price === 0) {return '#1a1a1a';}
    const intensity = price / maxPrice;
    // Blue to cyan gradient
    const r = Math.round(0 + intensity * 100);
    const g = Math.round(212 + intensity * 43);
    const b = Math.round(255);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const maxPrice = Math.max(...data.map(d => d.price), 1);

  // Filter data based on selection
  const filteredData = selectedCity
    ? data.filter(d => d.city === selectedCity)
    : data;

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">
            {selectedCity ? `${selectedCity} Price Breakdown` : 'Market Price Heatmap'}
          </h3>
          <p className="text-sm text-albion-gray-500">
            {selectedCity ? 'Prices by quality level' : 'Click a city to drill down'}
          </p>
        </div>

        {selectedCity ? <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg bg-albion-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-albion-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </button> : null}
      </div>

      {/* Heatmap Grid */}
      <AnimatePresence mode="wait">
        {!selectedCity ? (
          // Overview: Cities × Qualities
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            {/* Header row */}
            <div className="grid grid-cols-6 gap-2">
              <div className="text-sm font-medium text-albion-gray-500">City</div>
              {QUALITIES.map(q => (
                <div key={q} className="text-center text-sm font-medium text-albion-gray-500">
                  Q{q}
                </div>
              ))}
            </div>

            {/* City rows */}
            {CITIES.map(city => (
              <div key={city} className="grid grid-cols-6 gap-2">
                <button
                  onClick={() => handleCityClick(city)}
                  className="rounded-lg bg-albion-gray-800 px-3 py-2 text-left text-sm font-medium text-white transition-colors hover:bg-albion-gray-700"
                >
                  {city}
                </button>

                {QUALITIES.map(quality => {
                  const cell = data.find(d => d.city === city && d.quality === quality);
                  const price = cell?.price || 0;

                  return (
                    <motion.button
                      key={`${city}-${quality}`}
                      onClick={() => handleCityClick(city)}
                      onMouseEnter={() => cell && setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative rounded-lg p-4 text-center transition-all"
                      style={{
                        backgroundColor: getColor(price, maxPrice),
                      }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-lg">
                        {price > 0 ? `${(price / 1000).toFixed(1)  }k` : '-'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </motion.div>
        ) : (
          // Drilldown: Selected city details
          <motion.div
            key="drilldown"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {QUALITIES.map((quality, idx) => {
              const cell = filteredData.find(d => d.quality === quality);
              const price = cell?.price || 0;
              const change = cell?.change24h || 0;

              return (
                <motion.div
                  key={quality}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-albion-gray-400">
                        Quality {quality}
                      </p>
                      <p className="text-xs text-albion-gray-500">
                        {QUALITY_LABELS[quality - 1]}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {price > 0 ? price.toLocaleString() : 'No data'}
                      </p>
                      {price > 0 ? <div className={`flex items-center justify-end gap-1 text-sm ${
                          change >= 0 ? 'text-neon-green' : 'text-neon-red'
                        }`}>
                          {change >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span>{Math.abs(change).toFixed(2)}%</span>
                        </div> : null}
                    </div>
                  </div>

                  {/* Price bar */}
                  {price > 0 ? <div className="mt-3 h-2 overflow-hidden rounded-full bg-albion-gray-900">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(price / maxPrice) * 100}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: getColor(price, maxPrice),
                        }}
                      />
                    </div> : null}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredCell && !selectedCity ? <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-4 right-4 z-50 rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">{hoveredCell.city}</p>
                <p className="text-xs text-albion-gray-400">
                  Quality {hoveredCell.quality} - {QUALITY_LABELS[hoveredCell.quality - 1]}
                </p>
                <p className="mt-2 text-xl font-bold text-neon-blue">
                  {hoveredCell.price.toLocaleString()} silver
                </p>
              </div>
              <button
                onClick={() => setHoveredCell(null)}
                className="text-albion-gray-500 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div> : null}
      </AnimatePresence>
    </div>
  );
}
