/**
 * Arbitrage Calculator Tests
 */

import { describe, test, expect } from 'vitest';
import {
  calculateArbitrage,
  getCityDistance,
  calculateTransportCost,
  findBestOpportunities,
  formatSilver,
  type ArbitrageInput,
  type TransportCosts,
} from '@/lib/trading/arbitrage';

describe('Arbitrage Calculator', () => {
  test('Should calculate basic arbitrage profit', () => {
    const input: ArbitrageInput = {
      itemId: 'T8_MAIN_SWORD',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      buyPrice: 90000,
      sellPrice: 110000,
      quantity: 10,
    };

    const result = calculateArbitrage(input);

    expect(result.grossProfit).toBe(200000); // (110000 - 90000) * 10
    expect(result.netProfit).toBeGreaterThan(0);
    expect(result.totalCost).toBe(900000);
    expect(result.totalRevenue).toBe(1100000);
  });

  test('Should include transport costs in calculations', () => {
    const input: ArbitrageInput = {
      itemId: 'T8_MAIN_SWORD',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      buyPrice: 90000,
      sellPrice: 110000,
      quantity: 10,
    };

    const transport: TransportCosts = {
      mountType: 'horse',
      weight: 50,
      distance: 6,
      riskFactor: 0.3,
    };

    const result = calculateArbitrage(input, transport);

    expect(result.transportCost).toBeGreaterThan(0);
    expect(result.netProfit).toBeLessThan(result.grossProfit);
  });

  test('Should calculate market taxes correctly', () => {
    const input: ArbitrageInput = {
      itemId: 'T8_MAIN_SWORD',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      buyPrice: 100000,
      sellPrice: 100000,
      quantity: 1,
    };

    const result = calculateArbitrage(input);

    // Market tax should be 4.5% of sell price
    expect(result.marketTax).toBe(4500);
    // Setup fee should be 1.5% of sell price
    expect(result.setupFee).toBe(1500);
  });

  test('Should calculate ROI correctly', () => {
    const input: ArbitrageInput = {
      itemId: 'T8_MAIN_SWORD',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      buyPrice: 100000,
      sellPrice: 120000,
      quantity: 10,
    };

    const result = calculateArbitrage(input);

    expect(result.roi).toBeGreaterThan(0);
    expect(result.profitMargin).toBeGreaterThan(0);
  });

  test('Should recommend "avoid" for unprofitable trades', () => {
    const input: ArbitrageInput = {
      itemId: 'T8_MAIN_SWORD',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      buyPrice: 110000,
      sellPrice: 100000, // Selling for less than buying
      quantity: 10,
    };

    const result = calculateArbitrage(input);

    expect(result.netProfit).toBeLessThan(0);
    expect(result.recommendation).toBe('avoid');
  });

  test('Should recommend "excellent" for high ROI trades', () => {
    const input: ArbitrageInput = {
      itemId: 'T8_MAIN_SWORD',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      buyPrice: 80000,
      sellPrice: 110000,
      quantity: 10,
    };

    const result = calculateArbitrage(input);

    expect(result.roi).toBeGreaterThan(20);
    expect(result.recommendation).toBe('excellent');
  });

  test('Should calculate city distances', () => {
    const distance = getCityDistance('Caerleon', 'Bridgewatch');
    expect(distance).toBe(8);

    const sameCity = getCityDistance('Caerleon', 'Caerleon');
    expect(sameCity).toBe(0);
  });

  test('Should calculate transport costs with risk factor', () => {
    const transport: TransportCosts = {
      mountType: 'horse',
      weight: 100,
      distance: 10,
      riskFactor: 0.5,
    };

    const cost = calculateTransportCost(transport);
    expect(cost).toBeGreaterThan(0);

    // Higher risk should increase cost
    const highRiskTransport: TransportCosts = {
      ...transport,
      riskFactor: 1.0,
    };

    const highRiskCost = calculateTransportCost(highRiskTransport);
    expect(highRiskCost).toBeGreaterThan(cost);
  });

  test('Should find best opportunities from a list', () => {
    const opportunities: Array<ArbitrageInput> = [
      {
        itemId: 'T8_MAIN_SWORD',
        buyCity: 'Martlock',
        sellCity: 'Caerleon',
        buyPrice: 90000,
        sellPrice: 120000,
        quantity: 10,
      },
      {
        itemId: 'T8_HEAD_PLATE_SET1',
        buyCity: 'Lymhurst',
        sellCity: 'Caerleon',
        buyPrice: 50000,
        sellPrice: 55000,
        quantity: 10,
      },
      {
        itemId: 'T8_ARMOR_PLATE_SET1',
        buyCity: 'Thetford',
        sellCity: 'Caerleon',
        buyPrice: 100000,
        sellPrice: 90000, // Unprofitable
        quantity: 10,
      },
    ];

    const best = findBestOpportunities(opportunities, 5);

    expect(best.length).toBeGreaterThan(0);
    expect(best[0].result.roi).toBeGreaterThanOrEqual(5);
    // Results should be sorted by ROI descending
    if (best.length > 1) {
      expect(best[0].result.roi).toBeGreaterThanOrEqual(best[1].result.roi);
    }
  });

  test('Should format silver amounts correctly', () => {
    expect(formatSilver(1500000)).toBe('1.50M');
    expect(formatSilver(50000)).toBe('50.0K');
    expect(formatSilver(500)).toBe('500');
  });

  test('Should calculate break-even quantity', () => {
    const input: ArbitrageInput = {
      itemId: 'T8_MAIN_SWORD',
      buyCity: 'Martlock',
      sellCity: 'Caerleon',
      buyPrice: 90000,
      sellPrice: 110000,
      quantity: 1,
    };

    const transport: TransportCosts = {
      mountType: 'horse',
      weight: 50,
      distance: 6,
      riskFactor: 0.3,
    };

    const result = calculateArbitrage(input, transport);

    expect(result.breakEvenQuantity).toBeGreaterThan(0);
    expect(result.breakEvenQuantity).toBeLessThan(Infinity);
  });
});
