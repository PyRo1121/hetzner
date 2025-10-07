'use client';

import { useEffect, useState } from 'react';

import { Clock, MapPin, RefreshCw, Shield, Swords } from 'lucide-react';

import { FightDetailModal } from '@/components/pvp/modals/FightDetailModal';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { type KillEvent } from '@/lib/api/gameinfo/client';

interface KillFeedProps {
  guildId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function KillFeed({ guildId, autoRefresh = true, refreshInterval = 30000 }: KillFeedProps) {
  const [kills, setKills] = useState<KillEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedKill, setSelectedKill] = useState<KillEvent | null>(null);

  const loadKills = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      params.set('limit', '51');
      params.set('offset', '0');
      if (guildId) {
        params.set('guildId', guildId);
      }

      const res = await fetch(`/api/pvp/kills?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const payload = await res.json();
      const data: KillEvent[] = payload?.data ?? [];
      const filtered = guildId
        ? data.filter((k) => k.Killer.GuildId === guildId || k.Victim.GuildId === guildId)
        : data;
      setKills(filtered);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to load kill feed');
      console.error('Kill feed error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadKills();
  }, [guildId]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      void loadKills();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, guildId]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return date.toLocaleDateString();
  };

  const formatZoneName = (location: string) => {
    if (!location || location === 'Unknown') {
      return location;
    }

    // Remove @number suffix (e.g., "Caerleon@1234" -> "Caerleon")
    let zone = location.replace(/@\d+$/, '');

    // Replace underscores with spaces and capitalize
    zone = zone.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

    // Handle specific zone patterns
    if (zone.includes('Randomdungeon')) {
      return 'Random Dungeon';
    } else if (zone.includes('Hellgate')) {
      return 'Hellgate';
    } else if (zone.includes('Mists')) {
      return 'Mists';
    } else if (zone.includes('Roads')) {
      return 'Roads of Avalon';
    }

    return zone;
  };

  const getKillType = (kill: KillEvent) => {
    const killerGuild = kill.Killer.GuildId;
    const victimGuild = kill.Victim.GuildId;

    if (!killerGuild || !victimGuild) {
      return 'solo';
    }
    if (killerGuild === victimGuild) {
      return 'internal';
    }
    return 'guild';
  };

  const getKillColor = (kill: KillEvent) => {
    const type = getKillType(kill);
    switch (type) {
      case 'guild':
        return 'border-neon-red';
      case 'internal':
        return 'border-neon-orange';
      default:
        return 'border-albion-gray-600';
    }
  };

  if (loading && kills.length === 0) {
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
        <div className="py-8 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => {
              void loadKills();
            }}
            className="mt-4 rounded-lg bg-neon-blue px-4 py-2 text-white transition-colors hover:bg-neon-blue/80"
          >
            Try Again
          </button>
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
            <h3 className="text-xl font-bold">Live Kill Feed</h3>
            <p className="text-sm text-albion-gray-500">
              {guildId ? 'Guild activity' : 'Global PvP events'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-albion-gray-500">
            <Clock className="h-4 w-4" />
            <span>Updated {formatTime(lastRefresh.toISOString())}</span>
          </div>
          <button
            onClick={() => {
              void loadKills();
            }}
            className="text-albion-gray-400 flex items-center gap-2 rounded-lg bg-albion-gray-800 px-3 py-1.5 text-sm transition-colors hover:bg-albion-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Kill Feed */}
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {kills.map((kill) => (
          <div
            key={`${kill.EventId}-${kill.TimeStamp}`}
            className={`rounded-lg border-l-4 bg-albion-gray-800/50 p-4 transition-colors hover:bg-albion-gray-800 ${getKillColor(kill)} cursor-pointer`}
            onClick={() => setSelectedKill(kill)}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-neon-green">{kill.Killer.Name}</span>
                {kill.Killer.GuildName ? (
                  <span className="text-albion-gray-400 text-sm">[{kill.Killer.GuildName}]</span>
                ) : null}
                <span className="text-neon-red">killed</span>
                <span className="text-lg font-bold text-neon-red">{kill.Victim.Name}</span>
                {kill.Victim.GuildName ? (
                  <span className="text-albion-gray-400 text-sm">[{kill.Victim.GuildName}]</span>
                ) : null}
              </div>

              <div className="flex items-center gap-2 text-right">
                <div className="text-sm text-albion-gray-500">{formatTime(kill.TimeStamp)}</div>
                <div className="text-neon-orange font-bold">
                  {kill.TotalVictimKillFame.toLocaleString()} fame
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {kill.Location ? (
                  <div className="flex items-center gap-1 text-albion-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{formatZoneName(kill.Location)}</span>
                  </div>
                ) : null}
                {kill.Killer.AverageItemPower ? (
                  <div className="flex items-center gap-1 text-albion-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>{Math.round(kill.Killer.AverageItemPower)} IP</span>
                  </div>
                ) : null}
                {kill.Victim.AverageItemPower ? (
                  <div className="flex items-center gap-1 text-albion-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>{Math.round(kill.Victim.AverageItemPower)} IP</span>
                  </div>
                ) : null}
              </div>

              <div className="text-xs text-albion-gray-600">
                Event #{kill.EventId}
                {kill.BattleId ? ` • Battle #${kill.BattleId}` : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for fight details */}
      <Dialog open={!!selectedKill} onOpenChange={() => setSelectedKill(null)}>
        <DialogContent className="border-neon-orange/30 bg-albion-gray-950/95 !mx-auto max-h-[95vh] w-[95vw] !max-w-7xl overflow-hidden border text-white backdrop-blur sm:rounded-lg">
          {selectedKill ? (
            <div className="h-full overflow-y-auto pr-2">
              <FightDetailModal fight={selectedKill} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {kills.length === 0 && (
        <div className="py-12 text-center text-albion-gray-500">No recent kills found</div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-albion-gray-500">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-neon-red" />
          <span>Guild vs Guild</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="border-neon-orange h-3 w-3 rounded-full border-2" />
          <span>Internal Kill</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border-2 border-albion-gray-600" />
          <span>Solo Kill</span>
        </div>
      </div>
    </div>
  );
}
