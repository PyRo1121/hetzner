export type SearchType = 'kills' | 'players' | 'guilds' | 'battles';

export interface SearchFilters {
  type: SearchType;
  query: string;
  guildId?: string;
  allianceId?: string;
  city?: string;
  weaponType?: string;
  quality?: number;
  timeRange: 'day' | 'week' | 'month';
  minFame?: number;
  maxFame?: number;
  sortBy: 'relevance' | 'fame' | 'time' | 'guild' | 'city';
  sortOrder: 'asc' | 'desc';
}
