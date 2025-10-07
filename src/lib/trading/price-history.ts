/**
 * Price History Analysis
 * Fetch and analyze historical price data from AODP API
 */

export interface PriceHistoryPoint {
  timestamp: string;
  avgPrice: number;
  itemCount: number;
}

export interface PriceHistoryData {
  itemId: string;
  location: string;
  quality: number;
  data: PriceHistoryPoint[];
  timeScale: 1 | 6 | 24; // 1=hourly, 6=6-hour, 24=daily
}

export interface PriceChange {
  itemId: string;
  location: string;
  currentPrice: number;
  previousPrice: number;
  change: number; // absolute change
  changePercent: number; // percentage change
  trend: 'up' | 'down' | 'stable';
}

/**
 * Calculate price change between two time periods
 */
export function calculatePriceChange(
  currentPrice: number,
  previousPrice: number
): {
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
} {
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

  let trend: 'up' | 'down' | 'stable';
  if (Math.abs(changePercent) < 1) {
    trend = 'stable';
  } else if (changePercent > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }

  return { change, changePercent, trend };
}

/**
 * Find top price gainers from historical data
 */
export function findTopGainers(
  priceChanges: PriceChange[],
  limit: number = 10
): PriceChange[] {
  return priceChanges
    .filter((pc) => pc.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, limit);
}

/**
 * Find top price losers from historical data
 */
export function findTopLosers(
  priceChanges: PriceChange[],
  limit: number = 10
): PriceChange[] {
  return priceChanges
    .filter((pc) => pc.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, limit);
}

/**
 * Calculate price volatility (standard deviation)
 */
export function calculateVolatility(prices: number[]): number {
  if (prices.length === 0) {return 0;}

  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const squaredDiffs = prices.map((price) => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;

  return Math.sqrt(variance);
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  prices: number[],
  period: number
): number[] {
  const result: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN); // Not enough data points yet
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, price) => sum + price, 0) / period;
      result.push(avg);
    }
  }

  return result;
}

/**
 * Detect price trends using moving averages
 */
export function detectTrend(
  prices: number[],
  shortPeriod: number = 7,
  longPeriod: number = 30
): 'bullish' | 'bearish' | 'neutral' {
  if (prices.length < longPeriod) {return 'neutral';}

  const shortMA = calculateMovingAverage(prices, shortPeriod);
  const longMA = calculateMovingAverage(prices, longPeriod);

  const latestShort = shortMA[shortMA.length - 1];
  const latestLong = longMA[longMA.length - 1];

  if (isNaN(latestShort) || isNaN(latestLong)) {return 'neutral';}

  const difference = ((latestShort - latestLong) / latestLong) * 100;

  if (difference > 2) {return 'bullish';}
  if (difference < -2) {return 'bearish';}
  return 'neutral';
}

/**
 * Find support and resistance levels
 */
export function findSupportResistance(
  prices: number[],
  tolerance: number = 0.02 // 2% tolerance
): {
  support: number[];
  resistance: number[];
} {
  if (prices.length < 3) {return { support: [], resistance: [] };}

  const support: number[] = [];
  const resistance: number[] = [];

  // Find local minima (support) and maxima (resistance)
  for (let i = 1; i < prices.length - 1; i++) {
    const prev = prices[i - 1];
    const current = prices[i];
    const next = prices[i + 1];

    // Local minimum (support)
    if (current < prev && current < next) {
      support.push(current);
    }

    // Local maximum (resistance)
    if (current > prev && current > next) {
      resistance.push(current);
    }
  }

  // Cluster similar levels
  const clusterLevels = (levels: number[]): number[] => {
    if (levels.length === 0) {return [];}

    const sorted = [...levels].sort((a, b) => a - b);
    const clustered: number[] = [];
    let currentCluster = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.abs(sorted[i] - sorted[i - 1]) / sorted[i - 1];

      if (diff <= tolerance) {
        currentCluster.push(sorted[i]);
      } else {
        // Calculate average of cluster
        const avg = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length;
        clustered.push(avg);
        currentCluster = [sorted[i]];
      }
    }

    // Add last cluster
    const avg = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length;
    clustered.push(avg);

    return clustered;
  };

  return {
    support: clusterLevels(support),
    resistance: clusterLevels(resistance),
  };
}

/**
 * Calculate price momentum
 */
export function calculateMomentum(
  prices: number[],
  period: number = 14
): number[] {
  const momentum: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      momentum.push(0);
    } else {
      const change = prices[i] - prices[i - period];
      momentum.push(change);
    }
  }

  return momentum;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate RSI
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(50); // Neutral until we have enough data
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((sum, g) => sum + g, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((sum, l) => sum + l, 0) / period;

      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }
  }

  return rsi;
}

/**
 * Analyze price history and provide insights
 */
export interface PriceAnalysis {
  currentPrice: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  rsi: number; // Latest RSI value
  support: number[];
  resistance: number[];
  recommendation: 'buy' | 'sell' | 'hold';
}

export function analyzePriceHistory(prices: number[]): PriceAnalysis {
  if (prices.length === 0) {
    throw new Error('No price data available');
  }

  const currentPrice = prices[prices.length - 1];
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const volatility = calculateVolatility(prices);
  const trend = detectTrend(prices);
  const rsiValues = calculateRSI(prices);
  const rsi = rsiValues[rsiValues.length - 1];
  const { support, resistance } = findSupportResistance(prices);

  // Generate recommendation
  let recommendation: 'buy' | 'sell' | 'hold';
  if (rsi < 30 && trend !== 'bearish') {
    recommendation = 'buy'; // Oversold
  } else if (rsi > 70 && trend !== 'bullish') {
    recommendation = 'sell'; // Overbought
  } else {
    recommendation = 'hold';
  }

  return {
    currentPrice,
    avgPrice,
    minPrice,
    maxPrice,
    volatility,
    trend,
    rsi,
    support,
    resistance,
    recommendation,
  };
}
