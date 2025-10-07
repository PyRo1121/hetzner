'use client';

import { useEffect, useState } from 'react';

import { Swords, Users, Trophy, Clock } from 'lucide-react';

import { type Battle, gameinfoClient } from '@/lib/api/gameinfo/client';

interface BattleFeedProps {
  range?: 'day' | 'week' | 'month';
  onBattleSelect?: (battleId: number) => void;
}

export function BattleFeed({ range = 'day', onBattleSelect }: BattleFeedProps) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBattles = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await gameinfoClient.getRecentBattles(range, 20, 0);
        setBattles(data);
      } catch (err) {
        setError('Failed to load battles');
        console.error('Battle feed error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBattles();
  }, [range]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {return 'Just now';}
    if (diffMins < 60) {return `${diffMins}m ago`;}
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {return `${diffHours}h ago`;}
    return date.toLocaleDateString();
  };

  const getGuildNames = (guilds: Record<string, any> | undefined) => {
    if (!guilds) {return [];}
    return Object.values(guilds).slice(0, 3) as string[];
  };

  if (loading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-albion-gray-800" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded bg-albion-gray-800" />
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
          <Swords className="h-6 w-6 text-neon-red" />
          <div>
            <h3 className="text-xl font-bold">Recent Battles</h3>
            <p className="text-sm text-albion-gray-500">
              Last {range} of PvP conflicts
            </p>
          </div>
        </div>
      </div>

      {/* Battle List */}
      <div className="space-y-3">
        {battles.map((battle) => (
          <button
            key={battle.id}
            onClick={() => onBattleSelect?.(battle.id)}
            className="w-full text-left p-4 bg-albion-gray-800 rounded-lg hover:bg-albion-gray-700 transition-colors border border-albion-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">
                  {battle.name || `Battle #${battle.id}`}
                </span>
                <span className="text-sm text-albion-gray-500">
                  {formatTime(battle.startTime)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div className="flex items-center gap-1">
                  <Swords className="h-4 w-4 text-neon-red" />
                  <span className="font-bold text-neon-red">{battle.totalKills}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-neon-green" />
                  <span className="font-bold text-neon-green">
                    {battle.totalFame.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-albion-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>
                    {battle.startTime && battle.endTime
                      ? `${Math.round((new Date(battle.endTime).getTime() - new Date(battle.startTime).getTime()) / 60000)}m`
                      : 'Ongoing'
                    }
                  </span>
                </div>
                {battle.players ? <div className="flex items-center gap-1 text-albion-gray-500">
                    <Users className="h-4 w-4" />
                    <span>
                      {battle.players.a?.length || 0} vs {battle.players.b?.length || 0}
                    </span>
                  </div> : null}
              </div>

              <div className="flex flex-wrap gap-1 justify-end">
                {getGuildNames(battle.guilds).map((guildName, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-albion-gray-700 text-xs text-albion-gray-300 rounded"
                  >
                    {guildName}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {battles.length === 0 && (
        <div className="text-center py-12 text-albion-gray-500">
          No battles found for this time period
        </div>
      )}
    </div>
  );
}
