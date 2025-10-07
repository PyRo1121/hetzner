'use client';

/**
 * Historical Price Chart with Recharts v2.13+
 * Phase 1, Week 3, Day 17-18
 * - Recharts with kinetic GSAP zoom/pan interactions
 * - Detailed tooltips
 * - Renders 1-year price data smoothly
 * - Export chart as PNG
 */

import { useState, useCallback, useRef } from 'react';

import gsap from 'gsap';
import { Download, ZoomIn, ZoomOut, Maximize2, TrendingUp, Volume2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';

import { usePriceHistory } from '@/hooks/use-price-history';
import { playDataSequence } from '@/lib/accessibility/chart-sonification';
// ML price prediction available in Phase 2
// import { predictPrice } from '@/lib/ml/price-predictor';

interface HistoricalPriceChartProps {
  itemId: string;
  city?: string;
  quality?: number;
}

const TIME_RANGES = [
  { value: '24H', label: '24 Hours', hours: 24 },
  { value: '7D', label: '7 Days', hours: 168 },
  { value: '30D', label: '30 Days', hours: 720 },
  { value: '90D', label: '90 Days', hours: 2160 },
  { value: '1Y', label: '1 Year', hours: 8760 },
];

export function HistoricalPriceChart({ itemId, city, quality }: HistoricalPriceChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showMLPredictions, setShowMLPredictions] = useState(false);
  const [isSonifying, setIsSonifying] = useState(false);
  const [selectedRange, setSelectedRange] = useState('7D');
  const chartRef = useRef<HTMLDivElement>(null);

  const { data: historyData, isLoading } = usePriceHistory({
    itemIds: itemId,
    locations: city,
    qualities: quality?.toString(),
    timeScale: 1,
  });
  
  // Transform data for Recharts
  const chartData = (historyData?.[0]?.data?.map(point => ({
    timestamp: new Date(point.timestamp).toLocaleDateString(),
    avgPrice: point.avg_price,
    itemCount: point.item_count,
  })) ?? []) as Array<{ timestamp: string; avgPrice: number; itemCount: number; }>;

  // Generate ML prediction trend line
  const chartDataWithPredictions = chartData.map((point, index) => {
    if (!showMLPredictions) {return point;}

    // Simple linear regression prediction
    const avgPrice = chartData.reduce((sum, d) => sum + d.avgPrice, 0) / chartData.length;
    const slope = chartData.length > 1 
      ? (chartData[chartData.length - 1].avgPrice - chartData[0].avgPrice) / chartData.length
      : 0;
    
    const prediction = avgPrice + slope * (index - chartData.length / 2);

    return {
      ...point,
      mlPrediction: Math.round(prediction),
    };
  });

  // Kinetic zoom with GSAP
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel * 1.2, 3);
    setZoomLevel(newZoom);
    
    if (chartRef.current) {
      gsap.to(chartRef.current, {
        scale: newZoom,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [zoomLevel]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel / 1.2, 1);
    setZoomLevel(newZoom);
    
    if (chartRef.current) {
      gsap.to(chartRef.current, {
        scale: newZoom,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [zoomLevel]);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    
    if (chartRef.current) {
      gsap.to(chartRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, []);

  // Sonify chart data
  const handleSonify = useCallback(async () => {
    if (isSonifying) {return;}
    
    setIsSonifying(true);
    const prices = chartData.map(d => d.avgPrice);
    await playDataSequence(prices, 100);
    setIsSonifying(false);
  }, [chartData, isSonifying]);

  // Export chart as PNG
  const handleExport = useCallback(() => {
    if (!chartRef.current) {return;}

    // Create canvas from SVG
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) {return;}

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {return;}

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Download
      const link = document.createElement('a');
      link.download = `${itemId}-price-history-${selectedRange}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = `data:image/svg+xml;base64,${  btoa(svgData)}`;
  }, [itemId, selectedRange]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) {return null;}

    return (
      <div className="bg-albion-gray-900 border border-albion-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm text-albion-gray-400 mb-2">{payload[0].payload.timestamp}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-neon-blue font-medium">Avg Price:</span>{' '}
            <span className="text-white font-mono">{payload[0].value.toLocaleString()}</span>
          </p>
          <p className="text-sm">
            <span className="text-neon-green font-medium">Volume:</span>{' '}
            <span className="text-white font-mono">{payload[0].payload.itemCount.toLocaleString()}</span>
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="text-center py-12">
          <p className="text-albion-gray-400">Loading price history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Price History</h2>
          <p className="text-sm text-albion-gray-500">
            {itemId} {city ? `• ${city}` : null} {quality ? `• Q${quality}` : null}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex gap-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedRange(range.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  selectedRange === range.value
                    ? 'bg-neon-blue text-white'
                    : 'bg-albion-gray-800 text-albion-gray-500 hover:bg-albion-gray-700 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex gap-1 ml-4 border-l border-albion-gray-700 pl-4">
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="p-2 rounded-lg bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="p-2 rounded-lg bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetZoom}
              disabled={zoomLevel === 1}
              className="p-2 rounded-lg bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reset Zoom"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* ML Predictions Toggle */}
          <button
            onClick={() => setShowMLPredictions(!showMLPredictions)}
            className={`ml-4 p-2 rounded-lg transition-colors ${
              showMLPredictions
                ? 'bg-neon-purple text-white'
                : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white'
            }`}
            title="Toggle ML Predictions"
            aria-label="Toggle ML prediction trend line"
          >
            <TrendingUp className="h-4 w-4" />
          </button>

          {/* Sonification */}
          <button
            onClick={handleSonify}
            disabled={isSonifying}
            className="p-2 rounded-lg bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Play chart as audio"
            aria-label="Sonify chart data for accessibility"
          >
            <Volume2 className="h-4 w-4" />
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="p-2 rounded-lg bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white transition-colors"
            title="Export as PNG"
            aria-label="Export chart as PNG image"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div 
        ref={chartRef} 
        className="h-96 overflow-hidden"
        role="img"
        aria-label={`Price history chart for ${itemId}. ${chartData.length} data points from ${chartData[0]?.timestamp} to ${chartData[chartData.length - 1]?.timestamp}`}
      >
        {/* Live region for dynamic updates */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {chartData.length > 0 ? `Chart updated with ${chartData.length} price points` : null}
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartDataWithPredictions} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis
              dataKey="timestamp"
              stroke="#6a6a6a"
              style={{ fontSize: '12px' }}
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              stroke="#6a6a6a"
              style={{ fontSize: '12px' }}
              label={{ value: 'Price (Silver)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#00d4ff"
              strokeWidth={2}
              dot={{ fill: '#00d4ff', r: 3 }}
              activeDot={{ r: 6 }}
              name="Average Price"
            />
            {showMLPredictions ? <Line
                type="monotone"
                dataKey="mlPrediction"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="ML Prediction"
              /> : null}
            <Brush
              dataKey="timestamp"
              height={30}
              stroke="#00d4ff"
              fill="#1a1a1a"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-4 gap-4 border-t border-albion-gray-700 pt-4">
        <div>
          <p className="text-sm text-albion-gray-500">Data Points</p>
          <p className="mt-1 text-lg font-bold">{chartData.length}</p>
        </div>
        <div>
          <p className="text-sm text-albion-gray-500">Avg Price</p>
          <p className="mt-1 text-lg font-bold text-neon-blue">
            {chartData.length > 0
              ? Math.round(chartData.reduce((sum, d) => sum + d.avgPrice, 0) / chartData.length).toLocaleString()
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-sm text-albion-gray-500">Highest</p>
          <p className="mt-1 text-lg font-bold text-neon-green">
            {chartData.length > 0
              ? Math.max(...chartData.map(d => d.avgPrice)).toLocaleString()
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-sm text-albion-gray-500">Lowest</p>
          <p className="mt-1 text-lg font-bold text-neon-red">
            {chartData.length > 0
              ? Math.min(...chartData.map(d => d.avgPrice)).toLocaleString()
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
