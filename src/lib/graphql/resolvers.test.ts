import { describe, it, expect, vi } from 'vitest';
import { resolvers } from './resolvers';

// Mock API clients
vi.mock('@/lib/api/aodp/client', () => ({
  aodpClient: {
    setServer: vi.fn(),
    getPrices: vi.fn().mockResolvedValue([
      {
        item_id: 'T4_BAG',
        city: 'Caerleon',
        quality: 1,
        sell_price_min: 1000,
        sell_price_max: 1200,
        buy_price_min: 900,
        buy_price_max: 1100,
        sell_price_min_date: '2025-09-30T00:00:00Z',
      },
    ]),
    getHistory: vi.fn().mockResolvedValue([]),
    getGoldPrices: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/api/gameinfo/client', () => ({
  gameinfoClient: {
    setServer: vi.fn(),
    search: vi.fn().mockResolvedValue({ players: [], guilds: [] }),
    getPlayer: vi.fn(),
    getGuild: vi.fn(),
    getBattles: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/data/items-loader', () => ({
  searchItems: vi.fn().mockResolvedValue([]),
  getItemByUniqueName: vi.fn().mockResolvedValue(null),
  getLocalizedName: vi.fn((item) => item.UniqueName),
}));

describe('GraphQL Resolvers', () => {
  const context = { server: 'Americas' as const };

  it('should resolve marketPrices query', async () => {
    const result = await resolvers.Query.marketPrices(
      {},
      { itemIds: ['T4_BAG'], server: 'Americas' },
      context
    );

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].node.itemId).toBe('T4_BAG');
    expect(result.pageInfo.hasNextPage).toBe(false);
  });

  it('should handle pagination in marketPrices', async () => {
    const result = await resolvers.Query.marketPrices(
      {},
      { itemIds: ['T4_BAG'], first: 1, after: '0' },
      context
    );

    expect(result.edges).toBeDefined();
    expect(result.pageInfo).toBeDefined();
  });

  it('should resolve searchPlayers query', async () => {
    const result = await resolvers.Query.searchPlayers({}, { query: 'test' }, context);

    expect(result).toHaveProperty('players');
    expect(result).toHaveProperty('guilds');
  });

  it('should resolve battles query', async () => {
    const result = await resolvers.Query.battles({}, { limit: 10 }, context);

    expect(Array.isArray(result)).toBe(true);
  });
});
