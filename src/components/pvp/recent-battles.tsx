'use client';

/**
 * Recent Battles Component
 * Shows recent GvG, ZvZ, and large-scale battles with clickable details
 */

import { useEffect, useState } from 'react';

import { Clock, Shield, Swords, Trophy, Users } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/backend/supabase/clients';

interface BattlePlayer {
  Id: string;
  Name: string;
  GuildName?: string;
  AllianceName?: string;
  AverageItemPower?: number;
  DamageDone?: number;
  KillFame?: number;
  DeathFame?: number;
}

interface BattleEvent {
  EventId: number;
  Killer: {
    Name: string;
    GuildName?: string;
  };
  Victim: {
    Name: string;
    GuildName?: string;
  };
  TotalVictimKillFame: number;
  TimeStamp: string;
}

interface Battle {
  id: string;
  battleId: number;
  name: string | null;
  startTime: string;
  endTime: string;
  totalKills: number;
  totalFame: number;
  totalPlayers: number;
  players: {
    a?: BattlePlayer[];
    b?: BattlePlayer[];
  } | null;
  server: string;
  createdAt: string;
  events?: BattleEvent[]; // Kill events from detailed API
}

export function RecentBattles() {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'large' | 'epic'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'fame' | 'size'>('recent');

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);

        // Query via API for proper data structure
        const response = await fetch('/api/pvp/battles?limit=20');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setBattles(result.data);
        } else {
          setBattles([]);
        }
      } catch (error) {
        console.error('Failed to load battles:', error);
        setBattles([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();

    // Subscribe to real-time updates with debounce
    let reloadTimeout: NodeJS.Timeout;
    const channel = supabase
      .channel('battles_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'battles' }, () => {
        // Debounce reloads to prevent spam
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
          void loadInitialData();
        }, 2000); // Wait 2s before reloading
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // Fetch detailed battle data when a battle is selected
  async function handleBattleClick(battle: Battle) {
    setSelectedBattle(battle);

    // If battle already has events, don't fetch again
    if (battle.events) {
      return;
    }

    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/pvp/battles/${battle.battleId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Update the selected battle with detailed data
        const detailedBattle = {
          ...battle,
          // Merge any enriched fields from the detailed API
          name: result.data.name ?? battle.name,
          startTime: result.data.startTime ?? battle.startTime,
          endTime: result.data.endTime ?? battle.endTime,
          totalKills: result.data.totalKills ?? battle.totalKills,
          totalFame: result.data.totalFame ?? battle.totalFame,
          players: result.data.players ?? battle.players ?? null,
          events: result.data.events ?? [],
        };
        setSelectedBattle(detailedBattle);

        // Also update in battles list for caching
        setBattles((prev) =>
          prev.map((b) => (b.battleId === battle.battleId ? detailedBattle : b))
        );
      }
    } catch (error) {
      console.error('Failed to fetch battle details:', error);
    } finally {
      setLoadingDetails(false);
    }
  }

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-albion-gray-800" />
          <div className="h-64 rounded bg-albion-gray-800" />
        </div>
      </div>
    );
  }

  const formatDuration = (start: string, end: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes}m`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return date.toLocaleDateString();
  };

  // Filter and sort battles
  const filteredBattles = battles
    .filter((battle) => {
      if (filter === 'large') {
        const teamASize = battle.players?.a?.length ?? 0;
        const teamBSize = battle.players?.b?.length ?? 0;
        return teamASize + teamBSize >= 20;
      }
      if (filter === 'epic') {
        return battle.totalFame >= 50000;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'fame') {
        return b.totalFame - a.totalFame;
      }
      if (sortBy === 'size') {
        const aTeamASize = a.players?.a?.length ?? 0;
        const aTeamBSize = a.players?.b?.length ?? 0;
        const bTeamASize = b.players?.a?.length ?? 0;
        const bTeamBSize = b.players?.b?.length ?? 0;
        return bTeamASize + bTeamBSize - (aTeamASize + aTeamBSize);
      }
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

  // Calculate statistics
  const stats = {
    total: battles.length,
    avgPlayers:
      battles.length > 0
        ? Math.round(
            battles.reduce((sum, b) => {
              const teamASize = b.players?.a?.length ?? 0;
              const teamBSize = b.players?.b?.length ?? 0;
              return sum + teamASize + teamBSize;
            }, 0) / battles.length
          )
        : 0,
    totalFame: battles.reduce((sum, b) => sum + b.totalFame, 0),
    largestBattle: battles.reduce((max, b) => {
      const teamASize = b.players?.a?.length ?? 0;
      const teamBSize = b.players?.b?.length ?? 0;
      const totalPlayers = teamASize + teamBSize;
      return totalPlayers > max ? totalPlayers : max;
    }, 0),
  };

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">⚔️ Recent Battles</h3>
            <p className="text-sm text-albion-gray-500">
              {stats.total} battles • {stats.avgPlayers} avg players •{' '}
              {(stats.totalFame / 1000000).toFixed(1)}M fame
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-2">
          <div className="flex gap-1 rounded-lg bg-albion-gray-800 p-1">
            {(['all', 'large', 'epic'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f ? 'bg-neon-blue text-white' : 'text-albion-gray-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All Battles' : null}
                {f === 'large' ? '20+ Players' : null}
                {f === 'epic' ? '50k+ Fame' : null}
              </button>
            ))}
          </div>

          <div className="flex gap-1 rounded-lg bg-albion-gray-800 p-1">
            {(['recent', 'fame', 'size'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  sortBy === s
                    ? 'bg-neon-orange text-white'
                    : 'text-albion-gray-400 hover:text-white'
                }`}
              >
                {s === 'recent' ? '🕐 Recent' : null}
                {s === 'fame' ? '🏆 Fame' : null}
                {s === 'size' ? '👥 Size' : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Battles List */}
      <div className="space-y-3">
        {filteredBattles.map((battle) => {
          const teamASize = battle.players?.a?.length ?? 0;
          const teamBSize = battle.players?.b?.length ?? 0;
          const totalPlayers = teamASize + teamBSize;

          return (
            <div
              key={battle.id}
              onClick={() => void handleBattleClick(battle)}
              className="hover:bg-albion-gray-750 cursor-pointer rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4 transition-all hover:border-neon-blue"
            >
              <div className="flex items-start justify-between">
                {/* Battle Info */}
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-neon-blue" />
                    <h4 className="font-semibold text-white">
                      {battle.name ?? `Battle #${battle.id}`}
                    </h4>
                    <span className="text-xs text-albion-gray-500">
                      {formatTime(battle.startTime)}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-albion-gray-500">Players</p>
                      <p className="flex items-center gap-1 text-sm font-bold text-white">
                        <Users className="h-3 w-3" />
                        {totalPlayers}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-albion-gray-500">Kills</p>
                      <p className="flex items-center gap-1 text-sm font-bold text-neon-red">
                        <Swords className="h-3 w-3" />
                        {battle.totalKills}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-albion-gray-500">Fame</p>
                      <p className="text-neon-orange flex items-center gap-1 text-sm font-bold">
                        <Trophy className="h-3 w-3" />
                        {(battle.totalFame / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-albion-gray-500">Duration</p>
                      <p className="text-albion-gray-400 flex items-center gap-1 text-sm font-bold">
                        <Clock className="h-3 w-3" />
                        {formatDuration(battle.startTime, battle.endTime)}
                      </p>
                    </div>
                  </div>

                  {/* Team Sizes */}
                  {teamASize > 0 || teamBSize > 0 ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-albion-gray-500">
                      <span className="text-neon-green">{teamASize} vs</span>
                      <span className="text-neon-red">{teamBSize}</span>
                    </div>
                  ) : null}
                </div>

                {/* Click Indicator */}
                <div className="text-xs text-albion-gray-500">Click for details →</div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBattles.length === 0 ? (
        <div className="py-12 text-center text-albion-gray-500">
          {battles.length === 0
            ? 'No recent battles found'
            : 'No battles match the selected filters'}
        </div>
      ) : null}

      {/* Battle Detail Modal */}
      <Dialog open={!!selectedBattle} onOpenChange={() => setSelectedBattle(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-albion-gray-900 text-white">
          {selectedBattle ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {selectedBattle.name ?? `Battle #${selectedBattle.battleId}`}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Battle Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg bg-albion-gray-800 p-4">
                    <p className="mb-1 text-xs text-albion-gray-500">Total Players</p>
                    <p className="text-2xl font-bold text-white">
                      {(selectedBattle.players?.a?.length ?? 0) +
                        (selectedBattle.players?.b?.length ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-albion-gray-800 p-4">
                    <p className="mb-1 text-xs text-albion-gray-500">Total Kills</p>
                    <p className="text-2xl font-bold text-neon-red">{selectedBattle.totalKills}</p>
                  </div>
                  <div className="rounded-lg bg-albion-gray-800 p-4">
                    <p className="mb-1 text-xs text-albion-gray-500">Total Fame</p>
                    <p className="text-neon-orange text-2xl font-bold">
                      {(selectedBattle.totalFame / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div className="rounded-lg bg-albion-gray-800 p-4">
                    <p className="mb-1 text-xs text-albion-gray-500">Duration</p>
                    <p className="text-albion-gray-400 text-2xl font-bold">
                      {formatDuration(selectedBattle.startTime, selectedBattle.endTime)}
                    </p>
                  </div>
                </div>

                {/* Time Info */}
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-xs text-albion-gray-500">Start Time</p>
                      <p className="text-sm text-white">
                        {new Date(selectedBattle.startTime).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-albion-gray-500">End Time</p>
                      <p className="text-sm text-white">
                        {new Date(selectedBattle.endTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teams */}
                {selectedBattle.players ? (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Team A */}
                    <div className="rounded-lg border border-neon-green/50 bg-neon-green/10 p-4">
                      <h4 className="mb-3 font-semibold text-neon-green">
                        Team A ({selectedBattle.players.a?.length ?? 0} players)
                      </h4>
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {selectedBattle.players.a?.map((player, idx) => (
                          <div key={idx} className="rounded bg-albion-gray-800 p-2 text-xs">
                            <p className="font-medium text-white">{player.Name}</p>
                            {player.GuildName ? (
                              <p className="text-albion-gray-500">
                                {player.GuildName}
                                {player.AllianceName ? ` [${player.AllianceName}]` : null}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team B */}
                    <div className="rounded-lg border border-neon-red/50 bg-neon-red/10 p-4">
                      <h4 className="mb-3 font-semibold text-neon-red">
                        Team B ({selectedBattle.players.b?.length ?? 0} players)
                      </h4>
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {selectedBattle.players.b?.map((player, idx) => (
                          <div key={idx} className="rounded bg-albion-gray-800 p-2 text-xs">
                            <p className="font-medium text-white">{player.Name}</p>
                            {player.GuildName ? (
                              <p className="text-albion-gray-500">
                                {player.GuildName}
                                {player.AllianceName ? ` [${player.AllianceName}]` : null}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Kill Events */}
                {selectedBattle.events ? (
                  <div className="rounded-lg bg-albion-gray-800 p-4">
                    <h4 className="mb-3 font-semibold">Kill Events</h4>
                    {selectedBattle.events.length === 0 ? (
                      <p className="text-sm text-albion-gray-500">
                        No kill events found for this battle.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedBattle.events.map((ev, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded bg-albion-gray-900 p-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-albion-gray-500">
                                {new Date(ev.TimeStamp).toLocaleTimeString()}
                              </span>
                              <span className="font-medium text-neon-green">
                                {ev.Killer.Name}
                                {ev.Killer.GuildName ? ` (${ev.Killer.GuildName})` : ''}
                              </span>
                              <span className="text-albion-gray-500">→</span>
                              <span className="font-medium text-neon-red">
                                {ev.Victim.Name}
                                {ev.Victim.GuildName ? ` (${ev.Victim.GuildName})` : ''}
                              </span>
                            </div>
                            <div className="text-neon-orange font-bold">
                              {(ev.TotalVictimKillFame / 1000).toFixed(0)}k fame
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
