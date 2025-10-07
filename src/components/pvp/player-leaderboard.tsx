'use client';

import { useState, useEffect } from 'react';

import { Trophy, Skull, Flame, TrendingUp } from 'lucide-react';

interface PlayerStats {
  playerId: string;
  playerName: string;
  totalKills: number;
  totalDeaths: number;
  totalFame: number;
  killDeathRatio: number;
  avgFamePerKill: number;
}

type SortBy = 'kills' | 'fame' | 'kd';

export function PlayerLeaderboard() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('kills');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/pvp/players?sortBy=${sortBy}&limit=50`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setPlayers(result.data);
        }
      } catch (error) {
        console.error('[PlayerLeaderboard] Failed to load:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchLeaderboard();
  }, [sortBy]);

  const sortOptions = [
    { value: 'kills' as const, label: 'Most Kills', icon: Skull },
    { value: 'fame' as const, label: 'Most Fame', icon: Flame },
    { value: 'kd' as const, label: 'Best K/D', icon: TrendingUp },
  ];

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neon-orange/20 p-2">
            <Trophy className="h-6 w-6 text-neon-orange" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Player Leaderboard</h2>
            <p className="text-sm text-albion-gray-400">
              Top PvP performers ranked by kills and fame
            </p>
          </div>
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="mb-4 flex gap-2">
        {sortOptions.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setSortBy(value)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              sortBy === value
                ? 'bg-neon-orange text-black shadow-neon'
                : 'bg-albion-gray-850 text-albion-gray-300 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-albion-gray-800" />
          ))}
        </div> : null}

      {/* Leaderboard */}
      {!isLoading && (
        <div className="space-y-2">
          {players.map((player, index) => {
            const isTop3 = index < 3;
            const rankColor = isTop3
              ? index === 0
                ? 'text-neon-orange'
                : index === 1
                ? 'text-albion-gray-300'
                : 'text-amber-700'
              : 'text-albion-gray-500';

            return (
              <div
                key={player.playerId}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-all hover:border-neon-orange/50 ${
                  isTop3
                    ? 'border-neon-orange/30 bg-gradient-to-r from-neon-orange/10 to-transparent'
                    : 'border-albion-gray-800 bg-albion-gray-900/50'
                }`}
              >
                {/* Rank */}
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isTop3 ? 'bg-neon-orange/20' : 'bg-albion-gray-800'
                }`}>
                  <span className={`text-lg font-bold ${rankColor}`}>
                    {index + 1}
                  </span>
                </div>

                {/* Player Name */}
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{player.playerName}</h3>
                  <p className="text-xs text-albion-gray-500">
                    K/D: {player.killDeathRatio.toFixed(2)}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p className="text-xs text-albion-gray-500">Kills</p>
                    <p className="font-semibold text-neon-red">{player.totalKills.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-albion-gray-500">Fame</p>
                    <p className="font-semibold text-neon-orange">
                      {(player.totalFame / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-albion-gray-500">Avg Fame</p>
                    <p className="font-semibold text-albion-gray-300">
                      {player.avgFamePerKill.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && players.length === 0 && (
        <div className="py-12 text-center text-albion-gray-500">
          <Trophy className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No player data available</p>
        </div>
      )}
    </div>
  );
}
