import { useEffect, useState } from 'react';

import { Skull, TrendingUp, Trophy, User, X } from 'lucide-react';

// Fetch player details through the client-safe PvP API route
// Avoid importing server-only services that rely on Redis in the browser

interface PlayerDetailModalProps {
  playerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerDetailModal({ playerId, isOpen, onClose }: PlayerDetailModalProps) {
  const [data, setData] = useState<{
    player: {
      Name?: string;
      GuildName?: string;
      KillFame?: number;
      DeathFame?: number;
      FameRatio?: number;
    } | null;
    recentKills: Array<{
      EventId: number;
      Victim: { Name: string; GuildName?: string };
      TimeStamp: string;
      TotalVictimKillFame: number;
    }>;
    recentDeaths: Array<{
      EventId: number;
      Killer: { Name: string; GuildName?: string };
      TimeStamp: string;
      TotalVictimKillFame: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        setLoading(true);
        const response = await fetch(`/api/pvp/player/${playerId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error ?? 'Failed to fetch player');
        }
        setData({
          player: result.data.player ?? null,
          recentKills: result.data.kills ?? [],
          recentDeaths: result.data.deaths ?? [],
        });
      } catch (error) {
        console.error('Failed to fetch player details:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen && playerId) {
      void fetchPlayer();
    }
  }, [isOpen, playerId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-albion-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-albion-gray-700 p-6">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-neon-blue" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {loading ? 'Loading...' : (data?.player?.Name ?? 'Player Details')}
              </h2>
              <p className="text-albion-gray-400 text-sm">
                {data?.player?.GuildName ? `Guild: ${data.player.GuildName}` : null}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-albion-gray-400 rounded-full p-2 hover:bg-albion-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neon-blue" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Player Stats */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-neon-green" />
                    <span className="text-albion-gray-400 text-sm font-medium">Kill Fame</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {(data.player?.KillFame ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Skull className="h-5 w-5 text-neon-red" />
                    <span className="text-albion-gray-400 text-sm font-medium">Death Fame</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {(data.player?.DeathFame ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-neon-blue" />
                    <span className="text-albion-gray-400 text-sm font-medium">Fame Ratio</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {data.player?.FameRatio?.toFixed(2) ?? 'N/A'}
                  </p>
                </div>
              </div>

              {/* Recent Kills */}
              {data.recentKills.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">Recent Kills</h3>
                  <div className="space-y-2">
                    {data.recentKills.slice(0, 10).map((kill) => (
                      <div key={kill.EventId} className="rounded-lg bg-albion-gray-800 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              Killed {kill.Victim.Name}
                              {kill.Victim.GuildName ? ` (${kill.Victim.GuildName})` : null}
                            </p>
                            <p className="text-albion-gray-400 text-sm">
                              {new Date(kill.TimeStamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-neon-green">
                              Fame: {kill.TotalVictimKillFame.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Deaths */}
              {data.recentDeaths.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">Recent Deaths</h3>
                  <div className="space-y-2">
                    {data.recentDeaths.slice(0, 10).map((death) => (
                      <div key={death.EventId} className="rounded-lg bg-albion-gray-800 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              Killed by {death.Killer.Name}
                              {death.Killer.GuildName ? ` (${death.Killer.GuildName})` : null}
                            </p>
                            <p className="text-albion-gray-400 text-sm">
                              {new Date(death.TimeStamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-neon-red">
                              Fame: {death.TotalVictimKillFame.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-albion-gray-500">Player data not found</div>
          )}
        </div>
      </div>
    </div>
  );
}
