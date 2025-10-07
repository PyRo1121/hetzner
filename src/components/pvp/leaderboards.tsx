'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import { Trophy, Swords, Users, TrendingUp, Crown } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  guildName?: string;
  killFame: number;
  deathFame: number;
  kills: number;
  deaths: number;
  kd: number;
}

interface LeaderboardsProps {
  playerLeaderboard?: LeaderboardEntry[];
  guildLeaderboard?: LeaderboardEntry[];
  isLoading?: boolean;
}

export function Leaderboards({
  playerLeaderboard = [],
  guildLeaderboard = [],
  isLoading = false,
}: LeaderboardsProps) {
  const [selectedTab, setSelectedTab] = useState<'players' | 'guilds'>('players');
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const currentLeaderboard = selectedTab === 'players' ? playerLeaderboard : guildLeaderboard;

  // Get medal color based on rank
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-neon-gold';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-orange-600';
      default:
        return 'text-albion-gray-500';
    }
  };

  // Get rank badge
  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return (
        <Crown className={`h-6 w-6 ${getMedalColor(rank)}`} />
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-albion-gray-900 text-sm font-bold text-albion-gray-500">
        #{rank}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-neon-gold" />
            <div>
              <h2 className="text-2xl font-bold text-white">Leaderboards</h2>
              <p className="text-sm text-albion-gray-500">
                Top performers by kill fame
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 rounded-lg bg-albion-gray-800 p-1">
            <button
              onClick={() => setTimeRange('week')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === 'week'
                  ? 'bg-neon-blue text-white'
                  : 'text-albion-gray-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === 'month'
                  ? 'bg-neon-blue text-white'
                  : 'text-albion-gray-400 hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-float">
        <div className="flex gap-2 border-b border-albion-gray-700">
          <button
            onClick={() => setSelectedTab('players')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'players'
                ? 'border-b-2 border-neon-blue text-neon-blue'
                : 'text-albion-gray-500 hover:text-white'
            }`}
          >
            <Swords className="h-4 w-4" />
            Top Players
          </button>
          <button
            onClick={() => setSelectedTab('guilds')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'guilds'
                ? 'border-b-2 border-neon-blue text-neon-blue'
                : 'text-albion-gray-500 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Top Guilds
          </button>
        </div>

        {/* Leaderboard Content */}
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-albion-gray-800"
                />
              ))}
            </div>
          ) : currentLeaderboard.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-albion-gray-700" />
              <h3 className="mb-2 text-lg font-semibold text-white">No data available</h3>
              <p className="text-sm text-albion-gray-500">
                Leaderboard data will appear here
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {currentLeaderboard.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between rounded-lg p-4 transition-all ${
                    entry.rank <= 3
                      ? 'bg-gradient-to-r from-albion-gray-800 to-albion-gray-800/50 border border-albion-gray-700'
                      : 'bg-albion-gray-800 hover:bg-albion-gray-700'
                  }`}
                >
                  {/* Rank & Name */}
                  <div className="flex items-center gap-4">
                    {getRankBadge(entry.rank)}
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{entry.name}</span>
                        {entry.rank === 1 ? <span className="rounded-full bg-neon-gold/20 px-2 py-0.5 text-xs font-bold text-neon-gold">
                            #1
                          </span> : null}
                      </div>
                      {entry.guildName ? <div className="text-xs text-albion-gray-500">{entry.guildName}</div> : null}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-8 text-sm">
                    <div className="text-center">
                      <div className="mb-1 text-xs text-albion-gray-500">Kill Fame</div>
                      <div className="font-bold text-neon-gold">
                        {entry.killFame >= 1000000
                          ? `${(entry.killFame / 1000000).toFixed(1)}M`
                          : `${(entry.killFame / 1000).toFixed(0)}K`}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="mb-1 text-xs text-albion-gray-500">Kills</div>
                      <div className="font-bold text-neon-green">{entry.kills.toLocaleString()}</div>
                    </div>

                    <div className="text-center">
                      <div className="mb-1 text-xs text-albion-gray-500">Deaths</div>
                      <div className="font-bold text-red-500">{entry.deaths.toLocaleString()}</div>
                    </div>

                    <div className="text-center">
                      <div className="mb-1 text-xs text-albion-gray-500">K/D Ratio</div>
                      <div className="font-bold text-white">{entry.kd.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Trend Indicator */}
                  {entry.rank <= 10 ? <div className="flex items-center gap-1 text-neon-green">
                      <TrendingUp className="h-4 w-4" />
                    </div> : null}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="panel-float">
        <div className="flex items-center gap-2 text-sm text-albion-gray-500">
          <Trophy className="h-4 w-4" />
          <span>
            Rankings are updated every hour based on kill fame earned in PvP combat.
          </span>
        </div>
      </div>
    </div>
  );
}
