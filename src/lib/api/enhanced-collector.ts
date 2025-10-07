/**
 * Enhanced Data Collector
 * Collects comprehensive data from ALL available APIs
 */

import { gameinfoClient } from './gameinfo/client';

// Configurable total number of recent kills to fetch (defaults to 300)
const RECENT_KILLS_TOTAL = Number.parseInt(process.env.RECENT_KILLS_TOTAL ?? '300', 10);

export interface ComprehensiveDataCollection {
  // PvP Data
  recentKills: any[];
  topKillsByFame: any[];
  topPlayersByFame: any[];
  topGuildsByFame: any[];
  topGuildsByAttacks: any[];
  topGuildsByDefenses: any[];
  recentBattles: any[];
  crystalMatches: any[];

  // Player Rankings
  topPvEPlayers: any[];
  topGatheringPlayers: any[];
  topWeaponPlayers: Record<string, any[]>;

  // Guild/Alliance Data
  topGuilds: any[];
  guildMatches: {
    upcoming: any[];
    past: any[];
  };

  // Market Data (from AODP)
  currentPrices: any[];
  goldPrices: any[];
  priceHistory: any[];

  // Server Status
  serverStatus: any;

  // Metadata
  collectedAt: Date;
  server: string;
}

/**
 * Collect ALL available data from APIs
 */
export async function collectComprehensiveData(
  server: string = 'Americas'
): Promise<ComprehensiveDataCollection> {
  console.log(`🔄 Starting comprehensive data collection for ${server}...`);

  const startTime = Date.now();

  try {
    // Parallel data collection for speed
    const [
      // PvP Data
      recentKills,
      topKillsByFame,
      topPlayersByFame,
      topGuildsByFame,
      topGuildsByAttacks,
      topGuildsByDefenses,
      recentBattles,
      crystalMatches,

      // Player Rankings
      topPvEPlayers,
      topGatheringPlayers,

      // Guild Matches
      upcomingGuildMatches,
      pastGuildMatches,

      // Market Data
      currentPrices,
      goldPrices,

      // Server Status
      serverStatus,
    ] = await Promise.all([
      // PvP Data
      fetchRecentKillsPaginated(RECENT_KILLS_TOTAL, 51),
      fetchTopKillsByFame(),
      fetchTopPlayersByFame(),
      fetchTopGuildsByFame(),
      fetchTopGuildsByAttacks(),
      fetchTopGuildsByDefenses(),
      fetchRecentBattles(),
      fetchCrystalMatches(),

      // Player Rankings
      fetchTopPvEPlayers(),
      fetchTopGatheringPlayers(),

      // Guild Matches
      fetchUpcomingGuildMatches(),
      fetchPastGuildMatches(),

      // Market Data
      fetchCurrentPrices(),
      fetchGoldPrices(),

      // Server Status
      fetchServerStatus(),
    ]);

    // Fetch weapon-specific rankings
    const weaponCategories = await fetchWeaponCategories();
    const topWeaponPlayers: Record<string, any[]> = {};

    for (const category of weaponCategories.slice(0, 10)) {
      // Top 10 weapons
      topWeaponPlayers[category] = await fetchTopPlayersByWeapon(category);
      await delay(100); // Rate limiting
    }

    const duration = Date.now() - startTime;
    console.info(`✅ Comprehensive data collection completed in ${duration}ms`);

    return {
      recentKills,
      topKillsByFame,
      topPlayersByFame,
      topGuildsByFame,
      topGuildsByAttacks,
      topGuildsByDefenses,
      recentBattles,
      crystalMatches,
      topPvEPlayers,
      topGatheringPlayers,
      topWeaponPlayers,
      topGuilds: topGuildsByFame,
      guildMatches: {
        upcoming: upcomingGuildMatches,
        past: pastGuildMatches,
      },
      currentPrices,
      goldPrices,
      priceHistory: [], // Will be populated separately
      serverStatus,
      collectedAt: new Date(),
      server,
    };
  } catch (error) {
    console.error('❌ Error during comprehensive data collection:', error);
    throw error;
  }
}

// Helper functions for each data source

// Paginate recent kills to collect a larger dataset
async function fetchRecentKillsPaginated(
  total: number = RECENT_KILLS_TOTAL,
  pageSize: number = 51
) {
  const combined: any[] = [];
  let offset = 0;

  while (combined.length < total) {
    const remaining = total - combined.length;
    const limit = Math.min(pageSize, remaining);
    const batch = await gameinfoClient.getRecentKills(limit, offset);

    if (!Array.isArray(batch) || batch.length === 0) {
      break; // No more data
    }

    combined.push(...batch);
    offset += batch.length;
    // Gentle rate limit between pages
    await delay(100);
  }

  return combined;
}

