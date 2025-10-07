/**
 * Central export for all API clients
 */

export { AODPClient, aodpClient } from './aodp/client';
export type { PriceData, HistoryData, GoldPrice } from './aodp/client';

export { GameinfoClient, gameinfoClient } from './gameinfo/client';
export type {
  Player,
  Guild,
  Battle,
  SearchResult,
  KillEvent,
  Equipment,
  EquipmentItem,
  GuildLeaderboardEntry,
} from './gameinfo/client';

export { OpenAlbionClient, openAlbionClient } from './openalbion/client';
export type { Category, Item } from './openalbion/client';

export { RenderClient, renderClient } from './render/client';
export type { Quality, Enchantment } from './render/client';
