'use client';

import { useState } from 'react';

import { Search, User, Users } from 'lucide-react';

import { gameinfoClient } from '@/lib/api/gameinfo/client';

interface SearchResultsProps {
  onPlayerSelect?: (playerId: string) => void;
  onGuildSelect?: (guildId: string) => void;
}

export function SearchResults({ onPlayerSelect, onGuildSelect }: SearchResultsProps) {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {return;}

    setLoading(true);
    try {
      const res = await gameinfoClient.search(query);
      setPlayers(res.players ?? []);
      setGuilds(res.guilds ?? []);
      setSearched(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="panel-float">
      {/* Search Input */}
      <div className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-albion-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search players, guilds..."
              className="w-full pl-10 pr-4 py-3 bg-albion-gray-800 border border-albion-gray-700 rounded-lg text-white placeholder-albion-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      {searched ? <div className="space-y-6">
          {/* Players */}
          {players.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Players ({players.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {players.slice(0, 10).map((player) => (
                  <button
                    key={player.Id}
                    onClick={() => onPlayerSelect?.(player.Id)}
                    className="text-left p-4 bg-albion-gray-800 rounded-lg hover:bg-albion-gray-700 transition-colors border border-albion-gray-700"
                  >
                    <div className="font-medium text-white">{player.Name}</div>
                    {player.GuildName ? <div className="text-sm text-albion-gray-400">[{player.GuildName}]</div> : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guilds */}
          {guilds.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guilds ({guilds.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {guilds.slice(0, 10).map((guild) => (
                  <button
                    key={guild.Id}
                    onClick={() => onGuildSelect?.(guild.Id)}
                    className="text-left p-4 bg-albion-gray-800 rounded-lg hover:bg-albion-gray-700 transition-colors border border-albion-gray-700"
                  >
                    <div className="font-medium text-white">{guild.Name}</div>
                    <div className="text-sm text-albion-gray-400">ID: {guild.Id}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {players.length === 0 && guilds.length === 0 && (
            <div className="text-center py-12 text-albion-gray-500">
              No players or guilds found for "{query}"
            </div>
          )}
        </div> : null}

      {/* Initial State */}
      {!searched && (
        <div className="text-center py-12 text-albion-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Search for players and guilds to get started</p>
        </div>
      )}
    </div>
  );
}
