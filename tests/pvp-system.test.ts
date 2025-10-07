/**
 * PvP System Test Suite
 * Comprehensive tests for all PvP features
 */

import { describe, test, expect } from 'bun:test';
import { gameinfoClient } from '../src/lib/api/gameinfo/client';
import { analyzeMetaBuilds, calculateCounters } from '../src/lib/analysis/gear-meta';
import { calculateEloRatings, predictFightOutcome, detectAnomalousKills, generateMLInsights } from '../src/lib/ml/pvp-predictor';

describe('PvP API Integration Tests', () => {
  test('Should fetch recent kills from Gameinfo API', async () => {
    const kills = await gameinfoClient.getRecentKills(10, 0);
    
    expect(kills).toBeDefined();
    expect(Array.isArray(kills)).toBe(true);
    expect(kills.length).toBeGreaterThan(0);
    expect(kills[0]).toHaveProperty('EventId');
    expect(kills[0]).toHaveProperty('Killer');
    expect(kills[0]).toHaveProperty('Victim');
    expect(kills[0]).toHaveProperty('TotalVictimKillFame');
    
    console.log(`✅ Fetched ${kills.length} recent kills`);
  }, 30000);

  test('Should search for players', async () => {
    const { players = [] } = await gameinfoClient.search('test');

    expect(Array.isArray(players)).toBe(true);

    if (players.length > 0) {
      expect(players[0]).toHaveProperty('Id');
      expect(players[0]).toHaveProperty('Name');
      console.log(`✅ Found ${players.length} players matching "test"`);
    }
  }, 30000);

  test('Should fetch guild leaderboards', async () => {
    // Test guild leaderboard API directly via client
    const guilds = await gameinfoClient.getGuildLeaderboard({
      type: 'attacks',
      range: 'week',
      limit: 10,
    });
    
    expect(guilds).toBeDefined();
    expect(Array.isArray(guilds)).toBe(true);
    
    // Guild leaderboards may be empty during certain times - that's OK
    if (guilds.length > 0) {
      expect(guilds[0]).toHaveProperty('Id');
      expect(guilds[0]).toHaveProperty('Name');
      expect(guilds[0]).toHaveProperty('KillFame');
      console.log(`✅ Fetched ${guilds.length} top guilds`);
    } else {
      console.log(`✅ Guild leaderboards API working (empty result is valid)`);
    }
  }, 30000);
});

describe('Meta Analysis Tests', () => {
  test('Should analyze meta builds from kill data', async () => {
    const kills = await gameinfoClient.getRecentKills(20, 0);
    const builds = analyzeMetaBuilds(kills);
    
    expect(builds).toBeDefined();
    expect(Array.isArray(builds)).toBe(true);
    
    if (builds.length > 0) {
      expect(builds[0]).toHaveProperty('build');
      expect(builds[0]).toHaveProperty('totalKills');
      expect(builds[0]).toHaveProperty('winRate');
      expect(builds[0]).toHaveProperty('popularity');
      
      console.log(`✅ Analyzed ${builds.length} unique builds`);
      console.log(`   Top build win rate: ${(builds[0].winRate * 100).toFixed(1)}%`);
    }
  }, 30000);

  test('Should calculate build counters', async () => {
    const kills = await gameinfoClient.getRecentKills(20, 0);
    let builds = analyzeMetaBuilds(kills);
    builds = calculateCounters(builds, kills);
    
    expect(builds).toBeDefined();
    
    if (builds.length > 0) {
      expect(builds[0]).toHaveProperty('counters');
      expect(builds[0]).toHaveProperty('counteredBy');
      expect(Array.isArray(builds[0].counters)).toBe(true);
      
      console.log(`✅ Calculated counter relationships`);
    }
  }, 30000);
});

describe('ML Features Tests', () => {
  test('Should calculate ELO ratings', async () => {
    const kills = await gameinfoClient.getRecentKills(30, 0);
    const ratings = calculateEloRatings(kills);
    
    expect(ratings).toBeDefined();
    expect(ratings.size).toBeGreaterThan(0);
    
    const firstRating = Array.from(ratings.values())[0];
    expect(firstRating).toHaveProperty('eloRating');
    expect(firstRating).toHaveProperty('rank');
    expect(firstRating).toHaveProperty('confidence');
    expect(firstRating.eloRating).toBeGreaterThan(0);
    
    console.log(`✅ Calculated ELO for ${ratings.size} players`);
    console.log(`   Top player: ${firstRating.playerName} - ${firstRating.eloRating} (${firstRating.rank})`);
  }, 30000);

  test('Should predict fight outcomes', () => {
    const attacker = {
      itemPower: 1400,
      eloRating: 1600,
      buildId: 'T8_MAIN_CLAYMORE',
      groupSize: 1,
    };
    
    const defender = {
      itemPower: 1200,
      eloRating: 1400,
      buildId: 'T7_MAIN_SWORD',
      groupSize: 1,
    };
    
    const prediction = predictFightOutcome(attacker, defender, new Map());
    
    expect(prediction).toHaveProperty('winProbability');
    expect(prediction).toHaveProperty('confidenceLevel');
    expect(prediction).toHaveProperty('recommendation');
    expect(prediction.winProbability).toBeGreaterThanOrEqual(0);
    expect(prediction.winProbability).toBeLessThanOrEqual(1);
    
    console.log(`✅ Fight prediction: ${(prediction.winProbability * 100).toFixed(1)}% win chance`);
    console.log(`   Recommendation: ${prediction.recommendation}`);
  });

  test('Should detect anomalous kills', async () => {
    const kills = await gameinfoClient.getRecentKills(50, 0);
    const anomalies = detectAnomalousKills(kills);
    
    expect(anomalies).toBeDefined();
    expect(Array.isArray(anomalies)).toBe(true);
    
    console.log(`✅ Detected ${anomalies.length} anomalous kills`);
    
    if (anomalies.length > 0) {
      console.log(`   Highest fame: ${anomalies[0].TotalVictimKillFame.toLocaleString()}`);
    }
  }, 30000);

  test('Should generate ML insights', async () => {
    const kills = await gameinfoClient.getRecentKills(50, 0);
    const insights = generateMLInsights(kills);
    
    expect(insights).toHaveProperty('topPlayers');
    expect(insights).toHaveProperty('risingStars');
    expect(insights).toHaveProperty('anomalousKills');
    expect(insights).toHaveProperty('metaShifts');
    
    expect(Array.isArray(insights.topPlayers)).toBe(true);
    expect(Array.isArray(insights.risingStars)).toBe(true);
    expect(Array.isArray(insights.anomalousKills)).toBe(true);
    
    console.log(`✅ Generated ML insights:`);
    console.log(`   Top players: ${insights.topPlayers.length}`);
    console.log(`   Rising stars: ${insights.risingStars.length}`);
    console.log(`   Anomalies: ${insights.anomalousKills.length}`);
  }, 30000);
});

describe('Performance Tests', () => {
  test('Should fetch and process 50 kills in under 5 seconds', async () => {
    const startTime = Date.now();
    
    const kills = await gameinfoClient.getRecentKills(50, 0);
    const builds = analyzeMetaBuilds(kills);
    const _insights = generateMLInsights(kills); // ML insights for performance testing
    
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000);
    expect(kills.length).toBeGreaterThan(0);
    expect(builds.length).toBeGreaterThan(0);
    
    console.log(`✅ Processed 50 kills in ${duration}ms`);
  }, 30000);
});

console.log('\n🎯 Running PvP System Tests...\n');
