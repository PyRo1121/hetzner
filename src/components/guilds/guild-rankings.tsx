'use client';

import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Crown } from 'lucide-react';

import { getTopGuilds, type Guild } from '@/lib/api/gameinfo/guilds';

export function GuildRankings() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'killFame' | 'members' | 'attacks'>('killFame');

  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    setIsLoading(true);
    try {
      const topGuilds = await getTopGuilds(50);
      setGuilds(topGuilds);
    } catch (error) {
      console.error('Failed to load guild rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedGuilds = [...guilds].sort((a, b) => {
    switch (sortBy) {
      case 'killFame':
        return (b.killFame || 0) - (a.killFame || 0);
      case 'members':
        return (b.MemberCount || 0) - (a.MemberCount || 0);
      case 'attacks':
        return (b.AttacksWon || 0) - (a.AttacksWon || 0);
      default:
        return 0;
    }
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-neon-gold" />
            <div>
              <h2 className="text-2xl font-bold text-white">Guild Rankings</h2>
              <p className="text-sm text-albion-gray-500">
                Top guilds by performance metrics
              </p>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 rounded-lg bg-albion-gray-800 p-1">
            <button
              onClick={() => setSortBy('killFame')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                sortBy === 'killFame'
                  ? 'bg-neon-blue text-white'
                  : 'text-albion-gray-400 hover:text-white'
              }`}
            >
              Kill Fame
            </button>
            <button
              onClick={() => setSortBy('members')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                sortBy === 'members'
                  ? 'bg-neon-blue text-white'
                  : 'text-albion-gray-400 hover:text-white'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setSortBy('attacks')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                sortBy === 'attacks'
                  ? 'bg-neon-blue text-white'
                  : 'text-albion-gray-400 hover:text-white'
              }`}
            >
              Attacks Won
            </button>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      <div className="panel-float">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-albion-gray-800" />
            ))}
          </div>
        ) : sortedGuilds.length === 0 ? (
          <div className="py-12 text-center">
            <Trophy className="mx-auto mb-4 h-16 w-16 text-albion-gray-700" />
            <h3 className="mb-2 text-lg font-semibold text-white">No Rankings Available</h3>
            <p className="text-sm text-albion-gray-500">
              Unable to load guild rankings at this time
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedGuilds.map((guild, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;

              return (
                <motion.div
                  key={guild.Id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center justify-between rounded-lg p-4 transition-all ${
                    isTopThree
                      ? 'bg-gradient-to-r from-albion-gray-800 to-albion-gray-800/50 border border-albion-gray-700'
                      : 'bg-albion-gray-800 hover:bg-albion-gray-700'
                  }`}
                >
                  {/* Rank & Guild Name */}
                  <div className="flex items-center gap-4">
                    {isTopThree ? (
                      <Crown className={`h-6 w-6 ${getMedalColor(rank)}`} />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-albion-gray-900 text-sm font-bold text-albion-gray-500">
                        #{rank}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{guild.Name}</span>
                        {rank === 1 && (
                          <span className="rounded-full bg-neon-gold/20 px-2 py-0.5 text-xs font-bold text-neon-gold">
                            #1
                          </span>
                        )}
                      </div>
                      {guild.AllianceName ? <div className="text-xs text-albion-gray-500">
                          [{guild.AllianceTag}] {guild.AllianceName}
                        </div> : null}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-8 text-sm">
                    <div className="text-center">
                      <div className="mb-1 text-xs text-albion-gray-500">Kill Fame</div>
                      <div className="font-bold text-neon-gold">
                        {guild.killFame
                          ? `${(guild.killFame / 1000000).toFixed(1)}M`
                          : '0'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="mb-1 text-xs text-albion-gray-500">Members</div>
                      <div className="font-bold text-neon-green">
                        {guild.MemberCount?.toLocaleString() || 0}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="mb-1 text-xs text-albion-gray-500">Attacks Won</div>
                      <div className="font-bold text-neon-blue">
                        {guild.AttacksWon?.toLocaleString() || 0}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="mb-1 text-xs text-albion-gray-500">Defenses Won</div>
                      <div className="font-bold text-white">
                        {guild.DefensesWon?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>

                  {/* Trend Indicator */}
                  {rank <= 10 && (
                    <div className="flex items-center gap-1 text-neon-green">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="panel-float">
        <div className="flex items-center gap-2 text-sm text-albion-gray-500">
          <Trophy className="h-4 w-4" />
          <span>
            Rankings are based on guild performance metrics from recent battles and events.
          </span>
        </div>
      </div>
    </div>
  );
}
