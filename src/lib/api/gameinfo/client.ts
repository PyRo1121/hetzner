/**
 * Official Albion Gameinfo API client
 * Consolidated interface for players, guilds, battles, and PvP events.
 * Documentation: https://www.tools4albion.com/api_info.php
 */

import { z } from 'zod';

const BASE_URLS = {
  Americas: 'https://gameinfo.albiononline.com/api/gameinfo',
  Europe: 'https://gameinfo-ams.albiononline.com/api/gameinfo',
  Asia: 'https://gameinfo-sgp.albiononline.com/api/gameinfo',
} as const;

export type Server = keyof typeof BASE_URLS;

const PlayerSchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    GuildId: z.string().optional().nullable(),
    GuildName: z.string().optional().nullable(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    Avatar: z.string().optional().nullable(),
    AvatarRing: z.string().optional().nullable(),
    KillFame: z.number().optional(),
    DeathFame: z.number().optional(),
    FameRatio: z.number().optional(),
  })
  .passthrough();

const PlayerWeaponFameEntrySchema = z
  .object({
    player: z.string().optional().nullable(),
    playerId: z.string().optional().nullable(),
    guild: z.string().optional().nullable(),
    guildId: z.string().optional().nullable(),
    alliance: z.string().optional().nullable(),
    allianceId: z.string().optional().nullable(),
    kills: z.number().optional().nullable(),
    killFame: z.number().optional().nullable(),
    weaponCategory: z.string().optional().nullable(),
  })
  .passthrough();

const KillFameLeaderboardEntrySchema = z
  .object({
    player: z.string().optional().nullable(),
    playerId: z.string().optional().nullable(),
    guild: z.string().optional().nullable(),
    guildId: z.string().optional().nullable(),
    alliance: z.string().optional().nullable(),
    allianceId: z.string().optional().nullable(),
    kills: z.number().optional().nullable(),
    killFame: z.number().optional().nullable(),
    total: z.number().optional().nullable(),
  })
  .passthrough();

const GuildMatchSchema = z
  .object({
    id: z.number().optional().nullable(),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    matchType: z.string().optional().nullable(),
    tier: z.number().optional().nullable(),
    guild1: z.string().optional().nullable(),
    guild2: z.string().optional().nullable(),
    teamA: z.unknown().optional().nullable(),
    teamB: z.unknown().optional().nullable(),
    score1: z.number().optional().nullable(),
    score2: z.number().optional().nullable(),
    totalFame: z.number().optional().nullable(),
  })
  .passthrough();

const PlayerStatisticsEntrySchema = z
  .object({
    PlayerId: z.string().optional().nullable(),
    PlayerName: z.string().optional().nullable(),
    GuildId: z.string().optional().nullable(),
    GuildName: z.string().optional().nullable(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    Fame: z.number().optional().nullable(),
    Type: z.string().optional().nullable(),
    Subtype: z.string().optional().nullable(),
  })
  .passthrough();

const GuildSchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    AllianceTag: z.string().optional().nullable(),
    FounderId: z.string().optional().nullable(),
    FounderName: z.string().optional().nullable(),
    Founded: z.string().optional().nullable(),
    MemberCount: z.number().optional().nullable(),
    killFame: z.number().optional().nullable(),
    DeathFame: z.number().optional().nullable(),
  })
  .passthrough();

const EquipmentItemSchema = z
  .object({
    Type: z.string(),
    Count: z.number().optional().nullable(),
    Quality: z.number().optional().nullable(),
    ActiveSpells: z.array(z.string()).optional().nullable(),
    PassiveSpells: z.array(z.string()).optional().nullable(),
  })
  .passthrough();

