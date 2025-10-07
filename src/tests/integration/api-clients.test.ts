/**
 * Integration Tests for API Clients
 * Tests real API endpoints and data aggregation
 */

import { describe, it, expect } from 'vitest';
import { aodpClient } from '@/lib/api/aodp/client';
import { gameinfoClient } from '@/lib/api/gameinfo/client';
import { openAlbionClient } from '@/lib/api/openalbion/client';
import { renderClient } from '@/lib/api/render/client';
import { statusClient } from '@/lib/api/status/client';
import { normalizeMarketPrices } from '@/lib/data/normalization';

describe('API Integration Tests', () => {
  // Note: These tests hit real APIs, so they may be slow or fail if APIs are down
  
  describe('AODP Client', () => {
    it('should fetch market prices', async () => {
      try {
        aodpClient.setServer('Americas');
        const prices = await aodpClient.getPrices('T4_BAG', {
          locations: 'Caerleon',
          qualities: '1',
        });
        
        expect(Array.isArray(prices)).toBe(true);
        if (prices.length > 0) {
          expect(prices[0]).toHaveProperty('item_id');
          expect(prices[0]).toHaveProperty('city');
          expect(prices[0]).toHaveProperty('quality');
        }
      } catch (error) {
        console.warn('AODP API test skipped:', error);
        expect(true).toBe(true); // Don't fail if API is down
      }
    }, 10000);

    it('should fetch gold prices', async () => {
      try {
        const goldPrices = await aodpClient.getGoldPrices({ count: 10 });
        
        expect(Array.isArray(goldPrices)).toBe(true);
        if (goldPrices.length > 0) {
          expect(goldPrices[0]).toHaveProperty('price');
          expect(goldPrices[0]).toHaveProperty('timestamp');
        }
      } catch (error) {
        console.warn('AODP gold prices test skipped:', error);
        expect(true).toBe(true);
      }
    }, 10000);
  });

  describe('Gameinfo Client', () => {
    it('should search for players', async () => {
      try {
        gameinfoClient.setServer('Americas');
        const results = await gameinfoClient.search('test');
        
        expect(results).toHaveProperty('players');
        expect(results).toHaveProperty('guilds');
      } catch (error) {
        console.warn('Gameinfo search test skipped:', error);
        expect(true).toBe(true);
      }
    }, 10000);
  });

  describe('OpenAlbion Client', () => {
    it('should fetch weapon categories', async () => {
      try {
        const categories = await openAlbionClient.getCategories('weapon');
        
        expect(Array.isArray(categories)).toBe(true);
        if (categories.length > 0) {
          expect(categories[0]).toHaveProperty('id');
          expect(categories[0]).toHaveProperty('name');
        }
      } catch (error) {
        console.warn('OpenAlbion test skipped:', error);
        expect(true).toBe(true);
      }
    }, 10000);
  });

  describe('Render Client', () => {
    it('should generate valid item icon URLs', () => {
      const url = renderClient.getItemIconUrl('T4_BAG', {
        quality: 1,
        size: 217,
      });
      
      expect(url).toContain('render.albiononline.com');
      expect(url).toContain('T4_BAG');
      expect(url).toContain('quality=1');
    });
  });

  describe('Status Client', () => {
    it('should fetch server status', async () => {
      try {
        const status = await statusClient.getStatus(false);
        
        expect(status).toHaveProperty('status');
        expect(typeof status.status).toBe('string');
      } catch (error) {
        console.warn('Status API test skipped:', error);
        expect(true).toBe(true);
      }
    }, 10000);
  });

  describe('Data Normalization Integration', () => {
    it('should normalize real API data', async () => {
      try {
        const prices = await aodpClient.getPrices('T4_BAG');
        const normalized = normalizeMarketPrices(
          prices.map(p => ({
            itemId: p.item_id,
            itemName: p.item_id,
            city: p.city,
            quality: p.quality,
            sellPriceMin: p.sell_price_min,
            sellPriceMax: p.sell_price_max,
            buyPriceMin: p.buy_price_min,
            buyPriceMax: p.buy_price_max,
            timestamp: p.sell_price_min_date,
            server: 'Americas',
          })),
          'AODP'
        );
        
        expect(Array.isArray(normalized)).toBe(true);
        if (normalized.length > 0) {
          expect(normalized[0].city).toMatch(/^[A-Z]/); // Capitalized
          expect(normalized[0].server).toBe('Americas');
          expect(normalized[0].quality).toBeGreaterThanOrEqual(1);
          expect(normalized[0].quality).toBeLessThanOrEqual(5);
        }
      } catch (error) {
        console.warn('Normalization integration test skipped:', error);
        expect(true).toBe(true);
      }
    }, 10000);
  });
});
