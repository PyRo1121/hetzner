'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Search, Bell, Globe, Command } from 'lucide-react';


import { useItemSearch } from '@/hooks/use-items';
import { useAppStore } from '@/lib/store/app-store';
import type { Server } from '@/types';

const servers: { value: Server; label: string }[] = [
  { value: 'Americas', label: '🌎 Americas' },
  { value: 'Europe', label: '🌍 Europe' },
  { value: 'Asia', label: '🌏 Asia' },
];

export function Header() {
  const router = useRouter();
  const { selectedServer, setSelectedServer, searchQuery, setSearchQuery } = useAppStore();
  const [showResults, setShowResults] = useState(false);
  
  // Search items when user types
  const { data: searchResults } = useItemSearch(searchQuery, 8);

  // Close results when clicking outside
  useEffect(() => {
    const handleClick = () => setShowResults(false);
    if (showResults) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showResults]);

  const handleItemClick = (itemId: string) => {
    router.push(`/dashboard/market?search=${encodeURIComponent(itemId)}`);
    setShowResults(false);
  };

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-albion-gray-700/50 bg-gradient-to-r from-albion-gray-900 via-albion-gray-900 to-albion-gray-800 px-6 backdrop-blur-xl">
      {/* Gradient Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-50" />
      
      {/* Search Bar */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-albion-gray-500" />
          <Command className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-albion-gray-600" />
          <input
            type="text"
            placeholder="Quick search items, players, guilds... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(e.target.value.length >= 2);
            }}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            className="w-full rounded-xl border border-albion-gray-700/50 bg-albion-gray-800/50 py-2.5 pl-10 pr-10 text-sm text-white placeholder-albion-gray-500 backdrop-blur-sm transition-all focus:border-neon-blue/50 focus:bg-albion-gray-800 focus:outline-none focus:ring-2 focus:ring-neon-blue/20"
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchResults && searchResults.length > 0 ? (
            <div className="absolute top-full mt-2 w-full rounded-xl border border-albion-gray-700 bg-albion-gray-900 shadow-2xl shadow-black/50 backdrop-blur-xl z-50">
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-semibold text-albion-gray-500 uppercase">
                  Items ({searchResults.length})
                </p>
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className="w-full px-3 py-2 text-left rounded-lg hover:bg-albion-gray-800 transition-colors group"
                  >
                    <p className="text-sm font-medium text-white group-hover:text-neon-blue transition-colors">
                      {item.name}
                    </p>
                    <p className="text-xs text-albion-gray-500">{item.id} • Tier {item.tier}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {/* Server Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-albion-gray-800/50 border border-albion-gray-700/50 backdrop-blur-sm">
          <Globe className="h-4 w-4 text-neon-blue" />
          <select
            value={selectedServer}
            onChange={(e) => setSelectedServer(e.target.value as Server)}
            className="bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer"
          >
            {servers.map((server) => (
              <option key={server.value} value={server.value}>
                {server.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-albion-gray-400 transition-all hover:bg-albion-gray-800/50 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-neon-red animate-pulse" />
        </button>
      </div>
    </header>
  );
}
