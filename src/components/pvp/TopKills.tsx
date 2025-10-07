'use client';

import { useEffect, useState } from 'react';

import { Sword } from 'lucide-react';

import { gameinfoClient, type KillFameLeaderboardEntry } from '@/lib/api/gameinfo/client';

interface TopKillsProps {
  range?: 'day' | 'week' | 'month';
}

export function TopKills({ range = 'week' }: TopKillsProps) {
  const [kills, setKills] = useState<KillFameLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadKills = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await gameinfoClient.getKillFameLeaderboard({ range, limit: 50, offset: 0 });
        setKills(data);
      } catch (err) {
        setError('Failed to load top kills');
        console.error('Top kills error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadKills();
  }, [range]);

  const formatFame = (fame: number) => {
    if (fame >= 1000000) {return `${(fame / 1000000).toFixed(1)}M`;}
    if (fame >= 1000) {return `${(fame / 1000).toFixed(1)}K`;}
    return fame.toLocaleString();
  };

  const getKillQuality = (fame: number) => {
    if (fame >= 100000) {return 'legendary';}
    if (fame >= 50000) {return 'epic';}
    if (fame >= 25000) {return 'rare';}
    if (fame >= 10000) {return 'uncommon';}
    return 'common';
  };

  if (loading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-albion-gray-800" />
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 rounded bg-albion-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-float">
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sword className="h-6 w-6 text-neon-red" />
          <div>
            <h3 className="text-xl font-bold">Top Kills by Fame</h3>
            <p className="text-sm text-albion-gray-500">
              Highest fame PvP kills in the last {range}
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {kills.map((entry, index) => {
          const fame = entry.killFame ?? 0;
          const quality = getKillQuality(fame);

          return (
            <div
              key={`${entry.playerId ?? entry.player ?? index}`}
              className="w-full p-4 bg-albion-gray-800/50 rounded-lg border border-albion-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    quality === 'legendary' ? 'bg-neon-gold text-black' :
                    quality === 'epic' ? 'bg-purple-500 text-white' :
                    quality === 'rare' ? 'bg-blue-500 text-white' :
                    quality === 'uncommon' ? 'bg-green-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {index + 1}
                  </div>

                  <div>
                    <div className="font-bold text-white">
                      {entry.player ?? 'Unknown Player'}
                    </div>
                    <div className="text-sm text-albion-gray-400">
                      {entry.guild ? `[${entry.guild}]` : null}
                      {entry.guild && entry.alliance ? ' · ' : null}
                      {entry.alliance ? `[${entry.alliance}]` : null}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-neon-gold">
                    {formatFame(fame)}
                  </div>
                  <div className="text-sm text-albion-gray-500">
                    {entry.kills ?? 0} kills
                  </div>
                </div>
              </div>

              <div className={`px-2 py-1 rounded text-xs font-medium ${
                quality === 'legendary' ? 'bg-neon-gold/20 text-neon-gold' :
                quality === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                quality === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                quality === 'uncommon' ? 'bg-green-500/20 text-green-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {quality.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {kills.length === 0 && (
        <div className="text-center py-12 text-albion-gray-500">
          <Sword className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No kills found for this time period</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-albion-gray-500">
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-neon-gold" /><span>Legendary (100K+)</span></div>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-purple-500" /><span>Epic (50K+)</span></div>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500" /><span>Rare (25K+)</span></div>
      </div>
    </div>
  );
}
