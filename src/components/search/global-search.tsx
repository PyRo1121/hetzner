'use client';

import { useState, useCallback, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce';

interface SearchResult {
  id: string;
  type: 'item' | 'player' | 'guild';
  name: string;
  description?: string;
  icon?: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        // GraphQL search query
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query Search($query: String!) {
                search(query: $query) {
                  items {
                    id
                    name
                    description
                  }
                  players {
                    id
                    name
                  }
                  guilds {
                    id
                    name
                  }
                }
              }
            `,
            variables: { query: debouncedQuery },
          }),
        });

        const { data } = await response.json();
        
        // Combine and format results
        const combinedResults: SearchResult[] = [
          ...(data?.search?.items?.map((item: any) => ({
            id: item.id,
            type: 'item' as const,
            name: item.name,
            description: item.description,
          })) || []),
          ...(data?.search?.players?.map((player: any) => ({
            id: player.id,
            type: 'player' as const,
            name: player.name,
          })) || []),
          ...(data?.search?.guilds?.map((guild: any) => ({
            id: guild.id,
            type: 'guild' as const,
            name: guild.name,
          })) || []),
        ];

        setResults(combinedResults.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) {return text;}
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-neon-gold/30 text-neon-gold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-albion-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search items, players, guilds..."
          className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 py-3 pl-12 pr-12 text-white placeholder-albion-gray-500 transition-all focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
        />
        
        {/* Loading/Clear Button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-neon-blue" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="text-albion-gray-500 transition-colors hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query.trim() || results.length > 0) ? <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-albion-gray-700 bg-albion-gray-900 shadow-2xl"
          >
            {results.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <motion.a
                    key={result.id}
                    href={`/${result.type}/${result.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-center gap-3 border-b border-albion-gray-700/50 px-4 py-3 transition-colors hover:bg-albion-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    {/* Type Badge */}
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold uppercase ${
                        result.type === 'item'
                          ? 'bg-neon-purple/20 text-neon-purple'
                          : result.type === 'player'
                            ? 'bg-neon-blue/20 text-neon-blue'
                            : 'bg-neon-gold/20 text-neon-gold'
                      }`}
                    >
                      {result.type}
                    </span>

                    {/* Result Content */}
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {highlightMatch(result.name, query)}
                      </div>
                      {result.description ? <div className="text-sm text-albion-gray-500">
                          {result.description}
                        </div> : null}
                    </div>
                  </motion.a>
                ))}
              </div>
            ) : debouncedQuery.trim() && !isLoading ? (
              <div className="px-4 py-8 text-center text-albion-gray-500">
                No results found for &quot;{debouncedQuery}&quot;
              </div>
            ) : null}
          </motion.div> : null}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen ? <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        /> : null}
    </div>
  );
}