async function fetchTopKillsByFame() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/events/killfame?range=week&limit=50&offset=0'
  );
  return response.json();
}

async function fetchTopPlayersByFame() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/events/playerfame?range=week&limit=100&offset=0'
  );
  return response.json();
}

async function fetchTopGuildsByFame() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/events/guildfame?range=week&limit=100&offset=0'
  );
  return response.json();
}

async function fetchTopGuildsByAttacks() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/guilds/topguildsbyattacks?range=week&limit=100&offset=0'
  );
  return response.json();
}

async function fetchTopGuildsByDefenses() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/guilds/topguildsbydefenses?range=week&limit=100&offset=0'
  );
  return response.json();
}

async function fetchRecentBattles() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/battles?range=week&limit=50&offset=0&sort=recent'
  );
  return response.json();
}

async function fetchCrystalMatches() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/matches/crystal?limit=50&offset=0'
  );
  return response.json();
}

async function fetchTopPvEPlayers() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/players/statistics?range=week&limit=100&offset=0&type=PvE&region=Total'
  );
  return response.json();
}

async function fetchTopGatheringPlayers() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/players/statistics?range=week&limit=100&offset=0&type=Gathering&subtype=All&region=Total'
  );
  return response.json();
}

async function fetchWeaponCategories() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/items/_weaponCategories'
  );
  const data = await response.json();
  return data.map((cat: any) => cat.id ?? cat);
}

async function fetchTopPlayersByWeapon(weaponCategory: string) {
  const response = await fetch(
    `https://gameinfo.albiononline.com/api/gameinfo/events/playerweaponfame?range=week&limit=50&offset=0&weaponCategory=${weaponCategory}`
  );
  return response.json();
}

async function fetchUpcomingGuildMatches() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/guildmatches/next?limit=50&offset=0'
  );
  return response.json();
}

async function fetchPastGuildMatches() {
  const response = await fetch(
    'https://gameinfo.albiononline.com/api/gameinfo/guildmatches/past?limit=50&offset=0'
  );
  return response.json();
}

async function fetchCurrentPrices() {
  // Fetch prices for top traded items
  const items = [
    'T4_BAG',
    'T5_BAG',
    'T6_BAG',
    'T7_BAG',
    'T8_BAG',
    'T4_POTION_HEAL',
    'T5_POTION_HEAL',
    'T6_POTION_HEAL',
    'T4_MEAL_SOUP',
    'T5_MEAL_SOUP',
    'T6_MEAL_SOUP',
  ];

  const response = await fetch(
    `https://west.albion-online-data.com/api/v2/stats/prices/${items.join(',')}?locations=Caerleon,Martlock,Bridgewatch,Lymhurst,FortSterling,Thetford`
  );
  return response.json();
}

async function fetchGoldPrices() {
  const response = await fetch('https://west.albion-online-data.com/api/v2/stats/gold?count=100');
  return response.json();
}

async function fetchServerStatus() {
  const response = await fetch('https://serverstatus.albiononline.com/');
  return response.json();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Continuous data collection with caching
 */
export class DataCollectionService {
  private cache: ComprehensiveDataCollection | null = null;
  private lastCollectionTime: Date | null = null;
  private isCollecting: boolean = false;
  private collectionInterval: number = 5 * 60 * 1000; // 5 minutes

  async getLatestData(forceRefresh: boolean = false): Promise<ComprehensiveDataCollection> {
    // Return cache if fresh enough
    if (!forceRefresh && this.cache && this.lastCollectionTime) {
      const age = Date.now() - this.lastCollectionTime.getTime();
      if (age < this.collectionInterval) {
        console.info(`📦 Returning cached data (age: ${Math.round(age / 1000)}s)`);
        return this.cache;
      }
    }

    // Prevent concurrent collections
    if (this.isCollecting) {
      console.info('⏳ Collection already in progress, waiting...');
      while (this.isCollecting) {
        await delay(100);
      }
      return this.cache!;
    }

    // Collect fresh data
    this.isCollecting = true;
    try {
      this.cache = await collectComprehensiveData();
      this.lastCollectionTime = new Date();
      return this.cache;
    } finally {
      this.isCollecting = false;
    }
  }

  startAutoCollection() {
    console.info('🚀 Starting automatic data collection...');

    // Initial collection
    void this.getLatestData(true);

    // Set up interval
    setInterval(() => {
      void this.getLatestData(true).catch((err) => console.error('Auto-collection error:', err));
    }, this.collectionInterval);
  }

  getCacheAge(): number | null {
    if (!this.lastCollectionTime) {
      return null;
    }
    return Date.now() - this.lastCollectionTime.getTime();
  }
}

// Export singleton instance
export const dataCollectionService = new DataCollectionService();
