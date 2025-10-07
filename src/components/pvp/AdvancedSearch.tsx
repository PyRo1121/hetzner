'use client';

import { useEffect, useState } from 'react';

import { Clock, MapPin, Search, SortAsc, SortDesc, Swords, Trophy, Users, X } from 'lucide-react';

import { type KillEvent, gameinfoClient } from '@/lib/api/gameinfo/client';

interface AdvancedSearchProps {
  onKillSelect?: (kill: KillEvent) => void;
  onPlayerSelect?: (playerId: string) => void;
  onGuildSelect?: (guildId: string) => void;
  onBattleSelect?: (battleId: number) => void;
}

type SearchType = 'kills' | 'players' | 'guilds' | 'battles';

interface SearchFilters {
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

export function AdvancedSearch({
  onKillSelect,
  onPlayerSelect,
  onGuildSelect,
  onBattleSelect,
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'kills',
    query: '',
    timeRange: 'week',
    sortBy: 'time',
    sortOrder: 'desc',
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Auto-suggest for search query
  useEffect(() => {
    if (filters.query.length > 2) {
      const generateSuggestions = async () => {
        try {
          const res = await gameinfoClient.search(filters.query);
          const players = (res.players ?? []).slice(0, 3).map((p) => p.Name);
          const guilds = (res.guilds ?? []).slice(0, 3).map((g) => g.Name);
          setSuggestions([...players, ...guilds]);
        } catch (error) {
          console.error('Suggestion error:', error);
        }
      };

      const timeoutId = setTimeout(() => {
        void generateSuggestions();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [filters.query]);

  const handleSearch = async () => {
    if (!filters.query.trim()) {
      return;
    }

    setLoading(true);
    try {
      let searchResults: any[] = [];

      switch (filters.type) {
        case 'kills': {
          const kills = await gameinfoClient.getRecentKills(51, 0); // Fixed: API limit is 51
          // Apply client-side filters
          searchResults = kills.filter((kill) => {
            const matchesQuery =
              !filters.query ||
              kill.Killer.Name.toLowerCase().includes(filters.query.toLowerCase()) ||
              kill.Victim.Name.toLowerCase().includes(filters.query.toLowerCase());

            const matchesFame =
              (!filters.minFame || kill.TotalVictimKillFame >= filters.minFame) &&
              (!filters.maxFame || kill.TotalVictimKillFame <= filters.maxFame);

            const matchesCity = !filters.city || kill.Location === filters.city;

            const matchesGuild =
              !filters.guildId ||
              kill.Killer.GuildId === filters.guildId ||
              kill.Victim.GuildId === filters.guildId;

            return matchesQuery && matchesFame && matchesCity && matchesGuild;
          });
          break;
        }

        case 'players': {
          const res = await gameinfoClient.search(filters.query);
          searchResults = res.players ?? [];
          break;
        }

        case 'guilds': {
          const res = await gameinfoClient.search(filters.query);
          searchResults = res.guilds ?? [];
          break;
        }

        case 'battles': {
          const battles = await gameinfoClient.getRecentBattles(filters.timeRange, 50, 0);
          searchResults = battles.filter((battle) => {
            const matchesQuery =
              !filters.query ||
              (battle.name?.toLowerCase().includes(filters.query.toLowerCase()) &&
                Object.values(battle.guilds ?? {}).some((guild: any) =>
                  guild?.toString().toLowerCase().includes(filters.query.toLowerCase())
                ));
            return matchesQuery;
          });
          break;
        }
      }

      // Apply sorting
      searchResults.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filters.sortBy) {
          case 'fame':
            aValue = filters.type === 'kills' ? a.TotalVictimKillFame : 0;
            bValue = filters.type === 'kills' ? b.TotalVictimKillFame : 0;
            break;
          case 'time':
            aValue = filters.type === 'kills' ? new Date(a.TimeStamp) : new Date();
            bValue = filters.type === 'kills' ? new Date(b.TimeStamp) : new Date();
            break;
          case 'guild':
            aValue = filters.type === 'kills' ? (a.Killer.GuildName ?? '') : '';
            bValue = filters.type === 'kills' ? (b.Killer.GuildName ?? '') : '';
            break;
          case 'city':
            aValue = filters.type === 'kills' ? (a.Location ?? '') : '';
            bValue = filters.type === 'kills' ? (b.Location ?? '') : '';
            break;
          default:
            return 0;
        }

        if (filters.sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      setResults(searchResults.slice(0, 50));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.query) {
      void handleSearch();
    }
  }, [
    filters.type,
    filters.guildId,
    filters.timeRange,
    filters.minFame,
    filters.maxFame,
    filters.city,
  ]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'kills',
      query: '',
      timeRange: 'week',
      sortBy: 'time',
      sortOrder: 'desc',
    });
    setResults([]);
  };

  return (
    <div className="panel-float">
      {/* Search Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <Search className="h-6 w-6 text-neon-blue" />
          <h3 className="text-xl font-bold">Advanced Search</h3>
        </div>

        {/* Search Type Tabs */}
        <div className="mb-4 flex gap-2">
          {[
            { key: 'kills', label: 'Kills', icon: Swords },
            { key: 'players', label: 'Players', icon: Users },
            { key: 'guilds', label: 'Guilds', icon: Trophy },
            { key: 'battles', label: 'Battles', icon: MapPin },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleFilterChange('type', key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                filters.type === key
                  ? 'bg-neon-blue text-white'
                  : 'text-albion-gray-400 bg-albion-gray-800 hover:bg-albion-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Search Input with Suggestions */}
        <div className="relative mb-4">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            placeholder={`Search ${filters.type}...`}
            className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-4 py-3 text-white placeholder-albion-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-neon-blue"
          />

          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-albion-gray-700 bg-albion-gray-800 shadow-lg">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleFilterChange('query', suggestion)}
                  className="w-full px-4 py-2 text-left text-white transition-colors hover:bg-albion-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters Row */}
        <div className="mb-4 flex flex-wrap gap-4">
          {/* Time Range */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-albion-gray-500" />
            <select
              value={filters.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              className="rounded border border-albion-gray-700 bg-albion-gray-800 px-3 py-2 text-sm text-white"
            >
              <option value="day">Last 24h</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Fame Range (for kills) */}
          {filters.type === 'kills' && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min Fame"
                  value={filters.minFame ?? ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'minFame',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-20 rounded border border-albion-gray-700 bg-albion-gray-800 px-2 py-2 text-sm text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Max Fame"
                  value={filters.maxFame ?? ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'maxFame',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-20 rounded border border-albion-gray-700 bg-albion-gray-800 px-2 py-2 text-sm text-white"
                />
              </div>
            </>
          )}

          {/* City Filter (for kills) */}
          {filters.type === 'kills' && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-albion-gray-500" />
              <select
                value={filters.city ?? ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
                className="rounded border border-albion-gray-700 bg-albion-gray-800 px-3 py-2 text-sm text-white"
              >
                <option value="">All Cities</option>
                <option value="Caerleon">Caerleon</option>
                <option value="Bridgewatch">Bridgewatch</option>
                <option value="Lymhurst">Lymhurst</option>
                <option value="Martlock">Martlock</option>
                <option value="Fort Sterling">Fort Sterling</option>
                <option value="Thetford">Thetford</option>
              </select>
            </div>
          )}

          {/* Sorting */}
          <div className="flex items-center gap-2">
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4 text-albion-gray-500" />
            ) : (
              <SortDesc className="h-4 w-4 text-albion-gray-500" />
            )}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="rounded border border-albion-gray-700 bg-albion-gray-800 px-3 py-2 text-sm text-white"
            >
              <option value="time-desc">Newest First</option>
              <option value="time-asc">Oldest First</option>
              <option value="fame-desc">Highest Fame</option>
              <option value="fame-asc">Lowest Fame</option>
              <option value="guild-asc">Guild A-Z</option>
              <option value="guild-desc">Guild Z-A</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          className="text-albion-gray-400 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-albion-gray-800 hover:text-white"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </button>
      </div>

      {/* Results */}
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neon-blue" />
            <span className="text-albion-gray-400 ml-3">Searching...</span>
          </div>
        ) : results.length > 0 ? (
          results.map((result, index) => (
            <SearchResultItem
              key={`${filters.type}-${index}`}
              type={filters.type}
              data={result}
              onKillSelect={onKillSelect}
              onPlayerSelect={onPlayerSelect}
              onGuildSelect={onGuildSelect}
              onBattleSelect={onBattleSelect}
            />
          ))
        ) : filters.query ? (
          <div className="py-12 text-center text-albion-gray-500">
            <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No results found</p>
            <p className="mt-2 text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="py-12 text-center text-albion-gray-500">
            <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Enter a search term to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultItem({
  type,
  data,
  onKillSelect,
  onPlayerSelect,
  onGuildSelect,
  onBattleSelect,
}: {
  type: SearchType;
  data: any;
  onKillSelect?: (kill: KillEvent) => void;
  onPlayerSelect?: (playerId: string) => void;
  onGuildSelect?: (guildId: string) => void;
  onBattleSelect?: (battleId: number) => void;
}) {
  switch (type) {
    case 'kills':
      return (
        <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-800/50 p-4 transition-colors hover:bg-albion-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-neon-red">{data.Killer.Name}</span>
              <span className="text-albion-gray-400">killed</span>
              <span className="text-lg font-bold text-neon-green">{data.Victim.Name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-neon-orange font-bold">
                {data.TotalVictimKillFame.toLocaleString()}
              </span>
              <span className="text-sm text-albion-gray-500">
                {new Date(data.TimeStamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
          {data.Location ? (
            <div className="mt-1 text-sm text-albion-gray-500">📍 {data.Location}</div>
          ) : null}
          <button
            onClick={() => onKillSelect?.(data)}
            className="mt-2 text-sm text-neon-blue hover:text-neon-blue/80"
          >
            View Details →
          </button>
        </div>
      );

    case 'players':
      return (
        <button
          onClick={() => onPlayerSelect?.(data.Id)}
          className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800/50 p-4 text-left transition-colors hover:bg-albion-gray-800"
        >
          <div className="font-bold text-white">{data.Name}</div>
          {data.GuildName ? (
            <div className="text-albion-gray-400 text-sm">Guild: {data.GuildName}</div>
          ) : null}
        </button>
      );

    case 'guilds':
      return (
        <button
          onClick={() => onGuildSelect?.(data.Id)}
          className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800/50 p-4 text-left transition-colors hover:bg-albion-gray-800"
        >
          <div className="font-bold text-white">{data.Name}</div>
          <div className="text-albion-gray-400 text-sm">ID: {data.Id}</div>
        </button>
      );

    case 'battles':
      return (
        <button
          onClick={() => onBattleSelect?.(data.id)}
          className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800/50 p-4 text-left transition-colors hover:bg-albion-gray-800"
        >
          <div className="font-bold text-white">{data.name ?? `Battle #${data.id}`}</div>
          <div className="text-albion-gray-400 text-sm">
            {data.totalKills} kills • {data.totalFame.toLocaleString()} fame
          </div>
        </button>
      );

    default:
      return null;
  }
}
