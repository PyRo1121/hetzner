import { describe, it, expect } from 'vitest';
import {
  normalizeTimestamp,
  normalizePrice,
  normalizePriceRange,
  normalizeCity,
  normalizeServer,
  normalizeQuality,
  normalizeItemId,
  normalizeMarketPrices,
  normalizePriceHistory,
  normalizeGoldPrices,
  validateDataConsistency,
} from './normalization';

describe('Data Normalization', () => {
  describe('normalizeTimestamp', () => {
    it('should normalize Unix timestamp (seconds)', () => {
      const result = normalizeTimestamp(1609459200); // 2021-01-01 00:00:00
      expect(result).toMatch(/2021-01-01/);
    });

    it('should normalize Unix timestamp (milliseconds)', () => {
      const result = normalizeTimestamp(1609459200000);
      expect(result).toMatch(/2021-01-01/);
    });

    it('should normalize ISO string', () => {
      const iso = '2021-01-01T00:00:00Z';
      const result = normalizeTimestamp(iso);
      expect(result).toMatch(/2021-01-01T00:00:00/); // May add .000Z
    });

    it('should normalize Date object', () => {
      const date = new Date('2021-01-01');
      const result = normalizeTimestamp(date);
      expect(result).toMatch(/2021-01-01/);
    });

    it('should handle invalid timestamp gracefully', () => {
      const result = normalizeTimestamp('invalid');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/); // Returns current time
    });
  });

  describe('normalizePrice', () => {
    it('should return price as integer', () => {
      expect(normalizePrice(100.5)).toBe(101);
      expect(normalizePrice(99.4)).toBe(99);
    });

    it('should handle null/undefined', () => {
      expect(normalizePrice(null)).toBe(0);
      expect(normalizePrice(undefined)).toBe(0);
    });

    it('should handle negative prices', () => {
      expect(normalizePrice(-100)).toBe(0);
    });
  });

  describe('normalizePriceRange', () => {
    it('should keep correct order', () => {
      const result = normalizePriceRange(100, 200);
      expect(result).toEqual({ min: 100, max: 200 });
    });

    it('should swap if min > max', () => {
      const result = normalizePriceRange(200, 100);
      expect(result).toEqual({ min: 100, max: 200 });
    });
  });

  describe('normalizeCity', () => {
    it('should normalize various city formats', () => {
      expect(normalizeCity('caerleon')).toBe('Caerleon');
      expect(normalizeCity('CAERLEON')).toBe('Caerleon');
      expect(normalizeCity('Caerleon')).toBe('Caerleon');
      expect(normalizeCity('FortSterling')).toBe('Fort Sterling');
      expect(normalizeCity('BlackMarket')).toBe('Black Market');
    });

    it('should return original if not in map', () => {
      expect(normalizeCity('UnknownCity')).toBe('UnknownCity');
    });
  });

  describe('normalizeServer', () => {
    it('should normalize server names', () => {
      expect(normalizeServer('americas')).toBe('Americas');
      expect(normalizeServer('US')).toBe('Americas');
      expect(normalizeServer('EU')).toBe('Europe');
      expect(normalizeServer('europe')).toBe('Europe');
      expect(normalizeServer('asia')).toBe('Asia');
    });

    it('should default to Americas', () => {
      expect(normalizeServer('unknown')).toBe('Americas');
    });
  });

  describe('normalizeQuality', () => {
    it('should clamp quality between 1-5', () => {
      expect(normalizeQuality(0)).toBe(1);
      expect(normalizeQuality(6)).toBe(5);
      expect(normalizeQuality(3)).toBe(3);
    });

    it('should default to 1 for null/undefined', () => {
      expect(normalizeQuality(null)).toBe(1);
      expect(normalizeQuality(undefined)).toBe(1);
    });
  });

  describe('normalizeItemId', () => {
    it('should trim whitespace', () => {
      expect(normalizeItemId('  T4_BAG  ')).toBe('T4_BAG');
    });
  });

  describe('normalizeMarketPrices', () => {
    it('should normalize valid data', () => {
      const data = [
        {
          itemId: 'T4_BAG',
          itemName: 'Bag',
          city: 'caerleon',
          quality: 1,
          sellPriceMin: 100,
          sellPriceMax: 200,
          buyPriceMin: 90,
          buyPriceMax: 180,
          timestamp: '2021-01-01T00:00:00Z',
          server: 'americas',
        },
      ];

      const result = normalizeMarketPrices(data, 'test');
      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Caerleon');
      expect(result[0].server).toBe('Americas');
    });

    it('should skip invalid entries and log errors', () => {
      const data = [
        { invalid: 'data' },
        {
          itemId: 'T4_BAG',
          itemName: 'Bag',
          city: 'Caerleon',
          quality: 1,
          sellPriceMin: 100,
          sellPriceMax: 200,
          buyPriceMin: 90,
          buyPriceMax: 180,
          timestamp: '2021-01-01T00:00:00Z',
          server: 'Americas',
        },
      ];

      const result = normalizeMarketPrices(data, 'test');
      expect(result).toHaveLength(1);
    });
  });

  describe('validateDataConsistency', () => {
    it('should detect consistent data', () => {
      const data1 = [
        {
          itemId: 'T4_BAG',
          itemName: 'Bag',
          city: 'Caerleon',
          quality: 1,
          sellPriceMin: 100,
          sellPriceMax: 200,
          buyPriceMin: 90,
          buyPriceMax: 180,
          timestamp: '2021-01-01T00:00:00Z',
          server: 'Americas' as const,
        },
      ];

      const result = validateDataConsistency(data1, data1);
      expect(result.consistent).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    it('should detect differences', () => {
      const data1 = [
        {
          itemId: 'T4_BAG',
          itemName: 'Bag',
          city: 'Caerleon',
          quality: 1,
          sellPriceMin: 100,
          sellPriceMax: 200,
          buyPriceMin: 90,
          buyPriceMax: 180,
          timestamp: '2021-01-01T00:00:00Z',
          server: 'Americas' as const,
        },
      ];

      const data2 = [
        {
          itemId: 'T5_BAG',
          itemName: 'Bag',
          city: 'Caerleon',
          quality: 1,
          sellPriceMin: 100,
          sellPriceMax: 200,
          buyPriceMin: 90,
          buyPriceMax: 180,
          timestamp: '2021-01-01T00:00:00Z',
          server: 'Americas' as const,
        },
      ];

      const result = validateDataConsistency(data1, data2);
      expect(result.consistent).toBe(false);
      expect(result.differences.length).toBeGreaterThan(0);
    });
  });
});
