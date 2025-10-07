'use client';

import { useMemo } from 'react';

import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { formatSilver } from '@/lib/trading/arbitrage';
import {
  calculateMovingAverage,
  calculateRSI,
  findSupportResistance,
  analyzePriceHistory,
  type PriceHistoryPoint,
} from '@/lib/trading/price-history';

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
  itemId: string;
  location: string;
  showMA?: boolean;
  showRSI?: boolean;
  showSupportResistance?: boolean;
}

export function PriceHistoryChart({
  data,
  itemId,
  location,
  showMA = true,
  showRSI = false,
  showSupportResistance = true,
}: PriceHistoryChartProps) {
  // Process data for chart
  const chartData = useMemo(() => {
    const prices = data.map((d) => d.avgPrice);
    const ma7 = showMA ? calculateMovingAverage(prices, 7) : [];
    const ma30 = showMA ? calculateMovingAverage(prices, 30) : [];
    const rsi = showRSI ? calculateRSI(prices, 14) : [];

    return data.map((point, index) => ({
      timestamp: new Date(point.timestamp).toLocaleDateString(),
      price: point.avgPrice,
      ma7: ma7[index],
      ma30: ma30[index],
      rsi: rsi[index],
    }));
  }, [data, showMA, showRSI]);

  // Calculate analysis
  const analysis = useMemo(() => {
    const prices = data.map((d) => d.avgPrice);
    return analyzePriceHistory(prices);
  }, [data]);

  // Get support and resistance levels
  const { support, resistance } = useMemo(() => {
    if (!showSupportResistance) {return { support: [], resistance: [] };}
    const prices = data.map((d) => d.avgPrice);
    return findSupportResistance(prices);
  }, [data, showSupportResistance]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) {return null;}

    return (
      <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-3 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-white">{payload[0].payload.timestamp}</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-albion-gray-500">Price:</span>
            <span className="font-semibold text-neon-blue">{formatSilver(payload[0].value)}</span>
          </div>
          {showMA && payload[1] && !isNaN(payload[1].value) ? <div className="flex items-center justify-between gap-4">
              <span className="text-albion-gray-500">MA(7):</span>
              <span className="font-semibold text-neon-green">{formatSilver(payload[1].value)}</span>
            </div> : null}
          {showMA && payload[2] && !isNaN(payload[2].value) ? <div className="flex items-center justify-between gap-4">
              <span className="text-albion-gray-500">MA(30):</span>
              <span className="font-semibold text-neon-gold">{formatSilver(payload[2].value)}</span>
            </div> : null}
          {showRSI && payload[3] && !isNaN(payload[3].value) ? <div className="flex items-center justify-between gap-4">
              <span className="text-albion-gray-500">RSI:</span>
              <span className="font-semibold text-neon-purple">{payload[3].value.toFixed(1)}</span>
            </div> : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Analysis */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{itemId}</h3>
          <p className="text-sm text-albion-gray-500">{location}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Current Price */}
          <div className="text-right">
            <div className="text-xs text-albion-gray-500">Current</div>
            <div className="text-xl font-bold text-white">
              {formatSilver(analysis.currentPrice)}
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center gap-2">
            {analysis.trend === 'bullish' ? <div className="flex items-center gap-1 rounded-full bg-neon-green/20 px-3 py-1">
                <TrendingUp className="h-4 w-4 text-neon-green" />
                <span className="text-xs font-semibold text-neon-green">Bullish</span>
              </div> : null}
            {analysis.trend === 'bearish' ? <div className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs font-semibold text-red-500">Bearish</span>
              </div> : null}
            {analysis.trend === 'neutral' ? <div className="flex items-center gap-1 rounded-full bg-albion-gray-700 px-3 py-1">
                <Activity className="h-4 w-4 text-albion-gray-400" />
                <span className="text-xs font-semibold text-albion-gray-400">Neutral</span>
              </div> : null}
          </div>

          {/* Recommendation */}
          <div className="text-right">
            <div className="text-xs text-albion-gray-500">Signal</div>
            <div
              className={`text-sm font-bold ${
                analysis.recommendation === 'buy'
                  ? 'text-neon-green'
                  : analysis.recommendation === 'sell'
                    ? 'text-red-500'
                    : 'text-albion-gray-400'
              }`}
            >
              {analysis.recommendation.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-albion-gray-800 p-3">
          <div className="text-xs text-albion-gray-500">Average</div>
          <div className="text-lg font-semibold text-white">{formatSilver(analysis.avgPrice)}</div>
        </div>
        <div className="rounded-lg bg-albion-gray-800 p-3">
          <div className="text-xs text-albion-gray-500">Min / Max</div>
          <div className="text-sm font-semibold text-white">
            {formatSilver(analysis.minPrice)} / {formatSilver(analysis.maxPrice)}
          </div>
        </div>
        <div className="rounded-lg bg-albion-gray-800 p-3">
          <div className="text-xs text-albion-gray-500">Volatility</div>
          <div className="text-lg font-semibold text-white">{formatSilver(analysis.volatility)}</div>
        </div>
        <div className="rounded-lg bg-albion-gray-800 p-3">
          <div className="text-xs text-albion-gray-500">RSI</div>
          <div
            className={`text-lg font-semibold ${
              analysis.rsi < 30
                ? 'text-neon-green'
                : analysis.rsi > 70
                  ? 'text-red-500'
                  : 'text-white'
            }`}
          >
            {analysis.rsi.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="rounded-lg bg-albion-gray-800 p-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />

            {/* Support Lines */}
            {showSupportResistance ? support.map((level, index) => (
                <ReferenceLine
                  key={`support-${index}`}
                  y={level}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: `Support: ${formatSilver(level)}`,
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'left',
                  }}
                />
              )) : null}

            {/* Resistance Lines */}
            {showSupportResistance ? resistance.map((level, index) => (
                <ReferenceLine
                  key={`resistance-${index}`}
                  y={level}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: `Resistance: ${formatSilver(level)}`,
                    fill: '#ef4444',
                    fontSize: 10,
                    position: 'right',
                  }}
                />
              )) : null}

            {/* Price Line */}
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Price"
            />

            {/* Moving Averages */}
            {showMA ? <>
                <Line
                  type="monotone"
                  dataKey="ma7"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                  name="MA(7)"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="ma30"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  name="MA(30)"
                  connectNulls
                />
              </> : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* RSI Chart */}
      {showRSI ? <div className="rounded-lg bg-albion-gray-800 p-4">
          <h4 className="mb-2 text-sm font-semibold text-white">RSI (14)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                stroke="#9CA3AF"
                style={{ fontSize: '10px' }}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#9CA3AF"
                style={{ fontSize: '10px' }}
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label="Overbought" />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label="Oversold" />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div> : null}
    </div>
  );
}
