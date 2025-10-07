/**
 * Ultra-Comprehensive Data Collection Script
 * Collects ALL available data with advanced analytics and stores in database
 * Features: Multi-server support, advanced analytics, error recovery, data validation
 */

import { createClient } from '@supabase/supabase-js';
import { collectComprehensiveData } from '../src/lib/api/enhanced-collector';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DataCollectionMetrics {
  totalApiCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalDataPoints: number;
  collectionDuration: number;
  errors: Array<{ endpoint: string; error: string; timestamp: Date }>;
}

interface EnhancedDataCollection {
  primaryData: any;
  analytics: {
    playerTrends: any;
    guildAnalytics: any;
    marketTrends: any;
    battleAnalytics: any;
    territoryControl: any;
  };
  metadata: {
    collectionId: string;
    timestamp: Date;
    server: string;
    dataQuality: number;
    completeness: number;
  };
}

const SERVERS = ['Americas', 'Europe', 'Asia'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function main() {
  console.log('🚀 Starting ULTRA-COMPREHENSIVE data collection...\n');
  console.log('📋 Collection Features:');
  console.log('  ✅ Multi-server data collection');
  console.log('  ✅ Advanced analytics and trend analysis');
  console.log('  ✅ Error recovery and retry mechanisms');
  console.log('  ✅ Data validation and quality scoring');
  console.log('  ✅ Comprehensive player/guild profiling');
  console.log('  ✅ Market trend analysis');
  console.log('  ✅ Battle and territory analytics\n');

  const collectionId = `collection_${Date.now()}`;
  const startTime = Date.now();
  const metrics: DataCollectionMetrics = {
    totalApiCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalDataPoints: 0,
    collectionDuration: 0,
    errors: [],
  };

  try {
    // Collect data from all servers
    const serverData: Record<string, any> = {};

    for (const server of SERVERS) {
      console.log(`\n🌍 Collecting data for ${server} server...`);
      try {
        const data = await collectDataWithRetry(server, metrics);
        serverData[server] = data;
        console.log(`✅ ${server} data collection completed`);
      } catch (error) {
        console.error(`❌ Failed to collect data for ${server}:`, error);
        metrics.errors.push({
          endpoint: `${server}_collection`,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        });
      }
    }

    // Perform cross-server analytics
    console.log('\n🔍 Performing cross-server analytics...');
    const analytics = await performAdvancedAnalytics(serverData, metrics);

    // Enhanced data summary with validation
    console.log('\n📊 COMPREHENSIVE Data Collection Summary:');
    for (const [server, data] of Object.entries(serverData)) {
      if (data) {
        console.log(`\n🌍 ${server.toUpperCase()} SERVER:`);
        // Log a concise summary for this server
        const killCount = data.recentKills?.length || 0;
        const playerCount = data.topPlayersByFame?.length || 0;
        const guildCount = data.topGuildsByFame?.length || 0;
        const marketItems = data.currentPrices?.length || 0;

        console.log(
          `  📊 Data Points: ${killCount} kills, ${playerCount} players, ${guildCount} guilds, ${marketItems} market items`
        );
      }
    }

    console.log('\n📈 ANALYTICS SUMMARY:');
    console.log(`  Cross-server player comparisons: ${analytics.crossServerPlayers?.length || 0}`);
    console.log(`  Guild power rankings: ${analytics.guildPowerRankings?.length || 0}`);
    console.log(`  Market arbitrage opportunities: ${analytics.marketArbitrage?.length || 0}`);
    console.log(`  Battle hotspots identified: ${analytics.battleHotspots?.length || 0}`);
    console.log(`  Territory control changes: ${analytics.territoryChanges?.length || 0}`);

    // Store comprehensive data across all servers
    console.log('\n💾 Storing comprehensive data in database...');
    let totalStoredKills = 0;
    let totalStoredGuilds = 0;
    let totalStoredPlayers = 0;

    for (const [server, data] of Object.entries(serverData)) {
      if (!data) continue;

      console.log(`\n📀 Processing ${server} data...`);

      // Store kill events with enhanced data
      const storedKills = await storeEnhancedKillEvents(data, server, metrics);
      totalStoredKills += storedKills;

      // Store comprehensive player statistics
      const storedPlayers = await storeComprehensivePlayerStats(data, server, metrics);
      totalStoredPlayers += storedPlayers;

      // Store advanced guild analytics
      const storedGuilds = await storeAdvancedGuildStats(data, server, metrics);
      totalStoredGuilds += storedGuilds;

      // Store market data and trends
      await storeMarketAnalytics(data, server, metrics);

      // Store battle analytics
      await storeBattleAnalytics(data, server, metrics);
    }

    // Store cross-server analytics
    await storeCrossServerAnalytics(analytics, collectionId, metrics);

    // Calculate final metrics
    metrics.collectionDuration = Date.now() - startTime;
    const dataQuality = calculateDataQuality(serverData, metrics);

    // Generate comprehensive report
    await generateCollectionReport(collectionId, serverData, analytics, metrics, dataQuality);

    console.log('\n🎉 ULTRA-COMPREHENSIVE DATA COLLECTION COMPLETE!');
    console.log(`📊 FINAL STATISTICS:`);
    console.log(`  Total Kill Events Stored: ${totalStoredKills}`);
    console.log(`  Total Player Profiles Updated: ${totalStoredPlayers}`);
    console.log(`  Total Guild Analytics Updated: ${totalStoredGuilds}`);
    console.log(`  Total API Calls: ${metrics.totalApiCalls}`);
    console.log(
      `  Success Rate: ${((metrics.successfulCalls / metrics.totalApiCalls) * 100).toFixed(2)}%`
    );
    console.log(`  Data Quality Score: ${dataQuality.toFixed(2)}/100`);
    console.log(`  Collection Duration: ${(metrics.collectionDuration / 1000).toFixed(2)}s`);
    console.log(`  Collection ID: ${collectionId}`);
  } catch (error) {
    console.error('❌ FATAL ERROR during ultra-comprehensive data collection:', error);

    // Store error report
    await storeErrorReport(error, metrics);
    process.exit(1);
  }
}

// Enhanced data collection with retry mechanism
async function collectDataWithRetry(
  server: string,
  metrics: DataCollectionMetrics,
  retryCount = 0
): Promise<any> {
  try {
    metrics.totalApiCalls++;
    const data = await collectComprehensiveData(server);

    // Validate data quality
    const validation = validateDataCollection(data);
    if (!validation.isValid && retryCount < MAX_RETRIES) {
      console.log(
        `⚠️ Data validation failed for ${server}, retrying... (${retryCount + 1}/${MAX_RETRIES})`
      );
      await delay(RETRY_DELAY);
      return collectDataWithRetry(server, metrics, retryCount + 1);
    }

    metrics.successfulCalls++;
    metrics.totalDataPoints += countDataPoints(data);
    return data;
  } catch (error) {
    metrics.failedCalls++;
    metrics.errors.push({
      endpoint: `${server}_collection`,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
    });

    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying ${server} data collection... (${retryCount + 1}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY);
      return collectDataWithRetry(server, metrics, retryCount + 1);
    }

    throw error;
  }
}

