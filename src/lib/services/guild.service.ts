import { gameinfoClient, GameinfoClient, type Alliance, type Battle, type CrystalMatch, type Guild, type GuildFameLeaderboardEntry, type GuildLeaderboardEntry, type KillEvent, type Player, type Server } from '@/lib/api/gameinfo/client';
import { getGuildMembers as fetchGuildMembers, type GuildMember } from '@/lib/api/gameinfo/guilds';
import { CACHE_TTL, getCache, setCache } from '@/lib/cache/redis-cache.server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

type FameLeaderboardRange = 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';
type AttackDefenseRange = 'day' | 'week' | 'month';

type GuildProfilePayload = {
  guild: Guild | null;
  alliance: Alliance | null;
};

type GuildMembersPayload = {
  guildId: string;
  members: GuildMember[];
};

type PlayerProfilePayload = {
  player: Player | null;
  recentKills: KillEvent[];
  recentDeaths: KillEvent[];
};

type BattleDetailsPayload = {
  battle: Battle | null;
  events: KillEvent[];
};

type AllianceDetailsPayload = {
  alliance: Alliance | null;
};

type LeaderboardOptions = {
  range?: FameLeaderboardRange;
  limit?: number;
  offset?: number;
};

type AttackDefenseOptions = {
  range?: AttackDefenseRange;
  type?: 'attacks' | 'defenses';
  limit?: number;
  offset?: number;
};

class GuildService {
  private static instance: GuildService | null = null;
  private readonly servers: Server[] = ['Americas', 'Europe', 'Asia'];

  static getInstance(): GuildService {
    GuildService.instance ??= new GuildService();
    return GuildService.instance;
  }

  async getGuildProfile(guildId: string): Promise<GuildProfilePayload> {
    const cacheKey = `guild:profile:${guildId}`;
    const cached = await getCache<GuildProfilePayload>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const guild = await this.safeGetGuild(guildId);
    const alliance = guild?.AllianceId ? await this.safeGetAlliance(guild.AllianceId) : null;
    const payload: GuildProfilePayload = { guild: guild ?? null, alliance };
    await setCache(cacheKey, payload, CACHE_TTL.STABLE);
    return payload;
  }

  async getGuildMembers(guildId: string): Promise<GuildMembersPayload> {
    const cacheKey = `guild:members:${guildId}`;
    const cached = await getCache<GuildMembersPayload>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const members = await fetchGuildMembers(guildId);
    const payload: GuildMembersPayload = { guildId, members };
    await setCache(cacheKey, payload, CACHE_TTL.STANDARD);
    return payload;
  }

  async getDetailedGuildProfile(guildId: string): Promise<{
    profile: GuildProfilePayload;
    members: GuildMembersPayload;
    recentBattles: Battle[];
  }> {
    const cacheKey = `guild:detailed:${guildId}`;
    const cached = await getCache<{
      profile: GuildProfilePayload;
      members: GuildMembersPayload;
      recentBattles: Battle[];
    }>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const [profile, members] = await Promise.all([
      this.getGuildProfile(guildId),
      this.getGuildMembers(guildId),
    ]);

    // Fetch recent battles involving the guild (limit to 10 for performance)
    const battles = await this.safeGetRecentBattles(10);
    const recentBattles = battles.filter((battle) =>
      battle.guilds && Object.keys(battle.guilds).includes(guildId)
    );

    const payload = { profile, members, recentBattles };
    await setCache(cacheKey, payload, CACHE_TTL.STANDARD);
    return payload;
  }

  async getPlayerProfile(playerId: string): Promise<PlayerProfilePayload> {
    const cacheKey = `player:profile:${playerId}`;
    const cached = await getCache<PlayerProfilePayload>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const player = await this.safeGetPlayer(playerId);
    const [recentKills, recentDeaths] = await Promise.all([
      this.safeGetPlayerKills(playerId, 10),
      this.safeGetPlayerDeaths(playerId, 10),
    ]);

    const payload: PlayerProfilePayload = {
      player: player ?? null,
      recentKills,
      recentDeaths,
    };
    await setCache(cacheKey, payload, CACHE_TTL.STANDARD);
    return payload;
  }

