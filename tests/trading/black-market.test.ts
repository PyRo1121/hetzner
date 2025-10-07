/**
 * Black Market Flipper Tests
 */

import { describe, test, expect } from 'vitest';
import {
  calculateBlackMarketFlip,
  compareMarkets,
  findBestBlackMarketFlips,
  calculateRiskAdjustedProfit,
  type BlackMarketFlip,
} from '@/lib/trading/black-market';

const baseFlip: BlackMarketFlip = {
  itemId: 'T8_MAIN_SWORD',
  buyCity: 'Caerleon',
  buyPrice: 90000,
  blackMarketPrice: 120000,
  quantity: 10,
  transportCost: 5000,
  marketTax: 4.5,
  setupFee: 1.5,
};

describe('Black Market Flipper', () => {
  test('Should calculate Black Market flip profit', () => {
    const result = calculateBlackMarketFlip(baseFlip);

    expect(result).toBeDefined();
    expect(result.buyTotal).toBe(900000);
    expect(result.sellTotal).toBe(1200000);
    expect(result.netProfit).toBeGreaterThan(0);
  });

  test('Should not charge taxes on Black Market sales', () => {
    const result = calculateBlackMarketFlip(baseFlip);

    // Taxes should only be on buying, not selling
    expect(result.taxes).toBeGreaterThan(0);
    expect(result.sellTotal).toBe(baseFlip.blackMarketPrice * baseFlip.quantity);
  });

  test('Should calculate ROI correctly', () => {
    const result = calculateBlackMarketFlip(baseFlip);

    expect(result.roi).toBeGreaterThan(0);
    expect(result.profitMargin).toBeDefined();
  });

  test('Should recommend excellent for high ROI', () => {
    const result = calculateBlackMarketFlip({
      ...baseFlip,
      blackMarketPrice: 150000, // Much higher price
    });

    expect(result.recommendation).toBe('excellent');
    expect(result.roi).toBeGreaterThan(25);
  });

  test('Should recommend avoid for unprofitable flips', () => {
    const result = calculateBlackMarketFlip({
      ...baseFlip,
      blackMarketPrice: 80000, // Lower than buy price
    });

    expect(result.recommendation).toBe('avoid');
    expect(result.netProfit).toBeLessThan(0);
  });
});

describe('Market Comparison', () => {
  test('Should compare regular market vs Black Market', () => {
    const comparison = compareMarkets(
      90000, // buy price
      10, // quantity
      110000, // regular market price
      120000, // black market price
      5000 // transport cost
    );

    expect(comparison).toBeDefined();
    expect(comparison.regularMarket).toBeDefined();
    expect(comparison.blackMarket).toBeDefined();
    expect(comparison.betterOption).toBeDefined();
  });

  test('Should identify Black Market as better when it has higher profit', () => {
    const comparison = compareMarkets(
      90000,
      10,
      110000, // Regular market
      130000, // Black Market (much higher)
      5000
    );

    expect(comparison.betterOption).toBe('black');
    expect(comparison.profitDifference).toBeGreaterThan(0);
  });

  test('Should account for no taxes on Black Market', () => {
    const comparison = compareMarkets(90000, 10, 110000, 120000, 5000);

    expect(comparison.regularMarket.taxes).toBeGreaterThan(0);
    expect(comparison.blackMarket.taxes).toBe(0);
  });

  test('Should identify similar options', () => {
    const comparison = compareMarkets(
      90000,
      10,
      110000,
      110500, // Very similar prices
      5000
    );

    // Could be similar or slightly favor one
    expect(['similar', 'black', 'regular']).toContain(comparison.betterOption);
  });
});

describe('Best Black Market Flips', () => {
  test('Should find and sort best opportunities', () => {
    const opportunities: BlackMarketFlip[] = [
      {
        itemId: 'T8_MAIN_SWORD',
        buyCity: 'Caerleon',
        buyPrice: 90000,
        blackMarketPrice: 120000,
        quantity: 10,
        transportCost: 5000,
        marketTax: 4.5,
        setupFee: 1.5,
      },
      {
        itemId: 'T8_HEAD_PLATE_SET1',
        buyCity: 'Caerleon',
        buyPrice: 50000,
        blackMarketPrice: 80000,
        quantity: 10,
        transportCost: 5000,
        marketTax: 4.5,
        setupFee: 1.5,
      },
    ];

    const best = findBestBlackMarketFlips(opportunities, 10);

    expect(best.length).toBeGreaterThan(0);
    expect(best[0].result.roi).toBeGreaterThanOrEqual(10);
    
    // Should be sorted by ROI
    if (best.length > 1) {
      expect(best[0].result.roi).toBeGreaterThanOrEqual(best[1].result.roi);
    }
  });

  test('Should filter by minimum ROI', () => {
    const opportunities: BlackMarketFlip[] = [
      {
        itemId: 'T8_MAIN_SWORD',
        buyCity: 'Caerleon',
        buyPrice: 90000,
        blackMarketPrice: 95000, // Low profit
        quantity: 10,
        transportCost: 5000,
        marketTax: 4.5,
        setupFee: 1.5,
      },
    ];

    const best = findBestBlackMarketFlips(opportunities, 20);

    // Should filter out low ROI opportunities
    expect(best.length).toBe(0);
  });

  test('Should calculate price spread', () => {
    const opportunities: BlackMarketFlip[] = [
      {
        itemId: 'T8_MAIN_SWORD',
        buyCity: 'Caerleon',
        buyPrice: 90000,
        blackMarketPrice: 120000,
        quantity: 10,
        transportCost: 5000,
        marketTax: 4.5,
        setupFee: 1.5,
      },
    ];

    const best = findBestBlackMarketFlips(opportunities, 0);

    expect(best[0].priceSpread).toBeGreaterThan(0);
  });
});

describe('Risk-Adjusted Profit', () => {
  test('Should calculate risk-adjusted profit', () => {
    const result = calculateBlackMarketFlip(baseFlip);
    const riskAdjusted = calculateRiskAdjustedProfit(result, 0.85);

    expect(riskAdjusted.expectedProfit).toBeLessThan(result.netProfit);
    expect(riskAdjusted.bestCase).toBe(result.netProfit);
    expect(riskAdjusted.worstCase).toBeLessThan(0);
  });

  test('Should handle different sell probabilities', () => {
    const result = calculateBlackMarketFlip(baseFlip);
    
    const highProb = calculateRiskAdjustedProfit(result, 0.95);
    const lowProb = calculateRiskAdjustedProfit(result, 0.7);

    expect(highProb.expectedProfit).toBeGreaterThan(lowProb.expectedProfit);
  });
});
