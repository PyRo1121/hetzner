/**
 * Complete API Integration Test Suite
 * Tests ALL APIs: AODP, Gameinfo, OpenAlbion, etc.
 */

import { describe, test, expect } from 'bun:test';

// AODP API tests
describe('AODP Market Data API', () => {
  test('Should fetch current market prices', async () => {
    const response = await fetch(
      'https://west.albion-online-data.com/api/v2/stats/prices/T4_BAG?locations=Caerleon,Martlock'
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('item_id');
    expect(data[0]).toHaveProperty('city');
    expect(data[0]).toHaveProperty('sell_price_min');
    
    console.log(`✅ AODP: Fetched ${data.length} price entries`);
  }, 30000);

  test('Should fetch gold prices', async () => {
    const response = await fetch(
      'https://west.albion-online-data.com/api/v2/stats/gold?count=10'
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('price');
    expect(data[0]).toHaveProperty('timestamp');
    
    console.log(`✅ AODP: Fetched ${data.length} gold price entries`);
  }, 30000);

  test('Should fetch price history', async () => {
    const response = await fetch(
      'https://west.albion-online-data.com/api/v2/stats/history/T4_BAG?locations=Caerleon&time-scale=24'
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('item_id');
      expect(data[0]).toHaveProperty('data');
      console.log(`✅ AODP: Fetched price history with ${data[0].data?.length || 0} data points`);
    }
  }, 30000);
});

// Gameinfo API tests
describe('Gameinfo PvP API', () => {
  test('Should fetch recent kill events', async () => {
    const response = await fetch(
      'https://gameinfo.albiononline.com/api/gameinfo/events?limit=10&offset=0'
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('EventId');
    expect(data[0]).toHaveProperty('Killer');
    expect(data[0]).toHaveProperty('Victim');
    expect(data[0]).toHaveProperty('TotalVictimKillFame');
    
    console.log(`✅ Gameinfo: Fetched ${data.length} kill events`);
  }, 30000);

  test('Should search for players', async () => {
    const response = await fetch(
      'https://gameinfo.albiononline.com/api/gameinfo/search?q=test'
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data).toHaveProperty('players');
    expect(Array.isArray(data.players)).toBe(true);
    
    console.log(`✅ Gameinfo: Found ${data.players.length} players`);
  }, 30000);

  test('Should fetch guild leaderboards', async () => {
    const response = await fetch(
      'https://gameinfo.albiononline.com/api/gameinfo/guilds/topguildsbyattacks?range=week&limit=10&offset=0'
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    console.log(`✅ Gameinfo: Fetched ${data.length} top guilds`);
  }, 30000);

  test('Should fetch battles', async () => {
    const response = await fetch(
      'https://gameinfo.albiononline.com/api/gameinfo/battles?range=week&limit=5&offset=0&sort=recent'
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    console.log(`✅ Gameinfo: Fetched ${data.length} battles`);
  }, 30000);

  test('Should fetch player fame leaderboard', async () => {
    const response = await fetch(
      'https://gameinfo.albiononline.com/api/gameinfo/events/playerfame?range=week&limit=10&offset=0'
    );
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('Player');
      expect(data[0]).toHaveProperty('KillFame');
    }
    console.log(`✅ Gameinfo: Fetched ${data.length} top players by fame`);
  }, 30000);
});

// Server Status API
describe('Server Status API', () => {
  test('Should fetch server status', async () => {
    const response = await fetch('https://serverstatus.albiononline.com/');
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    expect(data).toHaveProperty('status');
    console.log(`✅ Server Status: ${data.status}`);
  }, 30000);
});

// Render Service API
describe('Render Service API', () => {
  test('Should fetch item icon', async () => {
    const response = await fetch(
      'https://render.albiononline.com/v1/item/T4_BAG.png?size=217'
    );
    
    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toContain('image');
    
    console.log(`✅ Render Service: Item icon fetched successfully`);
  }, 30000);
});

// Performance tests
describe('API Performance Tests', () => {
  test('Should fetch market data in under 2 seconds', async () => {
    const startTime = Date.now();
    
    const response = await fetch(
      'https://west.albion-online-data.com/api/v2/stats/prices/T4_BAG,T5_BAG,T6_BAG?locations=Caerleon'
    );
    
    const duration = Date.now() - startTime;
    
    expect(response.ok).toBe(true);
    expect(duration).toBeLessThan(2000);
    
    console.log(`✅ Performance: Market data fetched in ${duration}ms`);
  }, 30000);

  test('Should fetch kill events in under 1 second', async () => {
    const startTime = Date.now();
    
    const response = await fetch(
      'https://gameinfo.albiononline.com/api/gameinfo/events?limit=10&offset=0'
    );
    
    const duration = Date.now() - startTime;
    
    expect(response.ok).toBe(true);
    expect(duration).toBeLessThan(1000);
    
    console.log(`✅ Performance: Kill events fetched in ${duration}ms`);
  }, 30000);
});

// Error handling tests
describe('API Error Handling', () => {
  test('Should handle invalid item ID gracefully', async () => {
    const response = await fetch(
      'https://west.albion-online-data.com/api/v2/stats/prices/INVALID_ITEM'
    );
    
    // Should either return empty array or error
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    
    console.log(`✅ Error Handling: Invalid item handled correctly`);
  }, 30000);

  test('Should handle rate limits appropriately', async () => {
    // Make multiple rapid requests
    const promises = Array.from({ length: 5 }, () =>
      fetch('https://gameinfo.albiononline.com/api/gameinfo/events?limit=1&offset=0')
    );
    
    const responses = await Promise.all(promises);
    const allOk = responses.every(r => r.ok || r.status === 429);
    
    expect(allOk).toBe(true);
    console.log(`✅ Error Handling: Rate limiting handled correctly`);
  }, 30000);
});

console.log('\n🎯 Running Complete API Integration Tests...\n');
