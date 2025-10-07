import { useEffect, useState } from 'react';

import { X, Swords, Trophy, Clock } from 'lucide-react';

// Fetch battle details from the safe API route to avoid server-only imports


interface BattleDetailModalProps {
  battleId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function BattleDetailModal({ battleId, isOpen, onClose }: BattleDetailModalProps) {
  const [data, setData] = useState<{ battle: any; events: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && battleId) {
      setLoading(true);
      (async () => {
        try {
          const res = await fetch(`/api/pvp/battles/${battleId}`);
          const json = await res.json();
          if (json?.success && json?.data) {
            const { events, ...battle } = json.data;
            setData({ battle, events: Array.isArray(events) ? events : [] });
          } else {
            setData(null);
          }
        } catch {
          setData(null);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isOpen, battleId]);

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-albion-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-albion-gray-700 p-6">
          <div className="flex items-center gap-3">
            <Swords className="h-6 w-6 text-neon-red" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {loading ? 'Loading...' : data?.battle?.name || `Battle #${battleId}`}
              </h2>
              <p className="text-sm text-albion-gray-400">
                {data?.battle ? new Date(data.battle.startTime).toLocaleString() : null}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-albion-gray-400 hover:bg-albion-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-red" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Battle Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-neon-red" />
                    <span className="text-sm font-medium text-albion-gray-400">Total Kills</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">
                    {data.battle?.totalKills || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-neon-green" />
                    <span className="text-sm font-medium text-albion-gray-400">Total Fame</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">
                    {(data.battle?.totalFame || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-neon-blue" />
                    <span className="text-sm font-medium text-albion-gray-400">Duration</span>
                  </div>
                  <p className="text-lg font-bold text-white mt-2">
                    {data.battle?.startTime && data.battle?.endTime
                      ? `${Math.round((new Date(data.battle.endTime).getTime() - new Date(data.battle.startTime).getTime()) / 60000)}m`
                      : 'Ongoing'
                    }
                  </p>
                </div>
              </div>

              {/* Guilds Involved */}
              {data.battle?.guilds && Object.keys(data.battle.guilds).length > 0 ? <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Guilds Involved</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(data.battle.guilds).map(([guildId, guildData]) => (
                      <div key={guildId} className="rounded-lg bg-albion-gray-800 p-4">
                        <p className="font-medium text-white">{guildData as string}</p>
                      </div>
                    ))}
                  </div>
                </div> : null}

              {/* Kill Events */}
              {data.events.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Kill Events</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {data.events.slice(0, 50).map((event) => (
                      <div key={event.EventId} className="rounded-lg bg-albion-gray-800 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {event.Killer.Name} killed {event.Victim.Name}
                            </p>
                            <p className="text-sm text-albion-gray-400">
                              {new Date(event.TimeStamp).toLocaleString()}
                              {event.Location ? ` • ${event.Location}` : null}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-neon-green">
                              Fame: {event.TotalVictimKillFame.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.events.length > 50 && (
                    <p className="text-sm text-albion-gray-500 mt-2">
                      And {data.events.length - 50} more events...
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-albion-gray-500">
              Battle data not found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
