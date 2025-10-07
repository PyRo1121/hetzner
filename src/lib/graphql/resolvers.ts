/**
 * GraphQL Resolvers
 * Connects schema to API clients
 */

import { aodpClient } from '@/lib/api/aodp/client';
import { gameinfoClient } from '@/lib/api/gameinfo/client';
import { getItemRenderPath } from '@/lib/render/item-icons';
import { itemsService } from '@/lib/services';
import type { Server } from '@/types';

export interface Context {
  server: Server;
}

export const resolvers = {
  Query: {
    // Market Prices with pagination
    async marketPrices(
      _: unknown,
      args: {
        itemIds: string[];
        locations?: string[];
        qualities?: string[];
        server?: Server;
        first?: number;
        after?: string;
      },
      context: Context
    ) {
      const server = args.server || context.server || 'Americas';
      aodpClient.setServer(server);

      const itemIdsStr = args.itemIds.join(',');
      const locationsStr = args.locations?.join(',');
      const qualitiesStr = args.qualities?.join(',');

      const prices = await aodpClient.getPrices(itemIdsStr, {
        locations: locationsStr,
        qualities: qualitiesStr,
      });

      // Simple pagination
      const first = args.first ?? 50;
      const afterIndex = args.after ? parseInt(args.after, 10) : 0;
      const paginatedPrices = prices.slice(afterIndex, afterIndex + first);

      return {
        edges: paginatedPrices.map((price, index) => ({
          node: {
            itemId: price.item_id,
            itemName: price.item_id, // Will be resolved by Item resolver
            city: price.city,
            quality: price.quality,
            sellPriceMin: price.sell_price_min,
            sellPriceMax: price.sell_price_max,
            buyPriceMin: price.buy_price_min,
            buyPriceMax: price.buy_price_max,
            timestamp: price.sell_price_min_date,
            server,
          },
          cursor: (afterIndex + index).toString(),
        })),
        pageInfo: {
          hasNextPage: afterIndex + first < prices.length,
          hasPreviousPage: afterIndex > 0,
          startCursor: afterIndex.toString(),
          endCursor: (afterIndex + paginatedPrices.length - 1).toString(),
        },
        totalCount: prices.length,
      };
    },

    // Price History
    async priceHistory(
      _: unknown,
      args: {
        itemIds: string[];
        startDate?: string;
        endDate?: string;
        locations?: string[];
        qualities?: string[];
        timeScale?: 1 | 24;
        server?: Server;
      },
      context: Context
    ) {
      const server = args.server || context.server || 'Americas';
      aodpClient.setServer(server);

      const itemIdsStr = args.itemIds.join(',');
      const locationsStr = args.locations?.join(',');
      const qualitiesStr = args.qualities?.join(',');

      const history = await aodpClient.getHistory(itemIdsStr, {
        date: args.startDate,
        endDate: args.endDate,
        locations: locationsStr,
        qualities: qualitiesStr,
        timeScale: args.timeScale,
      });

      return history.map((h) => ({
        itemId: h.item_id,
        location: h.location,
        quality: h.quality,
        data: h.data.map((d) => ({
          timestamp: d.timestamp,
          avgPrice: d.avg_price,
          itemCount: d.item_count,
        })),
      }));
    },

    // Gold Prices
    async goldPrices(
      _: unknown,
      args: {
        startDate?: string;
        endDate?: string;
        count?: number;
        server?: Server;
      },
      context: Context
    ) {
      const server = args.server || context.server || 'Americas';
      aodpClient.setServer(server);

      const prices = await aodpClient.getGoldPrices({
        date: args.startDate,
        endDate: args.endDate,
        count: args.count,
      });

      return prices.map((p) => ({
        price: p.price,
        timestamp: p.timestamp,
        server,
      }));
    },

    // Search Players
    async searchPlayers(_: unknown, args: { query: string }, context: Context) {
      const server = context.server;
      gameinfoClient.setServer(server);

      const results = await gameinfoClient.search(args.query);

      return {
        players: results.players?.map((p) => ({ id: p.Id, name: p.Name })) ?? [],
        guilds: results.guilds?.map((g) => ({ id: g.Id, name: g.Name })) ?? [],
      };
    },

    // Get Player
    async player(_: unknown, args: { id: string }, context: Context) {
      const server = context.server;
      gameinfoClient.setServer(server);

      const player = await gameinfoClient.getPlayer(args.id);

      return {
        id: player.Id,
        name: player.Name,
        guildId: player.GuildId,
        guildName: player.GuildName,
        allianceId: player.AllianceId,
        allianceName: player.AllianceName,
        killFame: player.KillFame,
        deathFame: player.DeathFame,
        fameRatio: player.FameRatio,
      };
    },

    // Get Guild
    async guild(_: unknown, args: { id: string }, context: Context) {
      const server = context.server;
      gameinfoClient.setServer(server);

      const guild = await gameinfoClient.getGuild(args.id);

      return {
        id: guild.Id,
        name: guild.Name,
        allianceId: guild.AllianceId,
        allianceName: guild.AllianceName,
        allianceTag: guild.AllianceTag,
        founderId: guild.FounderId,
        founderName: guild.FounderName,
        founded: guild.Founded,
        memberCount: guild.MemberCount,
        killFame: guild.killFame,
        deathFame: guild.DeathFame,
      };
    },

    // Get Battles
    async battles(_: unknown, args: { limit?: number; offset?: number }, context: Context) {
      const server = context.server;
      gameinfoClient.setServer(server);

      const battles = await gameinfoClient.getBattles({
        limit: args.limit,
        offset: args.offset,
      });

      return battles.map((b) => ({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
        totalKills: b.totalKills,
        totalFame: b.totalFame,
      }));
    },

    // Search Items
    async searchItems(_: unknown, args: { query: string; locale?: string; limit?: number }) {
      const items = await itemsService.search(args.query, args.limit ?? 50);

      return items.map((item) => ({
        uniqueName: item.id,
        localizedName: itemsService.getLocalizedName(item),
        tier: item.tier,
        category: item.category,
        iconUrl: item.iconUrl ?? getItemRenderPath(item.id, { size: 217 }) ?? '',
      }));
    },

    // Get Item
    async item(_: unknown, args: { uniqueName: string }) {
      const item = await itemsService.getById(args.uniqueName);

      if (!item) {
        return null;
      }

      return {
        uniqueName: item.id,
        localizedName: itemsService.getLocalizedName(item),
        tier: item.tier,
        category: item.category,
        iconUrl: item.iconUrl ?? getItemRenderPath(item.id, { size: 217 }) ?? '',
      };
    },

    // Global Search (items, players, guilds)
    async search(_: unknown, args: { query: string; limit?: number }, context: Context) {
      const limit = args.limit ?? 10;
      const server = context.server;
      gameinfoClient.setServer(server);

      // Search items
      const items = await itemsService.search(args.query, limit);

      // Search players and guilds
      const searchResult = await gameinfoClient.search(args.query);

      return {
        items: items.slice(0, limit).map((item) => ({
          id: item.id,
          name: itemsService.getLocalizedName(item),
          description: `Tier ${item.tier}`,
          iconUrl: item.iconUrl ?? getItemRenderPath(item.id, { size: 128 }) ?? '',
        })),
        players: (searchResult.players ?? []).slice(0, limit).map((player) => ({
          id: player.Id,
          name: player.Name,
        })),
        guilds: (searchResult.guilds ?? []).slice(0, limit).map((guild) => ({
          id: guild.Id,
          name: guild.Name,
        })),
      };
    },
  },
};
