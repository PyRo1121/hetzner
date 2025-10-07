'use client';

import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce';
import { searchGuilds, type Guild } from '@/lib/api/gameinfo/guilds';

interface GuildSearchProps {
  onSelectGuild?: (guild: Guild) => void;
}

export function GuildSearch({ onSelectGuild }: GuildSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Guild[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Search when debounced query changes
  useState(() => {
    if (debouncedQuery.length >= 2) {
      handleSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  });

  const handleSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const { guilds } = await searchGuilds(searchQuery);
      setResults(guilds);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectGuild = (guild: Guild) => {
    setQuery('');
    setResults([]);
    onSelectGuild?.(guild);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="panel-float">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-albion-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for guilds..."
            className="flex-1 bg-transparent text-white placeholder-albion-gray-500 outline-none"
          />
          {isSearching ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-albion-gray-700 border-t-neon-blue" /> : null}
        </div>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 shadow-2xl"
          >
            <div className="max-h-96 overflow-y-auto p-2">
              {results.map((guild) => (
                <button
                  key={guild.Id}
                  onClick={() => handleSelectGuild(guild)}
                  className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-albion-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-neon-blue" />
                    <div>
                      <div className="font-medium text-white">{guild.Name}</div>
                      {guild.AllianceName ? <div className="text-xs text-albion-gray-500">
                          [{guild.AllianceTag}] {guild.AllianceName}
                        </div> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-albion-gray-500">Members</div>
                      <div className="font-medium text-white">{guild.MemberCount || 0}</div>
                    </div>
                    {guild.killFame ? <div className="text-center">
                        <div className="text-xs text-albion-gray-500">Fame</div>
                        <div className="font-medium text-neon-gold">
                          {(guild.killFame / 1000000).toFixed(1)}M
                        </div>
                      </div> : null}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {query.length >= 2 && !isSearching && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute z-50 mt-2 w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-8 text-center shadow-2xl"
        >
          <Users className="mx-auto mb-2 h-12 w-12 text-albion-gray-700" />
          <p className="text-sm text-albion-gray-500">No guilds found</p>
        </motion.div>
      )}
    </div>
  );
}
