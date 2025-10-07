/**
 * Trading Validation Tests
 */

import { describe, test, expect } from 'vitest';
import {
  validateArbitrageInput,
  validateTransportCosts,
  validatePriceRange,
  validateQuantityRange,
  sanitizeNumericInput,
  sanitizeItemId,
  isPriceReasonable,
  isQuantityReasonable,
  formatValidationErrors,
} from '@/lib/validation/trading';

describe('Trading Validation', () => {
  describe('Arbitrage Input Validation', () => {
    test('Should accept valid arbitrage input', () => {
      const input = {
        itemId: 'T8_MAIN_SWORD',
        buyCity: 'Martlock',
        sellCity: 'Caerleon',
        buyPrice: 90000,
        sellPrice: 110000,
        quantity: 10,
        quality: 1,
      };

      const result = validateArbitrageInput(input);
      expect(result.success).toBe(true);
    });

    test('Should reject same buy and sell cities', () => {
      const input = {
        itemId: 'T8_MAIN_SWORD',
        buyCity: 'Caerleon',
        sellCity: 'Caerleon',
        buyPrice: 90000,
        sellPrice: 110000,
        quantity: 10,
      };

      const result = validateArbitrageInput(input);
      expect(result.success).toBe(false);
    });

    test('Should reject invalid city names', () => {
      const input = {
        itemId: 'T8_MAIN_SWORD',
        buyCity: 'InvalidCity',
        sellCity: 'Caerleon',
        buyPrice: 90000,
        sellPrice: 110000,
        quantity: 10,
      };

      const result = validateArbitrageInput(input);
      expect(result.success).toBe(false);
    });

    test('Should reject negative prices', () => {
      const input = {
        itemId: 'T8_MAIN_SWORD',
        buyCity: 'Martlock',
        sellCity: 'Caerleon',
        buyPrice: -1000,
        sellPrice: 110000,
        quantity: 10,
      };

      const result = validateArbitrageInput(input);
      expect(result.success).toBe(false);
    });

    test('Should reject invalid item IDs', () => {
      const input = {
        itemId: 'invalid item id!',
        buyCity: 'Martlock',
        sellCity: 'Caerleon',
        buyPrice: 90000,
        sellPrice: 110000,
        quantity: 10,
      };

      const result = validateArbitrageInput(input);
      expect(result.success).toBe(false);
    });

    test('Should reject quantity exceeding maximum', () => {
      const input = {
        itemId: 'T8_MAIN_SWORD',
        buyCity: 'Martlock',
        sellCity: 'Caerleon',
        buyPrice: 90000,
        sellPrice: 110000,
        quantity: 20000,
      };

      const result = validateArbitrageInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe('Transport Costs Validation', () => {
    test('Should accept valid transport costs', () => {
      const costs = {
        mountType: 'horse',
        weight: 50,
        distance: 6,
        riskFactor: 0.3,
      };

      const result = validateTransportCosts(costs);
      expect(result.success).toBe(true);
    });

    test('Should reject invalid mount type', () => {
      const costs = {
        mountType: 'dragon',
        weight: 50,
        distance: 6,
        riskFactor: 0.3,
      };

      const result = validateTransportCosts(costs);
      expect(result.success).toBe(false);
    });

    test('Should reject risk factor outside 0-1 range', () => {
      const costs = {
        mountType: 'horse',
        weight: 50,
        distance: 6,
        riskFactor: 1.5,
      };

      const result = validateTransportCosts(costs);
      expect(result.success).toBe(false);
    });

    test('Should reject negative weight', () => {
      const costs = {
        mountType: 'horse',
        weight: -10,
        distance: 6,
        riskFactor: 0.3,
      };

      const result = validateTransportCosts(costs);
      expect(result.success).toBe(false);
    });
  });

  describe('Price Range Validation', () => {
    test('Should accept valid price range', () => {
      const range = {
        minPrice: 50000,
        maxPrice: 150000,
      };

      const result = validatePriceRange(range);
      expect(result.success).toBe(true);
    });

    test('Should reject max price less than min price', () => {
      const range = {
        minPrice: 150000,
        maxPrice: 50000,
      };

      const result = validatePriceRange(range);
      expect(result.success).toBe(false);
    });
  });

  describe('Quantity Range Validation', () => {
    test('Should accept valid quantity range', () => {
      const range = {
        minQuantity: 1,
        maxQuantity: 100,
      };

      const result = validateQuantityRange(range);
      expect(result.success).toBe(true);
    });

    test('Should reject max quantity less than min quantity', () => {
      const range = {
        minQuantity: 100,
        maxQuantity: 1,
      };

      const result = validateQuantityRange(range);
      expect(result.success).toBe(false);
    });
  });

  describe('Sanitization Functions', () => {
    test('Should sanitize numeric input', () => {
      expect(sanitizeNumericInput('123.45')).toBe(123.45);
      expect(sanitizeNumericInput('invalid')).toBe(0);
      expect(sanitizeNumericInput(456)).toBe(456);
    });

    test('Should sanitize item ID', () => {
      expect(sanitizeItemId('t8_main_sword')).toBe('T8_MAIN_SWORD');
      expect(sanitizeItemId('T8-MAIN-SWORD')).toBe('T8MAINSWORD');
      expect(sanitizeItemId('T8 MAIN SWORD')).toBe('T8MAINSWORD');
    });
  });

  describe('Reasonableness Checks', () => {
    test('Should check if price is reasonable', () => {
      expect(isPriceReasonable(100000, 8)).toBe(true);
      expect(isPriceReasonable(100, 8)).toBe(false); // Too low
      expect(isPriceReasonable(10_000_000, 8)).toBe(false); // Too high
    });

    test('Should check if quantity is reasonable', () => {
      expect(isQuantityReasonable(10, 100000)).toBe(true);
      expect(isQuantityReasonable(1, 1000)).toBe(false); // Total too low
      expect(isQuantityReasonable(1000, 2_000_000_000)).toBe(false); // Total too high
    });
  });

  describe('Error Formatting', () => {
    test('Should format validation errors', () => {
      const input = {
        itemId: '',
        buyCity: 'InvalidCity',
        sellCity: 'Caerleon',
        buyPrice: -1000,
        sellPrice: 110000,
        quantity: 0,
      };

      const result = validateArbitrageInput(input);
      
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const formatted = formatValidationErrors(result.error);
        expect(Object.keys(formatted).length).toBeGreaterThan(0);
      }
    });
  });
});