  async getBattleDetails(battleId: number): Promise<BattleDetailsPayload> {
    const cacheKey = `battle:details:${battleId}`;
    const cached = await getCache<BattleDetailsPayload>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const battle = await this.safeGetBattle(battleId);
    const events = await this.safeGetBattleEvents(battleId, 51);

    const payload: BattleDetailsPayload = {
      battle: battle ?? null,
      events,
    };
    await setCache(cacheKey, payload, CACHE_TTL.STABLE);
    return payload;
  }

  async getAllianceDetails(allianceId: string): Promise<AllianceDetailsPayload> {
    const cacheKey = `alliance:details:${allianceId}`;
    const cached = await getCache<AllianceDetailsPayload>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const alliance = await this.safeGetAlliance(allianceId);
    const payload: AllianceDetailsPayload = { alliance: alliance ?? null };
    await setCache(cacheKey, payload, CACHE_TTL.STABLE);
    return payload;
  }

  async getKillEventDetails(eventId: number): Promise<KillEvent | null> {
    const cacheKey = `event:details:${eventId}`;
    const cached = await getCache<KillEvent | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const event = await this.safeGetKillEvent(eventId);
    await setCache(cacheKey, event, CACHE_TTL.STABLE);
    return event;
  }

  async getGuildKillFameLeaderboard(options: LeaderboardOptions = {}): Promise<GuildFameLeaderboardEntry[]> {
    const range = options.range ?? 'week';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const cacheKey = `guild:leaderboard:fame:${range}:${limit}:${offset}`;
    const cached = await getCache<GuildFameLeaderboardEntry[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const fallbackRanges: FameLeaderboardRange[] = [range, 'week', 'month', 'lastWeek', 'lastMonth', 'day'];

    // Try across servers and ranges until we get a non-empty result
    for (const srv of this.servers) {
      const client = new GameinfoClient(srv);
      for (const r of fallbackRanges) {
        try {
          const data = await client.getGuildKillFameLeaderboard({ range: r, limit, offset });
          if (Array.isArray(data) && data.length > 0) {
            await setCache(cacheKey, data, CACHE_TTL.STANDARD);
            return data;
          }
        } catch (error) {
          // Continue to next range/server
          console.error(`Guild fame leaderboard fetch error (${srv}/${r})`, error);
        }
      }
    }

    // Try DB-backed fallback (computed from kill_events)
    try {
      const computed = await this.computeGuildKillFameFromDB({ range, limit, offset });
      if (Array.isArray(computed) && computed.length > 0) {
        await setCache(cacheKey, computed, CACHE_TTL.STANDARD);
        return computed;
      }
    } catch (error) {
      console.error('DB fallback for guild fame failed', error);
    }

    // If everything failed or returned empty, do NOT cache empties; return current singleton result as a last attempt
    try {
      const data = await gameinfoClient.getGuildKillFameLeaderboard({ range, limit, offset });
      if (Array.isArray(data) && data.length > 0) {
        await setCache(cacheKey, data, CACHE_TTL.STANDARD);
        return data;
      }
    } catch (error) {
      console.error('Final guild fame leaderboard fetch error', error);
    }

    return [];
  }

  async getGuildAttackDefenseLeaderboard(options: AttackDefenseOptions = {}): Promise<GuildLeaderboardEntry[]> {
    const range = options.range ?? 'week';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const type = options.type ?? 'attacks';
    const cacheKey = `guild:leaderboard:${type}:${range}:${limit}:${offset}`;
    const cached = await getCache<GuildLeaderboardEntry[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const fallbackRanges: AttackDefenseRange[] = [range, 'week', 'month', 'day'];

    for (const srv of this.servers) {
      const client = new GameinfoClient(srv);
      for (const r of fallbackRanges) {
        try {
          const data = await client.getGuildLeaderboard({ type, range: r, limit, offset });
          if (Array.isArray(data) && data.length > 0) {
            await setCache(cacheKey, data, CACHE_TTL.STANDARD);
            return data;
          }
        } catch (error) {
          console.error(`Guild ${type} leaderboard fetch error (${srv}/${r})`, error);
        }
      }
    }

    // DB-backed fallback: compute from latest guild_snapshots
    try {
      const computed = await this.computeGuildAttackDefenseFromDB({ type, range, limit, offset });
      if (Array.isArray(computed) && computed.length > 0) {
        await setCache(cacheKey, computed, CACHE_TTL.STANDARD);
        return computed;
      }
    } catch (error) {
      console.error(`DB fallback for guild ${type} failed`, error);
    }

    // Final attempt with current singleton client; don't cache empties
    try {
      const data = await gameinfoClient.getGuildLeaderboard({ type, range, limit, offset });
      if (Array.isArray(data) && data.length > 0) {
        await setCache(cacheKey, data, CACHE_TTL.STANDARD);
        return data;
      }
    } catch (error) {
      console.error('Final guild attack/defense leaderboard fetch error', error);
    }

    return [];
  }

  async getCrystalMatches(options: { tier?: number; limit?: number; offset?: number } = {}): Promise<CrystalMatch[]> {
    const tierKey = options.tier ?? 'all';
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const cacheKey = `guild:crystal:${tierKey}:${limit}:${offset}`;
    const cached = await getCache<CrystalMatch[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const data = await gameinfoClient.getCrystalMatches({ tier: options.tier, limit, offset });
    await setCache(cacheKey, data, CACHE_TTL.STANDARD);
    return data;
  }

  async getCrystalMatch(matchId: number): Promise<CrystalMatch | null> {
    const cacheKey = `guild:crystal:${matchId}`;
    const cached = await getCache<CrystalMatch | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const match = await this.safeGetCrystalMatch(matchId);
    await setCache(cacheKey, match, CACHE_TTL.STANDARD);
    return match;
  }

  async primeLeaderboards(): Promise<void> {
    const ranges: AttackDefenseRange[] = ['day', 'week', 'month'];
    await Promise.all(
      ranges.flatMap((range) => [
        this.getGuildKillFameLeaderboard({ range, limit: 50 }),
        this.getGuildAttackDefenseLeaderboard({ range, limit: 50, type: 'attacks' }),
        this.getGuildAttackDefenseLeaderboard({ range, limit: 50, type: 'defenses' }),
      ])
    );
  }

  private async safeGetGuild(guildId: string): Promise<Guild | null> {
    try {
      return await gameinfoClient.getGuild(guildId);
    } catch (error) {
      console.error('Guild fetch error', error);
      return null;
    }
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

  private async safeGetRecentBattles(limit: number): Promise<Battle[]> {
    try {
      return await gameinfoClient.getRecentBattles('week', limit);
    } catch (error) {
      console.error('Recent battles fetch error', error);
      return [];
    }
  }

  private async safeGetAlliance(allianceId: string): Promise<Alliance | null> {
    try {
      return await gameinfoClient.getAlliance(allianceId);
    } catch (error) {
      console.error('Alliance fetch error', error);
      return null;
    }
  }

  private async safeGetCrystalMatch(matchId: number): Promise<CrystalMatch | null> {
    try {
      return await gameinfoClient.getCrystalMatch(matchId);
    } catch (error) {
      console.error('Crystal match fetch error', error);
      return null;
    }
  }

  private safeGetKillEvent(_eventId: number): Promise<KillEvent | null> {
    try {
      // Note: GameinfoClient doesn't have getKillEvent, so we might need to add it or use a different approach
      // For now, return null or implement if available
      return Promise.resolve(null);
    } catch (error) {
      console.error('Kill event fetch error', error);
      return Promise.resolve(null);
    }
  }

  // ===== Supabase DB fallbacks =====
  private async computeGuildKillFameFromDB(options: LeaderboardOptions): Promise<GuildFameLeaderboardEntry[]> {
    const range = options.range ?? 'week';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const admin = getSupabaseAdmin();

    // Try RPC function first (if migrations applied)
    try {
      const { data, error } = await admin.rpc('get_guild_kill_fame_leaderboard', {
        range,
        max_results: limit,
        offset,
      });
      if (!error && Array.isArray(data) && data.length > 0) {
        return (data).map((row) => ({
          GuildId: row.guildId,
          GuildName: row.guildName,
          Total: Number(row.totalFame) || 0,
          Rank: undefined,
          AllianceId: undefined,
          AllianceName: undefined,
          AllianceTag: undefined,
        }));
      }
    } catch (_) {
      // Fall through to manual aggregation
    }

    // Manual aggregation from kill_events within time window
    const { start, end } = this.getTimeWindow(range);
    const { data } = await admin
      .from('kill_events')
      .select('killerGuildId,killerGuildName,totalFame,timestamp')
      .gte('timestamp', start)
      .lt('timestamp', end)
      .not('killerGuildId', 'is', null)
      .limit(10000);

    const acc = new Map<string, { name: string; fame: number }>();
    for (const ev of (data ?? [])) {
      const id = ev.killerGuildId as string;
      if (!id) {continue;}
      const cur = acc.get(id) ?? { name: ev.killerGuildName ?? 'Unknown', fame: 0 };
      cur.fame += Number(ev.totalFame ?? 0);
      cur.name = ev.killerGuildName ?? cur.name;
      acc.set(id, cur);
    }

    const rows = Array.from(acc.entries())
      .map(([guildId, v]) => ({ GuildId: guildId, GuildName: v.name, Total: v.fame }))
      .sort((a, b) => (b.Total - a.Total))
      .slice(offset, offset + limit);

    return rows;
  }

  private getTimeWindow(range: FameLeaderboardRange | AttackDefenseRange): { start: string; end: string } {
    const now = new Date();
    const end = now.toISOString();
    const startDate = new Date(now);

    switch (range) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'lastWeek': {
        const d = new Date(now);
        d.setUTCHours(0, 0, 0, 0);
        const dow = d.getUTCDay();
        const toMonday = (dow + 6) % 7;
        d.setUTCDate(d.getUTCDate() - toMonday);
        const prevStart = new Date(d);
        prevStart.setUTCDate(prevStart.getUTCDate() - 7);
        return { start: prevStart.toISOString(), end: d.toISOString() };
      }
      case 'lastMonth': {
        const y = now.getUTCFullYear();
        const m = now.getUTCMonth();
        const thisMonthStart = new Date(Date.UTC(y, m, 1, 0, 0, 0));
        const prevMonthStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
        return { start: prevMonthStart.toISOString(), end: thisMonthStart.toISOString() };
      }
      default:
        startDate.setDate(startDate.getDate() - 7);
        break;
    }

    return { start: startDate.toISOString(), end };
  }

  private async computeGuildAttackDefenseFromDB(options: AttackDefenseOptions): Promise<GuildLeaderboardEntry[]> {
    const type = options.type ?? 'attacks';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const admin = getSupabaseAdmin();

    // Try RPC (latest snapshot per guild)
    try {
      const { data, error } = await admin.rpc('get_guild_attack_defense_leaderboard', {
        type,
        max_results: limit,
        offset,
      });
      if (!error && Array.isArray(data) && data.length > 0) {
        return (data).map((row) => ({
          Id: row.guildId,
          Name: row.guildName,
          AttacksWon: Number(row.attacksWon) || 0,
          DefensesWon: Number(row.defensesWon) || 0,
          Rank: undefined,
          AllianceId: undefined,
          AllianceName: undefined,
        }));
      }
    } catch (_) {
      // Fall through to manual approach
    }

    // Manual: fetch latest snapshots and dedupe by guild
    const { data } = await admin
      .from('guild_snapshots')
      .select('guild_id,guild_name,attacks_won,defenses_won,snapshot_at')
      .order('snapshot_at', { ascending: false })
      .limit(5000);

    const latest = new Map<string, { name: string; attacks: number; defenses: number }>();
    for (const row of (data ?? [])) {
      const id = row.guild_id as string;
      if (!id) {continue;}
      if (!latest.has(id)) {
        latest.set(id, {
          name: row.guild_name ?? 'Unknown',
          attacks: Number(row.attacks_won ?? 0),
          defenses: Number(row.defenses_won ?? 0),
        });
      }
    }

    const sorted = Array.from(latest.entries())
      .map(([Id, v]) => ({ Id, Name: v.name, AttacksWon: v.attacks, DefensesWon: v.defenses }))
      .sort((a, b) => (type === 'defenses' ? b.DefensesWon - a.DefensesWon : b.AttacksWon - a.AttacksWon))
      .slice(offset, offset + limit);

    return sorted;
  }
}

export const guildService = GuildService.getInstance();
