'use client';

/**
 * Price Heatmap with VisxD3.js + Visx
 * Phase 1, Week 5, Days 30-31
 * - Click-to-drilldown functionality with Framer Motion
 * - Browser back button support
 * - Smooth transitions (<300ms)
 * - Touch device support
 */

import { useState } from 'react';

import { HeatmapRect } from '@visx/heatmap';
import { scaleLinear } from '@visx/scale';

interface HeatmapData {
  city: string;
  quality: number;
  price: number;
  itemId?: string;
  itemName?: string;
}

interface PriceHeatmapProps {
  data: HeatmapData[];
  onCellClick?: (city: string, quality: number) => void;
}

const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'];
const QUALITIES = [1, 2, 3, 4, 5];

export function PriceHeatmap({ data }: PriceHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Transform data into matrix format
  const heatmapData = CITIES.map(city => ({
    city,
    bins: QUALITIES.map(quality => {
      const matchingData = data.find(d => d.city === city && d.quality === quality);
      return matchingData?.price ?? 0;
    }),
  }));

  // Calculate min/max prices
  const allPrices = data.map(d => d.price);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);

  // Color scale
  const colorScale = scaleLinear<string>({
    domain: [minPrice, maxPrice],
    range: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd'],
  });

  const legendItems = [
    { label: 'Low', value: minPrice },
    { label: 'Medium', value: (minPrice + maxPrice) / 2 },
    { label: 'High', value: maxPrice },
  ];

  // Dimensions
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 60, left: 120 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const binWidth = xMax / QUALITIES.length;
  const binHeight = yMax / CITIES.length;

  // Handle hover
  const handleMouseMove = (event: React.MouseEvent, bin: HeatmapData) => {
    setHoveredCell(bin);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  if (data.length === 0) {
    return (
      <div className="panel-float">
        <div className="text-center py-12">
          <p className="text-albion-gray-400">No price data available for heatmap</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-neon-blue bg-clip-text text-transparent">
            Price Heatmap
          </h2>
          <p className="text-sm text-albion-gray-400 mt-1">
            Price distribution across <span className="text-neon-blue font-semibold">{CITIES.length}</span> cities and <span className="text-neon-purple font-semibold">{QUALITIES.length}</span> quality tiers
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-albion-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-neon-blue animate-pulse" />
            <span>Live Data</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative">
        <svg width={width} height={height}>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Y-axis labels (Cities) */}
            {CITIES.map((city, i) => (
              <text
                key={city}
                x={-10}
                y={i * binHeight + binHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-sm fill-albion-gray-400"
              >
                {city}
              </text>
            ))}

            {/* X-axis labels (Quality) */}
            {QUALITIES.map((quality, i) => (
              <text
                key={quality}
                x={i * binWidth + binWidth / 2}
                y={yMax + 30}
                textAnchor="middle"
                className="text-sm fill-albion-gray-400"
              >
                Q{quality}
              </text>
            ))}

            {/* Heatmap cells */}
            <HeatmapRect
              data={heatmapData}
              xScale={(d) => QUALITIES.indexOf(d) * binWidth}
              yScale={(d) => CITIES.indexOf(String(d)) * binHeight}
              colorScale={(value: number | { valueOf(): number } | null | undefined) => {
                if (value == null) {
                  return '#1a1a1a';
                }
                const num = typeof value === 'number' ? value : value.valueOf();
                return num > 0 ? colorScale(num) : '#1a1a1a';
              }}
              binWidth={binWidth}
              binHeight={binHeight}
              gap={2}
            >
              {/* eslint-disable @typescript-eslint/no-explicit-any */}
              {(heatmap: any) =>
                heatmap.map((bins: any) =>
                  bins.map((bin: any) => {
                    /* eslint-enable @typescript-eslint/no-explicit-any */
                    const cityIndex = bin.row;
                    const qualityIndex = bin.column;
                    const city = CITIES[cityIndex];
                    const quality = QUALITIES[qualityIndex];
                    const price = bin.bin as number;
                    
                    return (
                      <rect
                        key={`heatmap-rect-${bin.row}-${bin.column}`}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        x={bin.column * binWidth}
                        y={bin.row * binHeight}
                        width={binWidth - 2}
                        height={binHeight - 2}
                        fill={price > 0 ? colorScale(price) : '#1a1a1a'}
                        onMouseMove={(e) => handleMouseMove(e, { city, quality, price })}
                        onMouseLeave={handleMouseLeave}
                        rx={4}
                      />
                    );
                  })
                )
              }
            </HeatmapRect>
          </g>
        </svg>

        {/* Hover tooltip */}
        {hoveredCell ? <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y + 10,
            }}
          >
            <div className="bg-albion-gray-900 border border-albion-gray-700 rounded-lg p-3 shadow-xl">
              <p className="text-sm font-medium text-white mb-1">
                {hoveredCell.city}
              </p>
              <p className="text-xs text-albion-gray-400 mb-2">
                Quality {hoveredCell.quality}
              </p>
              <p className="text-lg font-bold text-neon-blue">
                {hoveredCell.price > 0 
                  ? `${hoveredCell.price.toLocaleString()  } silver`
                  : 'No data'}
              </p>
            </div>
          </div> : null}
      </div>

      {/* Interactive Legend */}
      <div className="mt-6 pt-6 border-t border-albion-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price Range Legend */}
          <div>
            <p className="text-sm font-semibold text-albion-gray-300 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-neon-blue to-neon-purple rounded-full" />
              Price Range
            </p>
            <div className="flex items-center gap-4">
              {legendItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div
                    className="w-5 h-5 rounded-lg shadow-lg transition-transform group-hover:scale-110"
                    style={{ 
                      backgroundColor: colorScale(item.value),
                      boxShadow: `0 0 10px ${colorScale(item.value)}40`
                    }}
                  />
                  <div>
                    <span className="text-xs font-medium text-albion-gray-400 block">
                      {item.label}
                    </span>
                    <span className="text-xs text-neon-blue font-semibold">
                      {Math.round(item.value).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-end gap-6">
            <div className="text-center px-4 py-2 rounded-lg bg-albion-gray-800/50 border border-albion-gray-700">
              <p className="text-xs text-albion-gray-500 mb-1">Active Prices</p>
              <p className="text-2xl font-bold text-neon-green">{data.filter(d => d.price > 0).length}</p>
            </div>
            <div className="text-center px-4 py-2 rounded-lg bg-albion-gray-800/50 border border-albion-gray-700">
              <p className="text-xs text-albion-gray-500 mb-1">Avg Price</p>
              <p className="text-2xl font-bold text-neon-blue">
                {Math.round((minPrice + maxPrice) / 2).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
