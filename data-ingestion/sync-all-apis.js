#!/usr/bin/env node

// Albion Online Data Ingestion Service
// Runs every minute via cron job
// Updates database with fresh API data

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');

class DataIngestionService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    this.redis = new Redis(process.env.REDIS_URL);

    this.apis = {
      gameinfo: {
        baseUrl: 'https://gameinfo.albiononline.com/api/gameinfo',
        endpoints: ['events', 'battles', 'guilds', 'players']
      },
      aodp: {
        baseUrl: 'https://west.albion-online-data.com/api/v2',
        endpoints: ['stats/prices', 'stats/gold']
      }
    };
  }

  async syncAllAPIs() {
    console.log('🔄 Starting data ingestion cycle...');

    try {
      // Parallel API calls
      const promises = [
        this.syncKillFeed(),
        this.syncMarketPrices(),
        this.syncGoldPrices(),
        this.syncBattleData(),
        this.syncGuildStats(),
        this.syncServerStatus()
      ];

      await Promise.allSettled(promises);
      console.log('✅ Data ingestion cycle completed');

    } catch (error) {
      console.error('❌ Data ingestion failed:', error);
    }
  }

  async syncKillFeed() {
    try {
      const response = await axios.get(`${this.apis.gameinfo.baseUrl}/events?limit=51&offset=0`);
      const kills = response.data;

      for (const kill of kills) {
        const killData = {
          id: kill.EventId.toString(),
          killer_name: kill.Killer?.Name || 'Unknown',
          victim_name: kill.Victim?.Name || 'Unknown',
          killer_guild: kill.Killer?.GuildName || null,
          victim_guild: kill.Victim?.GuildName || null,
          location: kill.Killer?.AverageItemPower || null,
          fame: kill.TotalVictimKillFame || 0,
          timestamp: new Date(kill.TimeStamp)
        };

        // Upsert to database
        const { error } = await this.supabase
          .from('kill_events')
          .upsert(killData, { onConflict: 'id' });

        if (error) console.error('Kill feed sync error:', error);
      }

      // Cache latest kills in Redis
      await this.redis.setex('latest_kills', 300, JSON.stringify(kills.slice(0, 10)));

    } catch (error) {
      console.error('Kill feed sync failed:', error);
    }
  }

  async syncMarketPrices() {
    try {
      // AODP market prices
      const response = await axios.get(
        `${this.apis.aodp.baseUrl}/stats/prices/T4_BAG,T4_CAPE,T5_BAG?locations=Caerleon,Bridgewatch`
      );

      for (const item of response.data) {
        const priceData = {
          item_id: item.itemId,
          location: item.city,
          quality: item.quality || 1,
          sell_price_min: item.sellPriceMin || 0,
          buy_price_max: item.buyPriceMax || 0,
          timestamp: new Date()
        };

        const { error } = await this.supabase
          .from('market_prices')
          .insert(priceData);

        if (error) console.error('Market price sync error:', error);
      }

      // Cache latest prices
      await this.redis.setex('latest_prices', 300, JSON.stringify(response.data.slice(0, 20)));

    } catch (error) {
      console.error('Market price sync failed:', error);
    }
  }

  async syncGoldPrices() {
    try {
      const response = await axios.get(`${this.apis.aodp.baseUrl}/stats/gold?count=50`);
      const goldData = response.data[0]; // Latest gold price

      const goldPriceData = {
        price: goldData.price,
        timestamp: new Date(goldData.timestamp)
      };

      const { error } = await this.supabase
        .from('gold_prices')
        .insert(goldPriceData);

      if (error) console.error('Gold price sync error:', error);

      // Cache latest gold price
      await this.redis.setex('latest_gold', 300, JSON.stringify(goldData));

    } catch (error) {
      console.error('Gold price sync failed:', error);
    }
  }

  async syncBattleData() {
    try {
      const response = await axios.get(
        `${this.apis.gameinfo.baseUrl}/battles?range=week&limit=50&offset=0`
      );

      for (const battle of response.data) {
        const battleData = {
          id: battle.id.toString(),
          winner_guild: battle.winner?.name || null,
          loser_guild: battle.loser?.name || null,
          total_fame: battle.totalFame || 0,
          location: battle.clusterName || null,
          start_time: new Date(battle.startTime),
          end_time: new Date(battle.endTime),
          timestamp: new Date()
        };

        const { error } = await this.supabase
          .from('battle_events')
          .upsert(battleData, { onConflict: 'id' });

        if (error) console.error('Battle sync error:', error);
      }

    } catch (error) {
      console.error('Battle sync failed:', error);
    }
  }

  async syncGuildStats() {
    try {
      // Get top guilds from different regions
      const regions = ['Americas', 'Europe', 'Asia'];
      const promises = regions.map(region =>
        axios.get(`${this.apis.gameinfo.baseUrl}/guilds/topguildsbyattacks?range=week&limit=10&region=${region}`)
      );

      const responses = await Promise.allSettled(promises);

      for (const response of responses) {
        if (response.status === 'fulfilled') {
          for (const guild of response.value.data) {
            const guildData = {
              guild_name: guild.name,
              alliance_name: guild.allianceName || null,
              kill_fame: guild.killFame || 0,
              attack_count: guild.attackCount || 0,
              defense_count: guild.defenseCount || 0,
              region: guild.region || 'Unknown',
              timestamp: new Date()
            };

            const { error } = await this.supabase
              .from('guild_activity')
              .insert(guildData);

            if (error) console.error('Guild stats sync error:', error);
          }
        }
      }

    } catch (error) {
      console.error('Guild stats sync failed:', error);
    }
  }

  async syncServerStatus() {
    try {
      const response = await axios.get('https://serverstatus.albiononline.com/');

      const statusData = {
        server_status: response.data.status || 'unknown',
        player_count: response.data.playerCount || 0,
        timestamp: new Date()
      };

      const { error } = await this.supabase
        .from('server_status')
        .insert(statusData);

      if (error) console.error('Server status sync error:', error);

      // Cache server status
      await this.redis.setex('server_status', 300, JSON.stringify(statusData));

    } catch (error) {
      console.error('Server status sync failed:', error);
    }
  }
}

// Run data ingestion
const service = new DataIngestionService();
service.syncAllAPIs().then(() => {
  console.log('Data ingestion completed');
  process.exit(0);
}).catch(error => {
  console.error('Data ingestion failed:', error);
  process.exit(1);
});