const EquipmentSchema = z
  .object({
    MainHand: EquipmentItemSchema.nullable().optional(),
    OffHand: EquipmentItemSchema.nullable().optional(),
    Head: EquipmentItemSchema.nullable().optional(),
    Armor: EquipmentItemSchema.nullable().optional(),
    Shoes: EquipmentItemSchema.nullable().optional(),
    Bag: EquipmentItemSchema.nullable().optional(),
    Cape: EquipmentItemSchema.nullable().optional(),
    Mount: EquipmentItemSchema.nullable().optional(),
    Potion: EquipmentItemSchema.nullable().optional(),
    Food: EquipmentItemSchema.nullable().optional(),
  })
  .passthrough();

const ParticipantSchema = PlayerSchema.extend({
  Equipment: EquipmentSchema.optional(),
  Inventory: z.array(EquipmentItemSchema.nullable()).optional(),
  DamageDone: z.number().optional(),
  SupportHealingDone: z.number().optional(),
  AverageItemPower: z.number().optional(),
});

const KillEventSchema = z
  .object({
    EventId: z.number(),
    TimeStamp: z.string(),
    Version: z.number().optional(),
    Killer: ParticipantSchema,
    Victim: ParticipantSchema,
    TotalVictimKillFame: z.number(),
    Location: z.string().optional().nullable(),
    Participants: z.array(ParticipantSchema).optional(),
    GroupMemberCount: z.number().optional(),
    numberOfParticipants: z.number().optional(),
    BattleId: z.number().optional(),
    Type: z.string().optional(),
    Inventory: z.array(EquipmentItemSchema.nullable()).optional(),
  })
  .passthrough();

const BattleLeaderboardEntrySchema = z
  .object({
    player: z.string(),
    guild: z.string().optional().nullable(),
    kills: z.number().optional().nullable(),
    deaths: z.number().optional().nullable(),
    killFame: z.number().optional().nullable(),
  })
  .passthrough();

const BattlePlayersSchema = z
  .object({
    a: z.array(ParticipantSchema).optional(),
    b: z.array(ParticipantSchema).optional(),
    player: z.array(BattleLeaderboardEntrySchema).optional(),
  })
  .passthrough();

const BattleSchema = z
  .object({
    id: z.number(),
    name: z.string().optional().nullable(),
    startTime: z.string(),
    endTime: z.string(),
    totalKills: z.number(),
    totalFame: z.number(),
    guilds: z.record(z.string(), z.unknown()).optional(),
    players: BattlePlayersSchema.optional(),
  })
  .passthrough();

const SearchResultSchema = z
  .object({
    players: z
      .array(
        z.object({
          Id: z.string(),
          Name: z.string(),
        })
      )
      .optional(),
    guilds: z
      .array(
        z.object({
          Id: z.string(),
          Name: z.string(),
        })
      )
      .optional(),
  })
  .passthrough();

const GuildLeaderboardEntrySchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    AllianceTag: z.string().optional().nullable(),
    KillFame: z.number().optional().nullable(),
    DeathFame: z.number().optional().nullable(),
    AttacksWon: z.number().optional().nullable(),
    DefensesWon: z.number().optional().nullable(),
    MemberCount: z.number().optional().nullable(),
  })
  .passthrough();

const GuildFameLeaderboardEntrySchema = z
  .object({
    GuildId: z.string(),
    GuildName: z.string(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    AllianceTag: z.string().optional().nullable(),
    Total: z.number().optional().nullable(),
    Rank: z.number().optional().nullable(),
  })
  .passthrough();

const AllianceGuildSchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    Tag: z.string().optional().nullable(),
    Rank: z.number().optional().nullable(),
    KillFame: z.number().optional().nullable(),
    MemberCount: z.number().optional().nullable(),
  })
  .passthrough();

const AllianceSchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    Tag: z.string().optional().nullable(),
    FounderId: z.string().optional().nullable(),
    Founded: z.string().optional().nullable(),
    KillFame: z.number().optional().nullable(),
    DeathFame: z.number().optional().nullable(),
    MemberCount: z.number().optional().nullable(),
    Guilds: z.array(AllianceGuildSchema).optional().nullable(),
  })
  .passthrough();

