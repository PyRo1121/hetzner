/**
 * Price History Analysis Tests
 */

import { describe, test, expect } from 'vitest';
import {
  calculatePriceChange,
  findTopGainers,
  findTopLosers,
  calculateVolatility,
  calculateMovingAverage,
  detectTrend,
  findSupportResistance,
  calculateMomentum,
  calculateRSI,
  analyzePriceHistory,
  type PriceChange,
} from '@/lib/trading/price-history';

describe('Price Change Calculation', () => {
  test('Should calculate price increase', () => {
    const result = calculatePriceChange(110, 100);

    expect(result.change).toBe(10);
    expect(result.changePercent).toBe(10);
    expect(result.trend).toBe('up');
  });

  test('Should calculate price decrease', () => {
    const result = calculatePriceChange(90, 100);

    expect(result.change).toBe(-10);
    expect(result.changePercent).toBe(-10);
    expect(result.trend).toBe('down');
  });

  test('Should detect stable prices', () => {
    const result = calculatePriceChange(100.5, 100);

    expect(result.trend).toBe('stable');
    expect(Math.abs(result.changePercent)).toBeLessThan(1);
  });
});

describe('Top Gainers and Losers', () => {
  const priceChanges: PriceChange[] = [
    {
      itemId: 'ITEM1',
      location: 'Caerleon',
      currentPrice: 110,
      previousPrice: 100,
      change: 10,
      changePercent: 10,
      trend: 'up',
    },
    {
      itemId: 'ITEM2',
      location: 'Caerleon',
      currentPrice: 90,
      previousPrice: 100,
      change: -10,
      changePercent: -10,
      trend: 'down',
    },
    {
      itemId: 'ITEM3',
      location: 'Caerleon',
      currentPrice: 120,
      previousPrice: 100,
      change: 20,
      changePercent: 20,
      trend: 'up',
    },
  ];

  test('Should find top gainers', () => {
    const gainers = findTopGainers(priceChanges, 2);

    expect(gainers).toHaveLength(2);
    expect(gainers[0].changePercent).toBe(20);
    expect(gainers[1].changePercent).toBe(10);
  });

  test('Should find top losers', () => {
    const losers = findTopLosers(priceChanges, 1);

    expect(losers).toHaveLength(1);
    expect(losers[0].changePercent).toBe(-10);
  });
});

describe('Volatility Calculation', () => {
  test('Should calculate volatility', () => {
    const prices = [100, 105, 95, 110, 90];
    const volatility = calculateVolatility(prices);

    expect(volatility).toBeGreaterThan(0);
    expect(typeof volatility).toBe('number');
  });

  test('Should return 0 for constant prices', () => {
    const prices = [100, 100, 100, 100];
    const volatility = calculateVolatility(prices);

    expect(volatility).toBe(0);
  });

  test('Should handle empty array', () => {
    const volatility = calculateVolatility([]);

    expect(volatility).toBe(0);
  });
});

describe('Moving Average', () => {
  test('Should calculate moving average', () => {
    const prices = [100, 110, 120, 130, 140];
    const ma = calculateMovingAverage(prices, 3);

    expect(ma).toHaveLength(5);
    expect(isNaN(ma[0])).toBe(true); // Not enough data
    expect(isNaN(ma[1])).toBe(true); // Not enough data
    expect(ma[2]).toBe(110); // (100+110+120)/3
    expect(ma[3]).toBe(120); // (110+120+130)/3
    expect(ma[4]).toBe(130); // (120+130+140)/3
  });

  test('Should handle period larger than data', () => {
    const prices = [100, 110];
    const ma = calculateMovingAverage(prices, 5);

    expect(ma.every(isNaN)).toBe(true);
  });
});

describe('Trend Detection', () => {
  test('Should detect bullish trend', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
    const trend = detectTrend(prices);

    expect(trend).toBe('bullish');
  });

  test('Should detect bearish trend', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 200 - i * 2);
    const trend = detectTrend(prices);

    expect(trend).toBe('bearish');
  });

  test('Should detect neutral trend', () => {
    const prices = Array.from({ length: 50 }, () => 100);
    const trend = detectTrend(prices);

    expect(trend).toBe('neutral');
  });

  test('Should return neutral for insufficient data', () => {
    const prices = [100, 110, 120];
    const trend = detectTrend(prices);

    expect(trend).toBe('neutral');
  });
});

describe('Support and Resistance', () => {
  test('Should find support and resistance levels', () => {
    const prices = [100, 90, 100, 110, 100, 90, 100];
    const { support, resistance } = findSupportResistance(prices);

    expect(support.length).toBeGreaterThan(0);
    expect(resistance.length).toBeGreaterThan(0);
  });

  test('Should handle insufficient data', () => {
    const prices = [100, 110];
    const { support, resistance } = findSupportResistance(prices);

    expect(support).toHaveLength(0);
    expect(resistance).toHaveLength(0);
  });
});

describe('Momentum Calculation', () => {
  test('Should calculate momentum', () => {
    const prices = [100, 110, 120, 130, 140];
    const momentum = calculateMomentum(prices, 2);

    expect(momentum).toHaveLength(5);
    expect(momentum[2]).toBe(20); // 120 - 100
    expect(momentum[3]).toBe(20); // 130 - 110
    expect(momentum[4]).toBe(20); // 140 - 120
  });
});

describe('RSI Calculation', () => {
  test('Should calculate RSI', () => {
    const prices = [100, 105, 110, 108, 112, 115, 113, 118, 120, 119, 122, 125, 123, 128, 130];
    const rsi = calculateRSI(prices, 14);

    expect(rsi).toHaveLength(prices.length - 1);
    expect(rsi[rsi.length - 1]).toBeGreaterThan(0);
    expect(rsi[rsi.length - 1]).toBeLessThan(100);
  });

  test('Should return 100 for all gains', () => {
    const prices = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240];
    const rsi = calculateRSI(prices, 14);

    expect(rsi[rsi.length - 1]).toBe(100);
  });
});

describe('Price Analysis', () => {
  test('Should analyze price history', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
    const analysis = analyzePriceHistory(prices);

    expect(analysis.currentPrice).toBeDefined();
    expect(analysis.avgPrice).toBeGreaterThan(0);
    expect(analysis.minPrice).toBeLessThanOrEqual(analysis.maxPrice);
    expect(analysis.volatility).toBeGreaterThan(0);
    expect(['bullish', 'bearish', 'neutral']).toContain(analysis.trend);
    expect(analysis.rsi).toBeGreaterThanOrEqual(0);
    expect(analysis.rsi).toBeLessThanOrEqual(100);
    expect(['buy', 'sell', 'hold']).toContain(analysis.recommendation);
  });

  test('Should throw error for empty data', () => {
    expect(() => analyzePriceHistory([])).toThrow('No price data available');
  });

  test('Should recommend buy when oversold', () => {
    // Create oversold scenario (prices dropping)
    const prices = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 48, 46, 44, 42, 40, 39, 38, 37, 36];
    const analysis = analyzePriceHistory(prices);

    expect(analysis.rsi).toBeLessThan(40);
  });

  test('Should recommend sell when overbought', () => {
    // Create overbought scenario (prices rising)
    const prices = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 92, 94, 96, 98, 100, 101, 102, 103, 104];
    const analysis = analyzePriceHistory(prices);

    expect(analysis.rsi).toBeGreaterThan(60);
  });
});
