import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

import { guildService } from '@/lib/services';

vi.mock('@/lib/api/gameinfo/client', () => {
  const mockGuild = { Id: 'guild123', Name: 'Mock Guild', AllianceId: null };
  const mockAlliance = { Id: 'ally1', Name: 'Alliance', Tag: 'TAG' };
  const mockLeaderboardEntry = {
    Id: 'guild123',
    Name: 'Mock Guild',
    AllianceId: null,
    AllianceName: null,
    AllianceTag: null,
    MemberCount: 10,
    KillFame: 1000,
    DeathFame: 500,
    AttacksWon: 20,
    DefensesWon: 15,
    Rank: 1,
  };
  const mockKillFameEntry = {
    GuildId: 'guild123',
    GuildName: 'Mock Guild',
    AllianceId: null,
    AllianceName: null,
    AllianceTag: null,
    Total: 1500,
    Rank: 1,
  };
  const mockCrystalMatch = {
    id: 999,
    startTime: '2025-10-04T00:00:00Z',
    endTime: null,
    matchType: 'crystal',
    tier: 3,
    teams: [],
    totalFame: 1234,
  };

  return {
    gameinfoClient: {
      getGuild: vi.fn().mockResolvedValue(mockGuild),
      getAlliance: vi.fn().mockResolvedValue(mockAlliance),
      getGuildLeaderboard: vi.fn().mockResolvedValue([mockLeaderboardEntry]),
      getGuildKillFameLeaderboard: vi.fn().mockResolvedValue([mockKillFameEntry]),
      getCrystalMatches: vi.fn().mockResolvedValue([mockCrystalMatch]),
      getCrystalMatch: vi.fn().mockResolvedValue(mockCrystalMatch),
    },
  };
});

vi.mock('@/lib/api/gameinfo/guilds', () => ({
  getGuildMembers: vi.fn().mockResolvedValue([
    {
      Id: 'player1',
      Name: 'Player One',
      GuildId: 'guild123',
      GuildName: 'Mock Guild',
      AllianceId: null,
      AllianceName: null,
      Role: 'Member',
      KillFame: 200,
      DeathFame: 50,
    },
  ]),
}));

const mockCache = new Map<string, unknown>();

vi.mock('@/lib/cache/redis-cache', () => ({
  getCache: vi.fn(async (key: string) => mockCache.get(key) ?? null),
  setCache: vi.fn(async (key: string, value: unknown) => {
    mockCache.set(key, value);
  }),
  CACHE_TTL: {
    STANDARD: 60,
    STABLE: 3600,
  },
}));

vi.mock('@/lib/services/guild.service', async (originalModule) => {
  const actual = await originalModule();
  return {
    ...actual,
    GuildService: actual.GuildService,
  };
});

describe('guildService', () => {
  beforeEach(() => {
    mockCache.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('getGuildProfile caches results', async () => {
    const result1 = await guildService.getGuildProfile('guild123');
    const result2 = await guildService.getGuildProfile('guild123');

    expect(result1.guild?.Id).toBe('guild123');
    expect(result2).toStrictEqual(result1);
  });

  test('getGuildMembers caches results', async () => {
    const result1 = await guildService.getGuildMembers('guild123');
    const result2 = await guildService.getGuildMembers('guild123');

    expect(result1.guildId).toBe('guild123');
    expect(result2.members).toHaveLength(1);
    expect(result2).toStrictEqual(result1);
  });

  test('getGuildKillFameLeaderboard returns entries', async () => {
    const entries = await guildService.getGuildKillFameLeaderboard({ range: 'week', limit: 10 });
    expect(entries).toHaveLength(1);
    expect(entries[0].GuildId).toBe('guild123');
  });

  test('getGuildAttackDefenseLeaderboard fetches data', async () => {
    const entries = await guildService.getGuildAttackDefenseLeaderboard({ type: 'attacks', range: 'week' });
    expect(entries).toHaveLength(1);
    expect(entries[0].Id).toBe('guild123');
  });

  test('getCrystalMatch caches single match', async () => {
    const match1 = await guildService.getCrystalMatch(999);
    const match2 = await guildService.getCrystalMatch(999);
    expect(match1?.id).toBe(999);
    expect(match2).toStrictEqual(match1);
  });
});
