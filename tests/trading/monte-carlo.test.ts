/**
 * Monte Carlo Simulation Tests
 */

import { describe, test, expect } from 'vitest';
import {
  runMonteCarloSimulation,
  calculateSharpeRatio,
  calculateVaR,
  calculateCVaR,
  type SimulationInput,
} from '@/lib/trading/monte-carlo';

describe('Monte Carlo Simulation', () => {
  const baseInput: SimulationInput = {
    itemId: 'T8_MAIN_SWORD',
    buyPrice: 90000,
    sellPrice: 110000,
    quantity: 10,
    priceVolatility: 0.1,
    marketTax: 0.045,
    setupFee: 0.015,
    transportCost: 5000,
    iterations: 1000,
  };

  test('Should run simulation and return results', () => {
    const result = runMonteCarloSimulation(baseInput);

    expect(result).toBeDefined();
    expect(result.mean).toBeDefined();
    expect(result.median).toBeDefined();
    expect(result.stdDev).toBeGreaterThan(0);
    expect(result.outcomes).toHaveLength(1000);
  });

  test('Should calculate profit probability', () => {
    const result = runMonteCarloSimulation(baseInput);

    expect(result.profitProbability).toBeGreaterThanOrEqual(0);
    expect(result.profitProbability).toBeLessThanOrEqual(1);
  });

  test('Should have median close to mean for large samples', () => {
    const result = runMonteCarloSimulation({
      ...baseInput,
      iterations: 10000,
    });

    // For normal distribution, median should be close to mean
    const difference = Math.abs(result.mean - result.median);
    const tolerance = result.stdDev * 0.1; // 10% of std dev

    expect(difference).toBeLessThan(tolerance);
  });

  test('Should have confidence interval containing most outcomes', () => {
    const result = runMonteCarloSimulation(baseInput);

    const withinInterval = result.outcomes.filter(
      (outcome) =>
        outcome >= result.confidenceInterval.lower &&
        outcome <= result.confidenceInterval.upper
    ).length;

    const percentage = withinInterval / result.outcomes.length;

    // Should be around 90% (5th to 95th percentile)
    expect(percentage).toBeGreaterThan(0.85);
    expect(percentage).toBeLessThan(0.95);
  });

  test('Should handle zero volatility', () => {
    const result = runMonteCarloSimulation({
      ...baseInput,
      priceVolatility: 0,
      iterations: 100,
    });

    // With zero volatility, all outcomes should be identical
    const uniqueOutcomes = new Set(result.outcomes).size;
    expect(uniqueOutcomes).toBe(1);
    expect(result.stdDev).toBe(0);
  });

  test('Should handle high volatility', () => {
    const lowVolResult = runMonteCarloSimulation({
      ...baseInput,
      priceVolatility: 0.05,
    });

    const highVolResult = runMonteCarloSimulation({
      ...baseInput,
      priceVolatility: 0.3,
    });

    // Higher volatility should result in higher standard deviation
    expect(highVolResult.stdDev).toBeGreaterThan(lowVolResult.stdDev);
    expect(highVolResult.max - highVolResult.min).toBeGreaterThan(
      lowVolResult.max - lowVolResult.min
    );
  });

  test('Should calculate Sharpe ratio', () => {
    const result = runMonteCarloSimulation(baseInput);
    const sharpe = calculateSharpeRatio(result);

    expect(sharpe).toBeDefined();
    expect(typeof sharpe).toBe('number');
  });

  test('Should calculate Value at Risk (VaR)', () => {
    const result = runMonteCarloSimulation(baseInput);
    const var95 = calculateVaR(result, 0.95);

    expect(var95).toBeGreaterThanOrEqual(0);
    expect(typeof var95).toBe('number');
  });

  test('Should calculate Conditional VaR (CVaR)', () => {
    const result = runMonteCarloSimulation(baseInput);
    const cvar95 = calculateCVaR(result, 0.95);

    expect(cvar95).toBeGreaterThanOrEqual(0);
    expect(typeof cvar95).toBe('number');
    
    // CVaR should be >= VaR
    const var95 = calculateVaR(result, 0.95);
    expect(cvar95).toBeGreaterThanOrEqual(var95);
  });

  test('Should have expected value close to mean', () => {
    const result = runMonteCarloSimulation(baseInput);

    expect(result.expectedValue).toBe(result.mean);
  });

  test('Should create distribution histogram', () => {
    const result = runMonteCarloSimulation(baseInput);

    expect(result.distribution).toBeDefined();
    expect(Array.isArray(result.distribution)).toBe(true);
    expect(result.distribution.length).toBeGreaterThan(0);

    // Sum of histogram should equal total iterations
    const totalCount = result.distribution.reduce((sum, count) => sum + count, 0);
    expect(totalCount).toBe(baseInput.iterations);
  });

  test('Should handle unprofitable trades', () => {
    const result = runMonteCarloSimulation({
      ...baseInput,
      buyPrice: 110000,
      sellPrice: 90000, // Selling for less than buying
    });

    expect(result.profitProbability).toBeLessThan(0.5);
    expect(result.expectedValue).toBeLessThan(0);
  });

  test('Should be deterministic with same seed (approximately)', () => {
    // Run multiple times and check consistency
    const results = [];
    for (let i = 0; i < 3; i++) {
      results.push(runMonteCarloSimulation({
        ...baseInput,
        iterations: 10000,
      }));
    }

    // Means should be similar (within 5%)
    const means = results.map((r) => r.mean);
    const avgMean = means.reduce((sum, m) => sum + m, 0) / means.length;
    
    for (const mean of means) {
      const difference = Math.abs(mean - avgMean);
      const tolerance = avgMean * 0.05;
      expect(difference).toBeLessThan(tolerance);
    }
  });

  test('Should handle large quantities', () => {
    const result = runMonteCarloSimulation({
      ...baseInput,
      quantity: 1000,
    });

    expect(result).toBeDefined();
    expect(Math.abs(result.mean)).toBeGreaterThan(Math.abs(baseInput.quantity * 100));
  });

  test('Should handle small iterations', () => {
    const result = runMonteCarloSimulation({
      ...baseInput,
      iterations: 10,
    });

    expect(result.outcomes).toHaveLength(10);
    expect(result).toBeDefined();
  });
});