const CrystalMatchTeamSchema = z
  .object({
    GuildId: z.string().optional().nullable(),
    GuildName: z.string().optional().nullable(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    Score: z.number().optional().nullable(),
    Result: z.string().optional().nullable(),
  })
  .passthrough();

const CrystalMatchSchema = z
  .object({
    id: z.number(),
    startTime: z.string(),
    endTime: z.string().optional().nullable(),
    matchType: z.string().optional().nullable(),
    tier: z.number().optional().nullable(),
    teams: z.array(CrystalMatchTeamSchema).optional().nullable(),
    teamA: CrystalMatchTeamSchema.optional(),
    teamB: CrystalMatchTeamSchema.optional(),
    winningTeam: z.string().optional().nullable(),
    losingTeam: z.string().optional().nullable(),
    totalFame: z.number().optional().nullable(),
  })
  .passthrough();

export type Player = z.infer<typeof PlayerSchema>;
export type Guild = z.infer<typeof GuildSchema>;
export type EquipmentItem = z.infer<typeof EquipmentItemSchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type KillEvent = z.infer<typeof KillEventSchema>;
export type Battle = z.infer<typeof BattleSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type GuildLeaderboardEntry = z.infer<typeof GuildLeaderboardEntrySchema>;
export type GuildFameLeaderboardEntry = z.infer<typeof GuildFameLeaderboardEntrySchema>;
export type Alliance = z.infer<typeof AllianceSchema>;
export type CrystalMatch = z.infer<typeof CrystalMatchSchema>;
export type PlayerWeaponFameEntry = z.infer<typeof PlayerWeaponFameEntrySchema>;
export type KillFameLeaderboardEntry = z.infer<typeof KillFameLeaderboardEntrySchema>;
export type GuildMatch = z.infer<typeof GuildMatchSchema>;
export type PlayerStatisticsEntry = z.infer<typeof PlayerStatisticsEntrySchema>;

const JSON_HEADERS = {
  Accept: 'application/json',
} as const;

/**
 * Gameinfo API Client
 */
export class GameinfoClient {
  private server: Server;
  private baseUrl: string;

  constructor(server: Server = 'Americas') {
    this.server = server;
    this.baseUrl = BASE_URLS[server];
  }

  setServer(server: Server): void {
    this.server = server;
    this.baseUrl = BASE_URLS[server];
  }

  getServer(): Server {
    return this.server;
  }

  async search(query: string): Promise<SearchResult> {
    return this.request('/search', SearchResultSchema, { q: query });
  }

  async getPlayer(playerId: string): Promise<Player> {
    return this.request(`/players/${playerId}`, PlayerSchema);
  }

  async getPlayerKills(
    playerId: string,
    options?: { offset?: number; limit?: number }
  ): Promise<KillEvent[]> {
    return this.request(
      `/players/${playerId}/kills`,
      z.array(KillEventSchema),
      {
        offset: options?.offset ?? 0,
        limit: options?.limit ?? 20,
      }
    );
  }

  async getPlayerDeaths(
    playerId: string,
    options?: { offset?: number; limit?: number }
  ): Promise<KillEvent[]> {
    return this.request(
      `/players/${playerId}/deaths`,
      z.array(KillEventSchema),
      {
        offset: options?.offset ?? 0,
        limit: options?.limit ?? 20,
      }
    );
  }

  async getRecentKills(limit: number = 51, offset: number = 0): Promise<KillEvent[]> {
    return this.request('/events', z.array(KillEventSchema), { limit, offset });
  }

  async getGuild(guildId: string): Promise<Guild> {
    return this.request(`/guilds/${guildId}`, GuildSchema);
  }

  async getGuildMembers(guildId: string): Promise<Player[]> {
    return this.request(`/guilds/${guildId}/members`, z.array(PlayerSchema));
  }

  async getBattle(battleId: number): Promise<Battle> {
    return this.request(`/battles/${battleId}`, BattleSchema);
  }

  async getBattles(options?: {
    range?: 'day' | 'week' | 'month';
    limit?: number;
    offset?: number;
    sort?: 'recent' | 'fame';
  }): Promise<Battle[]> {
    return this.request(
      '/battles',
      z.array(BattleSchema),
      {
        range: options?.range,
        limit: options?.limit,
        offset: options?.offset,
        sort: options?.sort,
      }
    );
  }

  async getRecentBattles(
    range: 'day' | 'week' | 'month' = 'day',
    limit: number = 20,
    offset: number = 0
  ): Promise<Battle[]> {
    return this.getBattles({ range, limit, offset, sort: 'recent' });
  }

  /**
   * Get battle events (kills/deaths) for a specific battle
   * Endpoint: GET /events/battle/{ID}?offset={}&limit={}
   */
  async getBattleEvents(
    battleId: number,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<KillEvent[]> {
    return this.request(
      `/events/battle/${battleId}`,
      z.array(KillEventSchema),
      {
        limit: options?.limit ?? 51,
        offset: options?.offset ?? 0,
      }
    );
  }

  async getPlayerWeaponFameLeaderboard(options?: {
    range?: 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';
    limit?: number;
    offset?: number;
    weaponCategory?: string;
  }): Promise<PlayerWeaponFameEntry[]> {
    return this.request(
      '/events/playerweaponfame',
      z.array(PlayerWeaponFameEntrySchema),
      {
        range: options?.range ?? 'week',
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
        weaponCategory: options?.weaponCategory,
      }
    );
  }

  async getKillFameLeaderboard(options?: {
    range?: 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';
    limit?: number;
    offset?: number;
  }): Promise<KillFameLeaderboardEntry[]> {
    return this.request(
      '/events/killfame',
      z.array(KillFameLeaderboardEntrySchema),
      {
        range: options?.range ?? 'week',
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      }
    );
  }

  async getGuildMatchesTop(): Promise<GuildMatch[]> {
    return this.request('/guildmatches/top', z.array(GuildMatchSchema));
  }

  async getGuildMatchesNext(options?: {
    limit?: number;
    offset?: number;
  }): Promise<GuildMatch[]> {
    return this.request(
      '/guildmatches/next',
      z.array(GuildMatchSchema),
      {
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
      }
    );
  }

  async getGuildMatchesPast(options?: {
    limit?: number;
    offset?: number;
  }): Promise<GuildMatch[]> {
    return this.request(
      '/guildmatches/past',
      z.array(GuildMatchSchema),
      {
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
      }
    );
  }

  async getPlayerStatistics(options?: {
    range?: 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';
    type?: string;
    limit?: number;
    offset?: number;
    subtype?: string;
    region?: string;
    guildId?: string;
    allianceId?: string;
  }): Promise<PlayerStatisticsEntry[]> {
    return this.request(
      '/players/statistics',
      z.array(PlayerStatisticsEntrySchema),
      {
        range: options?.range ?? 'week',
        type: options?.type ?? 'PvE',
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
        subtype: options?.subtype,
        region: options?.region,
        guildId: options?.guildId,
        allianceId: options?.allianceId,
      }
    );
  }

  async getWeaponCategories(): Promise<string[]> {
    return this.request('/items/_weaponCategories', z.array(z.string()));
  }

  async getGuildLeaderboard(options?: {
    type?: 'attacks' | 'defenses';
    range?: 'day' | 'week' | 'month';
    limit?: number;
    offset?: number;
  }): Promise<GuildLeaderboardEntry[]> {
    const endpoint = options?.type === 'defenses' ? 'topguildsbydefenses' : 'topguildsbyattacks';

    return this.request(
      `/guilds/${endpoint}`,
      z.array(GuildLeaderboardEntrySchema),
      {
        range: options?.range ?? 'week',
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      }
    );
  }

  async getGuildKillFameLeaderboard(options?: {
    range?: 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth';
    limit?: number;
    offset?: number;
  }): Promise<GuildFameLeaderboardEntry[]> {
    return this.request(
      '/events/guildfame',
      z.array(GuildFameLeaderboardEntrySchema),
      {
        range: options?.range ?? 'week',
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      }
    );
  }

  async getAlliance(allianceId: string): Promise<Alliance> {
    return this.request(`/alliances/${allianceId}`, AllianceSchema);
  }

  async getCrystalMatches(options?: {
    limit?: number;
    offset?: number;
    tier?: number;
  }): Promise<CrystalMatch[]> {
    return this.request(
      '/matches/crystal',
      z.array(CrystalMatchSchema),
      {
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
        tier: options?.tier,
      }
    );
  }

  async getCrystalMatch(matchId: number): Promise<CrystalMatch> {
    return this.request(`/matches/crystal/${matchId}`, CrystalMatchSchema);
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | undefined | null>
  ): string {
    const relativePath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(relativePath, `${this.baseUrl}/`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  private async request<T>(
    path: string,
    schema: z.ZodType<T>,
    params?: Record<string, string | number | undefined | null>
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const response = await fetch(url, { headers: JSON_HEADERS });

    if (!response.ok) {
      throw new Error(`Gameinfo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return schema.parse(data);
  }
}

// Export singleton instance
export const gameinfoClient = new GameinfoClient();

export interface SupabaseKillEventRow {
  eventId: number;
  timestamp: string;
  killerId: string;
  killerName: string;
  killerGuildId: string | null;
  killerGuildName: string | null;
  killerAllianceId: string | null;
  killerAllianceName: string | null;
  killerItemPower: number | null;
  killerDamageDone: number | null;
  killerEquipment: Equipment | null;
  victimId: string;
  victimName: string;
  victimGuildId: string | null;
  victimGuildName: string | null;
  victimAllianceId: string | null;
  victimAllianceName: string | null;
  victimItemPower: number | null;
  victimEquipment: Equipment | null;
  victimInventory: EquipmentItem[] | null;
  totalFame: number;
  location: string | null;
  numberOfParticipants: number | null;
  battleId: number | null;
  participants: Player[] | null;
}

/**
 * Normalize Supabase kill event rows into Gameinfo-style kill events
 */
export function normalizeKillEventRow(row: SupabaseKillEventRow): KillEvent {
  return {
    EventId: row.eventId,
    TimeStamp: row.timestamp,
    Killer: {
      Id: row.killerId,
      Name: row.killerName,
      GuildId: row.killerGuildId ?? undefined,
      GuildName: row.killerGuildName ?? undefined,
      AllianceId: row.killerAllianceId ?? undefined,
      AllianceName: row.killerAllianceName ?? undefined,
      AverageItemPower: row.killerItemPower ?? undefined,
      DamageDone: row.killerDamageDone ?? undefined,
      Equipment: row.killerEquipment ?? undefined,
    },
    Victim: {
      Id: row.victimId,
      Name: row.victimName,
      GuildId: row.victimGuildId ?? undefined,
      GuildName: row.victimGuildName ?? undefined,
      AllianceId: row.victimAllianceId ?? undefined,
      AllianceName: row.victimAllianceName ?? undefined,
      AverageItemPower: row.victimItemPower ?? undefined,
      Equipment: row.victimEquipment ?? undefined,
      Inventory: row.victimInventory ?? undefined,
    },
    TotalVictimKillFame: row.totalFame,
    Location: row.location ?? undefined,
    numberOfParticipants: row.numberOfParticipants ?? undefined,
    BattleId: row.battleId ?? undefined,
    Participants: row.participants ?? undefined,
    Inventory: row.victimInventory ?? undefined,
  };
}
