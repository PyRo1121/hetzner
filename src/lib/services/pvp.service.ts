import {
  gameinfoClient,
  type Battle,
  type GuildMatch,
  type KillEvent,
  type KillFameLeaderboardEntry,
  type Player,
  type PlayerStatisticsEntry,
  type PlayerWeaponFameEntry,
} from '@/lib/api/gameinfo/client';
import { CACHE_TTL, getCache, setCache } from '@/lib/cache/redis-cache.server';

type KillFeedOptions = {
  limit?: number;
  offset?: number;
  guildId?: string;
  server?: 'Americas' | 'Europe' | 'Asia';
};

type BattleSearchOptions = {
  range?: 'day' | 'week' | 'month';
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'fame';
};

type PlayerSearchResult = {
  player: Player | null;
  recentKills: KillEvent[];
  recentDeaths: KillEvent[];
};

class PvPService {
  private static instance: PvPService | null = null;

  static getInstance(): PvPService {
    PvPService.instance ??= new PvPService();
    return PvPService.instance;
  }

  async getKillFeed(options: KillFeedOptions = {}): Promise<KillEvent[]> {
    const limit = options.limit ?? 51;
    const offset = options.offset ?? 0;
    const guildId = options.guildId;
    const server = options.server ?? gameinfoClient.getServer?.() ?? 'Americas';
    const cacheKey = `pvp:${server}:killfeed:${guildId ?? 'all'}:${limit}:${offset}`;

    const cached = await getCache<KillEvent[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Ensure client uses requested server
    if (gameinfoClient.setServer) {
      gameinfoClient.setServer(server);
    }
    const data = await gameinfoClient.getRecentKills(limit, offset);
    const filtered = guildId
      ? data.filter(
          (kill) =>
            kill.Killer.GuildId === guildId ||
            kill.Victim.GuildId === guildId ||
            kill.Killer.AllianceId === guildId ||
            kill.Victim.AllianceId === guildId
        )
      : data;

    await setCache(cacheKey, filtered, CACHE_TTL.STANDARD);
    return filtered;
  }

  async searchPlayers(query: string, server: 'Americas' | 'Europe' | 'Asia' = 'Americas'): Promise<Player[]> {
    const cacheKey = `pvp:${server}:search:players:${query}`;
    const cached = await getCache<Player[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    if (gameinfoClient.setServer) {
      gameinfoClient.setServer(server);
    }
    const searchResult = await gameinfoClient.search(query);
    const players = searchResult.players ?? [];
    await setCache(cacheKey, players, CACHE_TTL.STANDARD);
    return players;
  }

  async searchGuilds(query: string, server: 'Americas' | 'Europe' | 'Asia' = 'Americas'): Promise<{ Id: string; Name: string }[]> {
    const cacheKey = `pvp:${server}:search:guilds:${query}`;
    const cached = await getCache<{ Id: string; Name: string }[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    if (gameinfoClient.setServer) {
      gameinfoClient.setServer(server);
    }
    const searchResult = await gameinfoClient.search(query);
    const guilds = searchResult.guilds ?? [];
    await setCache(cacheKey, guilds, CACHE_TTL.STANDARD);
    return guilds;
  }

  async getPlayerDetails(playerId: string): Promise<PlayerSearchResult> {
    const cacheKey = `pvp:player:details:${playerId}`;
    const cached = await getCache<PlayerSearchResult>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const player = await this.safeGetPlayer(playerId);
    const [recentKills, recentDeaths] = await Promise.all([
      this.safeGetPlayerKills(playerId, 10),
      this.safeGetPlayerDeaths(playerId, 10),
    ]);

    const result: PlayerSearchResult = {
      player: player ?? null,
      recentKills,
      recentDeaths,
    };

    await setCache(cacheKey, result, CACHE_TTL.STANDARD);
    return result;
  }

  async getRecentBattles(options: BattleSearchOptions & { server?: 'Americas' | 'Europe' | 'Asia' } = {}): Promise<Battle[]> {
    const range = options.range ?? 'day';
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const sort = options.sort ?? 'recent';
    const server = options.server ?? gameinfoClient.getServer?.() ?? 'Americas';
    const cacheKey = `pvp:${server}:battles:${range}:${sort}:${limit}:${offset}`;

    const cached = await getCache<Battle[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    if (gameinfoClient.setServer) {
      gameinfoClient.setServer(server);
    }
    const data = await gameinfoClient.getBattles({ range, limit, offset, sort });
    await setCache(cacheKey, data, CACHE_TTL.STANDARD);
    return data;
  }

  async getBattleById(battleId: number): Promise<Battle | null> {
    const cacheKey = `pvp:battle:${battleId}`;
    const cached = await getCache<Battle | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const battle = await this.safeGetBattle(battleId);
    await setCache(cacheKey, battle, CACHE_TTL.STABLE);
    return battle;
  }

  async getBattleEvents(battleId: number, limit: number = 51): Promise<KillEvent[]> {
    const cacheKey = `pvp:battle:events:${battleId}:${limit}`;
    const cached = await getCache<KillEvent[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const events = await this.safeGetBattleEvents(battleId, limit);
    await setCache(cacheKey, events, CACHE_TTL.STABLE);
    return events;
  }

  private async safeGetPlayer(playerId: string): Promise<Player | null> {
    try {
      return await gameinfoClient.getPlayer(playerId);
    } catch (error) {
      console.error('Player fetch error', error);
      return null;
    }
  }

  private async safeGetPlayerKills(playerId: string, limit: number): Promise<KillEvent[]> {
    try {
      return await gameinfoClient.getPlayerKills(playerId, { limit });
    } catch (error) {
      console.error('Player kills fetch error', error);
      return [];
    }
  }

  private async safeGetPlayerDeaths(playerId: string, limit: number): Promise<KillEvent[]> {
    try {
      return await gameinfoClient.getPlayerDeaths(playerId, { limit });
    } catch (error) {
      console.error('Player deaths fetch error', error);
      return [];
    }
  }

  private async safeGetBattle(battleId: number): Promise<Battle | null> {
    try {
      return await gameinfoClient.getBattle(battleId);
    } catch (error) {
      console.error('Battle fetch error', error);
      return null;
    }
  }

  private async safeGetBattleEvents(battleId: number, limit: number): Promise<KillEvent[]> {
    try {
      return await gameinfoClient.getBattleEvents(battleId, { limit });
    } catch (error) {
      console.error('Battle events fetch error', error);
      return [];
    }
  }

  public async getPlayerWeaponFameLeaderboard(
    options: {
      range?: 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';
      limit?: number;
      offset?: number;
      weaponCategory?: string;
    } = {}
  ): Promise<PlayerWeaponFameEntry[]> {
    const range = options.range ?? 'week';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const weaponCategory = options.weaponCategory;
    const cacheKey = `pvp:weaponfame:${range}:${limit}:${offset}:${weaponCategory ?? 'all'}`;

    const cached = await getCache<PlayerWeaponFameEntry[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const data = await gameinfoClient.getPlayerWeaponFameLeaderboard({
      range,
      limit,
      offset,
      weaponCategory,
    });

    await setCache(cacheKey, data, CACHE_TTL.STANDARD);
    return data;
  }

  public async getTopKills(
    options: {
      range?: 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<KillFameLeaderboardEntry[]> {
    const range = options.range ?? 'week';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const cacheKey = `pvp:topkills:${range}:${limit}:${offset}`;

    const cached = await getCache<KillFameLeaderboardEntry[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const data = await gameinfoClient.getKillFameLeaderboard({
      range,
      limit,
      offset,
    });

    await setCache(cacheKey, data, CACHE_TTL.STANDARD);
    return data;
  }

  public async getGvGMatches(
    type: 'top' | 'next' | 'past',
    options: { limit?: number; offset?: number } = {}
  ): Promise<GuildMatch[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const cacheKey = `pvp:gvg:${type}:${limit}:${offset}`;

    const cached = await getCache<GuildMatch[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    let data: GuildMatch[] = [];
    try {
      switch (type) {
        case 'top':
          data = await gameinfoClient.getGuildMatchesTop();
          break;
        case 'next':
          data = await gameinfoClient.getGuildMatchesNext({ limit, offset });
          break;
        case 'past':
          data = await gameinfoClient.getGuildMatchesPast({ limit, offset });
          break;
      }
    } catch (error) {
      console.error('GvG matches fetch error:', error);
    }

    await setCache(cacheKey, data, CACHE_TTL.STANDARD);
    return data;
  }

  public async getPlayerStatistics(
    options: {
      range?: 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';
      type?: string;
      limit?: number;
      offset?: number;
      subtype?: string;
      region?: string;
      guildId?: string;
      allianceId?: string;
    } = {}
  ): Promise<PlayerStatisticsEntry[]> {
    const range = options.range ?? 'week';
    const type = options.type ?? 'PvE';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const cacheKey = `pvp:playerstats:${range}:${type}:${limit}:${offset}`;

    const cached = await getCache<PlayerStatisticsEntry[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const data = await gameinfoClient.getPlayerStatistics({
      range,
      type,
      limit,
      offset,
      subtype: options.subtype,
      region: options.region,
      guildId: options.guildId,
      allianceId: options.allianceId,
    });

    await setCache(cacheKey, data, CACHE_TTL.STANDARD);
    return data;
  }

  public async getWeaponCategories(): Promise<string[]> {
    const cacheKey = 'pvp:weaponcategories';

    const cached = await getCache<string[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const data = await gameinfoClient.getWeaponCategories();
    await setCache(cacheKey, data, CACHE_TTL.STABLE);
    return data;
  }
}

export const pvpService = PvPService.getInstance();