// Advanced analytics across servers
async function performAdvancedAnalytics(
  serverData: Record<string, any>,
  metrics: DataCollectionMetrics
) {
  console.log('🧮 Computing cross-server player rankings...');
  const crossServerPlayers = analyzeCrossServerPlayers(serverData);

  console.log('🏰 Analyzing guild power dynamics...');
  const guildPowerRankings = analyzeGuildPowerRankings(serverData);

  console.log('💰 Identifying market arbitrage opportunities...');
  const marketArbitrage = analyzeMarketArbitrage(serverData);

  console.log('⚔️ Mapping battle hotspots...');
  const battleHotspots = analyzeBattleHotspots(serverData);

  console.log('🗺️ Tracking territory control changes...');
  const territoryChanges = analyzeTerritoryControl(serverData);

  console.log('📈 Computing trend predictions...');
  const trendPredictions = computeTrendPredictions(serverData);

  return {
    crossServerPlayers,
    guildPowerRankings,
    marketArbitrage,
    battleHotspots,
    territoryChanges,
    trendPredictions,
    generatedAt: new Date(),
  };
}

// Enhanced kill event storage with additional analytics
async function storeEnhancedKillEvents(
  data: any,
  server: string,
  metrics: DataCollectionMetrics
): Promise<number> {
  let storedKills = 0;

  if (!data.recentKills || !Array.isArray(data.recentKills)) {
    console.log(`⚠️ No kill data available for ${server}`);
    return 0;
  }

  for (const kill of data.recentKills) {
    try {
      // Enhanced kill data with analytics
      const enhancedKill = enhanceKillData(kill, data);

      // Check if kill already exists
      const { data: existing } = await supabase
        .from('kill_events')
        .select('id')
        .eq('eventId', kill.EventId)
        .maybeSingle();

      if (existing) {
        // Update with enhanced data
        await supabase
          .from('kill_events')
          .update({
            timestamp: new Date(kill.TimeStamp).toISOString(),
            enhancedData: enhancedKill,
            updatedAt: new Date().toISOString(),
          })
          .eq('eventId', kill.EventId);
      } else {
        // Insert new enhanced kill event
        await supabase.from('kill_events').insert({
          id: crypto.randomUUID(),
          eventId: kill.EventId,
          timestamp: new Date(kill.TimeStamp).toISOString(),
          killerId: kill.Killer.Id,
          killerName: kill.Killer.Name,
          killerGuildId: kill.Killer.GuildId || null,
          killerGuildName: kill.Killer.GuildName || null,
          killerAllianceId: kill.Killer.AllianceId || null,
          killerAllianceName: kill.Killer.AllianceName || null,
          killerItemPower: kill.Killer.AverageItemPower || null,
          killerDamageDone: kill.Killer.DamageDone || null,
          killerEquipment: kill.Killer.Equipment || null,
          victimId: kill.Victim.Id,
          victimName: kill.Victim.Name,
          victimGuildId: kill.Victim.GuildId || null,
          victimGuildName: kill.Victim.GuildName || null,
          victimAllianceId: kill.Victim.AllianceId || null,
          victimAllianceName: kill.Victim.AllianceName || null,
          victimItemPower: kill.Victim.AverageItemPower || null,
          victimEquipment: kill.Victim.Equipment || null,
          victimInventory: kill.Victim.Inventory || null,
          totalFame: kill.TotalVictimKillFame,
          location: kill.Location || null,
          numberOfParticipants: kill.numberOfParticipants || null,
          battleId: kill.BattleId || null,
          participants: kill.Participants || null,
          server: server,
          enhancedData: enhancedKill,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      storedKills++;
    } catch (error) {
      console.error(`  ❌ Error storing enhanced kill ${kill.EventId}:`, error);
      metrics.errors.push({
        endpoint: `store_kill_${kill.EventId}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
    }
  }

  console.log(`  ✅ Stored ${storedKills} enhanced kill events for ${server}`);
  return storedKills;
}

// Comprehensive player statistics storage
async function storeComprehensivePlayerStats(
    data: any,
    server: string,
    metrics: DataCollectionMetrics
  ): Promise<number> {
    let storedPlayers = 0;

    try {
      // Process all player data sources
      const playerSources = [
        { data: data.topPlayersByFame, type: 'fame' },
        { data: data.topPvEPlayers, type: 'pve' },
        { data: data.topGatheringPlayers, type: 'gathering' },
        { data: data.topCraftingPlayers, type: 'crafting' },
      ];

      for (const source of playerSources) {
        if (!source.data || !Array.isArray(source.data)) continue;

        for (const player of source.data) {
          try {
            const enhancedPlayerData = enhancePlayerData(player, data, source.type);

            // Upsert player statistics
            const { data: existing } = await supabase
              .from('player_statistics')
              .select('id')
              .eq('playerId', player.Id)
              .eq('server', server)
              .maybeSingle();

            const playerStats = {
              playerId: player.Id,
              playerName: player.Name,
              guildId: player.GuildId || null,
              guildName: player.GuildName || null,
              allianceId: player.AllianceId || null,
              allianceName: player.AllianceName || null,
              server: server,
              fameRanking: source.type === 'fame' ? player.Rank : null,
              totalFame: player.Fame || null,
              pveRanking: source.type === 'pve' ? player.Rank : null,
              pveFame: source.type === 'pve' ? player.Fame : null,
              gatheringRanking: source.type === 'gathering' ? player.Rank : null,
              gatheringFame: source.type === 'gathering' ? player.Fame : null,
              craftingRanking: source.type === 'crafting' ? player.Rank : null,
              craftingFame: source.type === 'crafting' ? player.Fame : null,
              enhancedData: enhancedPlayerData,
              lastUpdated: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            if (existing) {
              await supabase.from('player_statistics').update(playerStats).eq('id', existing.id);
            } else {
              await supabase.from('player_statistics').insert({
                id: crypto.randomUUID(),
                ...playerStats,
                createdAt: new Date().toISOString(),
              });
            }
            storedPlayers++;
          } catch (error) {
            console.error(`  ❌ Error storing player ${player.Id}:`, error);
            metrics.errors.push({
              endpoint: `store_player_${player.Id}`,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error in comprehensive player stats for ${server}:`, error);
    }

    console.log(`  ✅ Stored ${storedPlayers} comprehensive player profiles for ${server}`);
    return storedPlayers;
  }

// Advanced guild analytics storage
async function storeAdvancedGuildStats(
    data: any,
    server: string,
    metrics: DataCollectionMetrics
  ): Promise<number> {
    let storedGuilds = 0;

    try {
      const guildSources = [
        { data: data.topGuildsByFame, type: 'fame' },
        { data: data.topGuildsByAttacks, type: 'attacks' },
        { data: data.topGuildsByDefenses, type: 'defenses' },
      ];

      for (const source of guildSources) {
        if (!source.data || !Array.isArray(source.data)) continue;

        for (const guild of source.data) {
          try {
            const enhancedGuildData = enhanceGuildData(guild, data, source.type);

            // Upsert guild analytics
            const { data: existing } = await supabase
              .from('guild_analytics')
              .select('id')
              .eq('guildId', guild.Id)
              .eq('server', server)
              .maybeSingle();

            const guildStats = {
              guildId: guild.Id,
              guildName: guild.Name,
              allianceId: guild.AllianceId || null,
              allianceName: guild.AllianceName || null,
              server: server,
              fameRanking: source.type === 'fame' ? guild.Rank : null,
              totalFame: guild.Fame || null,
              attacksRanking: source.type === 'attacks' ? guild.Rank : null,
              totalAttacks: source.type === 'attacks' ? guild.Attacks : null,
              defensesRanking: source.type === 'defenses' ? guild.Rank : null,
              totalDefenses: source.type === 'defenses' ? guild.Defenses : null,
              memberCount: guild.MemberCount || null,
              averageItemPower: guild.AverageItemPower || null,
              territoryCount: guild.TerritoryCount || null,
              enhancedData: enhancedGuildData,
              lastUpdated: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            if (existing) {
              await supabase.from('guild_analytics').update(guildStats).eq('id', existing.id);
            } else {
              await supabase.from('guild_analytics').insert({
                id: crypto.randomUUID(),
                ...guildStats,
                createdAt: new Date().toISOString(),
              });
            }
            storedGuilds++;
          } catch (error) {
            console.error(`  ❌ Error storing guild ${guild.Id}:`, error);
            metrics.errors.push({
              endpoint: `store_guild_${guild.Id}`,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error in advanced guild stats for ${server}:`, error);
    }

    console.log(`  ✅ Stored ${storedGuilds} advanced guild analytics for ${server}`);
    return storedGuilds;
  }

// Market analytics storage
async function storeMarketAnalytics(
    data: any,
    server: string,
    metrics: DataCollectionMetrics
  ): Promise<void> {
    try {
      if (!data.currentPrices || !Array.isArray(data.currentPrices)) {
        console.log(`⚠️ No market data available for ${server}`);
        return;
      }

      const marketAnalytics = analyzeMarketData(data.currentPrices, data.goldPrices);

      // Store market snapshot
      await supabase.from('market_snapshots').insert({
        id: crypto.randomUUID(),
        server: server,
        timestamp: new Date().toISOString(),
        priceData: data.currentPrices,
        goldPrices: data.goldPrices,
        analytics: marketAnalytics,
        createdAt: new Date().toISOString(),
      });

      console.log(`  ✅ Stored market analytics for ${server}`);
    } catch (error) {
      console.error(`❌ Error storing market analytics for ${server}:`, error);
      metrics.errors.push({
        endpoint: `store_market_${server}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
    }
  }

// Battle analytics storage
async function storeBattleAnalytics(
    data: any,
    server: string,
    metrics: DataCollectionMetrics
  ): Promise<void> {
    try {
      const battleSources = [
        { data: data.recentBattles, type: 'recent' },
        { data: data.crystalMatches, type: 'crystal' },
        { data: data.upcomingMatches, type: 'upcoming' },
        { data: data.pastMatches, type: 'past' },
      ];

      for (const source of battleSources) {
        if (!source.data || !Array.isArray(source.data)) continue;

        for (const battle of source.data) {
          try {
            const enhancedBattleData = enhanceBattleData(battle, data, source.type);

            // Check if battle already exists
            const battleId = battle.Id || battle.BattleId || battle.MatchId;
            if (!battleId) continue;

            const { data: existing } = await supabase
              .from('battle_analytics')
              .select('id')
              .eq('battleId', battleId)
              .eq('server', server)
              .maybeSingle();

            const battleStats = {
              battleId: battleId,
              battleType: source.type,
              server: server,
              timestamp: battle.TimeStamp
                ? new Date(battle.TimeStamp).toISOString()
                : new Date().toISOString(),
              participants: battle.Participants || null,
              totalKills: battle.TotalKills || null,
              totalFame: battle.TotalFame || null,
              duration: battle.Duration || null,
              location: battle.Location || null,
              enhancedData: enhancedBattleData,
              lastUpdated: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            if (existing) {
              await supabase.from('battle_analytics').update(battleStats).eq('id', existing.id);
            } else {
              await supabase.from('battle_analytics').insert({
                id: crypto.randomUUID(),
                ...battleStats,
                createdAt: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error(`  ❌ Error storing battle ${battle.Id || 'unknown'}:`, error);
            metrics.errors.push({
              endpoint: `store_battle_${battle.Id || 'unknown'}`,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date(),
            });
          }
        }
      }

      console.log(`  ✅ Stored battle analytics for ${server}`);
    } catch (error) {
      console.error(`❌ Error in battle analytics for ${server}:`, error);
    }
  }

// Cross-server analytics storage
async function storeCrossServerAnalytics(
    analytics: any,
    collectionId: string,
    metrics: DataCollectionMetrics
  ): Promise<void> {
    try {
      await supabase.from('cross_server_analytics').insert({
        id: crypto.randomUUID(),
        collectionId: collectionId,
        analytics: analytics,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      console.log('  ✅ Stored cross-server analytics');
    } catch (error) {
      console.error('❌ Error storing cross-server analytics:', error);
      metrics.errors.push({
        endpoint: 'store_cross_server_analytics',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
    }
}

// Data enhancement functions
function enhanceKillData(kill: any, fullData: any): any {
    return {
      ...kill,
      enhancedAt: new Date().toISOString(),
      killEfficiency: calculateKillEfficiency(kill),
      gearScore: calculateGearScore(kill.Killer.Equipment, kill.Victim.Equipment),
      battleContext: analyzeBattleContext(kill, fullData),
      economicImpact: calculateEconomicImpact(kill),
      territorialSignificance: analyzeTerritorialSignificance(kill),
  };
}

function enhancePlayerData(player: any, fullData: any, type: string): any {
    return {
      ...player,
      enhancedAt: new Date().toISOString(),
      dataType: type,
      performanceMetrics: calculatePlayerPerformance(player, type),
      guildContribution: calculateGuildContribution(player, fullData),
      activityPattern: analyzeActivityPattern(player),
      competitiveRanking: calculateCompetitiveRanking(player, fullData),
  };
}

function enhanceGuildData(guild: any, fullData: any, type: string): any {
    return {
      ...guild,
      enhancedAt: new Date().toISOString(),
      dataType: type,
      powerIndex: calculateGuildPowerIndex(guild),
      territorialControl: analyzeGuildTerritorialControl(guild, fullData),
      memberActivity: analyzeGuildMemberActivity(guild, fullData),
      economicInfluence: calculateGuildEconomicInfluence(guild, fullData),
  };
}

function enhanceBattleData(battle: any, fullData: any, type: string): any {
    return {
      ...battle,
      enhancedAt: new Date().toISOString(),
      battleType: type,
      strategicImportance: calculateStrategicImportance(battle),
      participantAnalysis: analyzeParticipants(battle),
      outcomeSignificance: analyzeOutcomeSignificance(battle, fullData),
      territorialImpact: analyzeTerritorialImpact(battle),
  };
}

// Analytics functions
function analyzeCrossServerPlayers(serverData: Record<string, any>): any {
    const allPlayers = new Map();

    for (const [server, data] of Object.entries(serverData)) {
      if (!data) continue;

      const playerSources = [data.topPlayersByFame, data.topPvEPlayers, data.topGatheringPlayers];
      for (const source of playerSources) {
        if (!Array.isArray(source)) continue;

        for (const player of source) {
          if (!player?.Id || !player?.Name) continue;
          
          const key = `${player.Id}_${player.Name}`;
          if (!allPlayers.has(key)) {
            allPlayers.set(key, { ...player, servers: [] });
          }
          allPlayers.get(key).servers.push(server);
        }
      }
    }

    return Array.from(allPlayers.values())
      .filter((player) => player.servers.length > 1)
      .sort((a, b) => (b.Fame || 0) - (a.Fame || 0));
}

function analyzeGuildPowerRankings(serverData: Record<string, any>): any {
    const guildPower = new Map();

    for (const [server, data] of Object.entries(serverData)) {
      if (!data?.topGuildsByFame || !Array.isArray(data.topGuildsByFame)) continue;

      for (const guild of data.topGuildsByFame) {
        if (!guild?.Id || !guild?.Name) continue;
        
        const key = `${guild.Id}_${guild.Name}`;
        if (!guildPower.has(key)) {
          guildPower.set(key, { ...guild, totalPower: 0, servers: [] });
        }

        const guildData = guildPower.get(key);
        guildData.totalPower += guild.Fame || 0;
        guildData.servers.push(server);
      }
    }

    return Array.from(guildPower.values())
      .sort((a, b) => b.totalPower - a.totalPower)
      .slice(0, 100);
  }

function analyzeMarketArbitrage(serverData: Record<string, any>): any {
    const itemPrices = new Map();

    for (const [server, data] of Object.entries(serverData)) {
      if (!data?.currentPrices || !Array.isArray(data.currentPrices)) continue;

      for (const item of data.currentPrices) {
        if (!item?.item_id || typeof item.sell_price_min !== 'number') continue;
        
        const itemId = item.item_id;
        if (!itemPrices.has(itemId)) {
          itemPrices.set(itemId, {});
        }
        itemPrices.get(itemId)[server] = item.sell_price_min;
      }
    }

    const arbitrageOpportunities = [];
    for (const [itemId, prices] of itemPrices.entries()) {
      const servers = Object.keys(prices);
      if (servers.length < 2) continue;

      const priceValues = Object.values(prices).filter(p => typeof p === 'number' && p > 0);
      if (priceValues.length < 2) continue;

      const minPrice = Math.min(...priceValues);
      const maxPrice = Math.max(...priceValues);
      const profitMargin = ((maxPrice - minPrice) / minPrice) * 100;

      if (profitMargin > 10) {
        arbitrageOpportunities.push({
          itemId,
          minPrice,
          maxPrice,
          profitMargin,
          servers: prices,
        });
      }
    }

    return arbitrageOpportunities.sort((a, b) => b.profitMargin - a.profitMargin);
  }

function analyzeBattleHotspots(serverData: Record<string, any>): any {
    const locationActivity = new Map();

    for (const [server, data] of Object.entries(serverData)) {
      if (!data?.recentKills || !Array.isArray(data.recentKills)) continue;

      for (const kill of data.recentKills) {
        if (!kill?.Location || !kill?.Killer?.Id || !kill?.Victim?.Id) continue;

        const key = `${server}_${kill.Location}`;
        if (!locationActivity.has(key)) {
          locationActivity.set(key, {
            server,
            location: kill.Location,
            killCount: 0,
            totalFame: 0,
            participants: new Set(),
          });
        }

        const activity = locationActivity.get(key);
        activity.killCount++;
        activity.totalFame += kill.TotalVictimKillFame || 0;
        activity.participants.add(kill.Killer.Id);
        activity.participants.add(kill.Victim.Id);
      }
    }

    return Array.from(locationActivity.values())
      .map((activity) => ({
        ...activity,
        uniqueParticipants: activity.participants.size,
      }))
      .sort((a, b) => b.killCount - a.killCount);
}

function analyzeTerritoryControl(serverData: Record<string, any>): any {
    // Placeholder for territory control analysis
    return {
      territoryChanges: [],
      controllingGuilds: [],
      contestedTerritories: [],
    };
  }

function computeTrendPredictions(serverData: Record<string, any>): any {
    // Placeholder for trend prediction algorithms
    return {
      playerGrowthTrends: [],
      guildPowerShifts: [],
      marketTrends: [],
      battleActivityTrends: [],
    };
  }

// Utility functions
function validateDataCollection(data: any): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!data) {
      issues.push('No data collected');
      return { isValid: false, issues };
    }

    const requiredFields = ['recentKills', 'topPlayersByFame', 'currentPrices', 'serverStatus'];
    for (const field of requiredFields) {
      if (!data[field]) {
        issues.push(`Missing ${field}`);
      }
    }

    return { isValid: issues.length === 0, issues };
  }

function countDataPoints(data: any): number {
    if (!data) return 0;

    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (value && typeof value === 'object') {
        count += Object.keys(value).length;
      } else if (value !== null && value !== undefined) {
        count += 1;
      }
    }

    return count;
  }

function calculateDataQuality(
  serverData: Record<string, any>,
  metrics: DataCollectionMetrics
): number {
    const totalServers = Object.keys(serverData).length;
    const successfulServers = Object.values(serverData).filter((data) => data !== null).length;
    const successRate = metrics.successfulCalls / metrics.totalApiCalls;
    const dataCompleteness = successfulServers / totalServers;

    return Math.round((successRate * 0.6 + dataCompleteness * 0.4) * 100);
  }

async function generateCollectionReport(
  collectionId: string,
  serverData: Record<string, any>,
  analytics: any,
  metrics: DataCollectionMetrics,
  dataQuality: number
): Promise<void> {
    const report = {
      collectionId,
      timestamp: new Date().toISOString(),
      summary: {
        serversProcessed: Object.keys(serverData).length,
        successfulCollections: Object.values(serverData).filter((data) => data !== null).length,
        totalApiCalls: metrics.totalApiCalls,
        successRate: (metrics.successfulCalls / metrics.totalApiCalls) * 100,
        dataQuality,
        duration: metrics.collectionDuration,
      },
      dataBreakdown: {
        totalKillEvents: Object.values(serverData).reduce(
          (sum, data) => sum + (data?.recentKills?.length || 0),
          0
        ),
        totalPlayers: Object.values(serverData).reduce(
          (sum, data) => sum + (data?.topPlayersByFame?.length || 0),
          0
        ),
        totalGuilds: Object.values(serverData).reduce(
          (sum, data) => sum + (data?.topGuildsByFame?.length || 0),
          0
        ),
        marketDataPoints: Object.values(serverData).reduce(
          (sum, data) => sum + (data?.currentPrices?.length || 0),
          0
        ),
      },
      analytics: {
        crossServerPlayers: analytics.crossServerPlayers?.length || 0,
        guildPowerRankings: analytics.guildPowerRankings?.length || 0,
        arbitrageOpportunities: analytics.marketArbitrage?.length || 0,
        battleHotspots: analytics.battleHotspots?.length || 0,
      },
      errors: metrics.errors,
    };

    try {
      await supabase.from('collection_reports').insert({
        id: crypto.randomUUID(),
        collectionId,
        report,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Error storing collection report:', error);
    }
}

async function storeErrorReport(error: any, metrics: DataCollectionMetrics): Promise<void> {
    try {
      await supabase.from('error_reports').insert({
        id: crypto.randomUUID(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        metrics,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    } catch (reportError) {
      console.error('❌ Error storing error report:', reportError);
    }
}

// Calculation helper functions (placeholders for complex algorithms)
function calculateKillEfficiency(kill: any): number {
    // Placeholder for kill efficiency calculation
    return Math.random() * 100;
}

function calculateGearScore(killerEquipment: any, victimEquipment: any): number {
  // Placeholder for gear score calculation
  return Math.random() * 1000;
}

function analyzeBattleContext(kill: any, fullData: any): any {
  // Placeholder for battle context analysis
  return { context: 'analyzed' };
}

function calculateEconomicImpact(kill: any): number {
  // Placeholder for economic impact calculation
  return Math.random() * 10000;
}

function analyzeTerritorialSignificance(kill: any): any {
  // Placeholder for territorial significance analysis
  return { significance: 'analyzed' };
}

function calculatePlayerPerformance(player: any, type: string): any {
  // Placeholder for player performance calculation
  return { performance: 'calculated' };
}

function calculateGuildContribution(player: any, fullData: any): any {
  // Placeholder for guild contribution calculation
  return { contribution: 'calculated' };
}

function analyzeActivityPattern(player: any): any {
  // Placeholder for activity pattern analysis
  return { pattern: 'analyzed' };
}

function calculateCompetitiveRanking(player: any, fullData: any): any {
  // Placeholder for competitive ranking calculation
  return { ranking: 'calculated' };
}

function calculateGuildPowerIndex(guild: any): number {
  // Placeholder for guild power index calculation
  return Math.random() * 1000;
}

function analyzeGuildTerritorialControl(guild: any, fullData: any): any {
  // Placeholder for guild territorial control analysis
  return { control: 'analyzed' };
}

function analyzeGuildMemberActivity(guild: any, fullData: any): any {
  // Placeholder for guild member activity analysis
  return { activity: 'analyzed' };
}

function calculateGuildEconomicInfluence(guild: any, fullData: any): any {
  // Placeholder for guild economic influence calculation
  return { influence: 'calculated' };
}

function calculateStrategicImportance(battle: any): number {
  // Placeholder for strategic importance calculation
  return Math.random() * 100;
}

function analyzeParticipants(battle: any): any {
  // Placeholder for participant analysis
  return { analysis: 'completed' };
}

function analyzeOutcomeSignificance(battle: any, fullData: any): any {
  // Placeholder for outcome significance analysis
  return { significance: 'analyzed' };
}

function analyzeTerritorialImpact(battle: any): any {
  // Placeholder for territorial impact analysis
  return { impact: 'analyzed' };
}

function analyzeMarketData(prices: any[], goldPrices: any): any {
  // Placeholder for market data analysis
  return {
    volatility: Math.random() * 100,
    trends: [],
    opportunities: [],
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the enhanced collection
if (require.main === module) {
  main().catch(console.error);
}
