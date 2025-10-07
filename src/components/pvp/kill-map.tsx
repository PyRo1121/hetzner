'use client';

/**
 * Interactive Kill Map Component
 * Shows kill hotspots and zone danger ratings
 */

import { useEffect, useState } from 'react';

import { AlertTriangle, MapPin, Skull, TrendingUp } from 'lucide-react';

import { supabase } from '@/backend/supabase/clients';

interface ZoneStats {
  zone: string;
  zoneId: string; // Original zone ID
  kills: number;
  avgFame: number;
  dangerRating: number; // 0-100
  trend: 'rising' | 'falling' | 'stable';
}

// Zone categories for future map feature
// const ZONE_CATEGORIES = {
//   'Blue': ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'],
//   'Yellow': ['Yellow Zone 1', 'Yellow Zone 2'],
//   'Red': ['Red Zone 1', 'Red Zone 2', 'Red Zone 3'],
//   'Black': ['Black Zone 1', 'Black Zone 2', 'Black Zone 3', 'Black Zone 4'],
//   'Roads': ['Roads of Avalon'],
// };

export function KillMap() {
  const [zoneStats, setZoneStats] = useState<ZoneStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);

        // Query via API for proper data structure
        const response = await fetch('/api/pvp/kills?limit=50&offset=0');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          console.error('[KillMap] Invalid API response:', result);
          setZoneStats([]);
          return;
        }

        const kills = result.data;

        // Aggregate kills by zone with proper zone name parsing
        const zoneMap = new Map<string, { kills: number; totalFame: number }>();

        for (const kill of kills) {
          // Parse zone name from Location field
          let zone = kill.Location ?? 'Unknown';

          // Handle common zone ID patterns and convert to readable names
          if (zone && zone !== 'Unknown') {
            // Remove @number suffix (e.g., "Caerleon@1234" -> "Caerleon")
            zone = zone.replace(/@\d+$/, '');

            // Replace underscores with spaces and capitalize
            zone = zone.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());

            // Handle specific zone patterns
            if (zone.includes('Randomdungeon')) {
              zone = 'Random Dungeon';
            } else if (zone.includes('Hellgate')) {
              zone = 'Hellgate';
            } else if (zone.includes('Mists')) {
              zone = 'Mists';
            } else if (zone.includes('Roads')) {
              zone = 'Roads of Avalon';
            }
          }

          const existing = zoneMap.get(zone) ?? { kills: 0, totalFame: 0 };
          zoneMap.set(zone, {
            kills: existing.kills + 1,
            totalFame: existing.totalFame + (kill.TotalVictimKillFame ?? 0),
          });
        }

        // Convert to array and sort
        const maxKills = Math.max(...zoneMap.values().map((z) => z.kills));
        const stats: ZoneStats[] = Array.from(zoneMap.entries()).map(([zone, data]) => ({
          zone,
          zoneId: zone,
          kills: data.kills,
          avgFame: data.kills > 0 ? Math.round(data.totalFame / data.kills) : 0,
          dangerRating: Math.min(100, (data.kills / kills.length) * 100),
          intensity: maxKills > 0 ? (data.kills / maxKills) * 100 : 0,
          trend: data.kills > 5 ? 'rising' : data.kills < 2 ? 'falling' : 'stable',
        }));

        stats.sort((a, b) => b.kills - a.kills);

        setZoneStats(stats);
      } catch (error) {
        console.error('Failed to load kill map data:', error);
        setZoneStats([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();

    // Subscribe to real-time updates with debounce
    let reloadTimeout: NodeJS.Timeout;
    const channel = supabase
      .channel('kill_map_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kill_events' }, () => {
        // Debounce reloads to prevent spam
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
          void loadInitialData();
        }, 5000); // Wait 5s before reloading map
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-albion-gray-800" />
          <div className="h-96 rounded bg-albion-gray-800" />
        </div>
      </div>
    );
  }

  const selectedZoneData = selectedZone ? zoneStats.find((z) => z.zone === selectedZone) : null;

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-neon-red" />
          <div>
            <h3 className="text-xl font-bold">Kill Map</h3>
            <p className="text-sm text-albion-gray-500">Hotspots and danger ratings by zone</p>
          </div>
        </div>

        {/* Time Range */}
        <div className="flex gap-2">
          {(['1h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-neon-red text-white'
                  : 'text-albion-gray-400 bg-albion-gray-800 hover:bg-albion-gray-700'
              }`}
            >
              {range === '1h' ? 'Last Hour' : range === '24h' ? 'Last 24h' : 'Last 7 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Zone List */}
        <div className="space-y-2">
          <h4 className="text-albion-gray-400 mb-3 text-sm font-semibold">Danger Zones (Top 20)</h4>

          {zoneStats.slice(0, 20).map((zone) => {
            const isSelected = selectedZone === zone.zone;

            return (
              <button
                key={zone.zone}
                onClick={() => setSelectedZone(isSelected ? null : zone.zone)}
                className={`w-full rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-neon-red bg-neon-red/10'
                    : 'border-albion-gray-700 bg-albion-gray-800 hover:border-albion-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle
                        className="h-4 w-4"
                        style={{
                          color:
                            zone.dangerRating >= 75
                              ? '#ff0080'
                              : zone.dangerRating >= 50
                                ? '#ffaa00'
                                : zone.dangerRating >= 25
                                  ? '#00d4ff'
                                  : '#666',
                        }}
                      />
                      <span className="font-medium text-white">{zone.zone}</span>
                    </div>

                    {/* Danger Bar */}
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-albion-gray-900">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${zone.dangerRating}%`,
                          backgroundColor:
                            zone.dangerRating >= 75
                              ? '#ff0080'
                              : zone.dangerRating >= 50
                                ? '#ffaa00'
                                : zone.dangerRating >= 25
                                  ? '#00d4ff'
                                  : '#666',
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-albion-gray-500">
                      <span>{zone.kills} kills</span>
                      <span>{Math.round(zone.avgFame).toLocaleString()} avg fame</span>
                    </div>
                  </div>

                  {/* Danger Rating Badge */}
                  <div className="ml-4 text-center">
                    <p
                      className="text-2xl font-bold"
                      style={{
                        color:
                          zone.dangerRating >= 75
                            ? '#ff0080'
                            : zone.dangerRating >= 50
                              ? '#ffaa00'
                              : zone.dangerRating >= 25
                                ? '#00d4ff'
                                : '#666',
                      }}
                    >
                      {zone.dangerRating}
                    </p>
                    <p className="text-xs text-albion-gray-500">danger</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Zone Details */}
        <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-6">
          {selectedZoneData ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-white">{selectedZoneData.zone}</h4>
                  <p className="text-sm text-albion-gray-500">Zone Details</p>
                </div>
                <div className="text-right">
                  <p
                    className="text-4xl font-bold"
                    style={{
                      color:
                        selectedZoneData.dangerRating >= 75
                          ? '#ff0080'
                          : selectedZoneData.dangerRating >= 50
                            ? '#ffaa00'
                            : selectedZoneData.dangerRating >= 25
                              ? '#00d4ff'
                              : '#666',
                    }}
                  >
                    {selectedZoneData.dangerRating}
                  </p>
                  <p className="text-sm text-albion-gray-500">Danger Rating</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="space-y-4">
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
                    <Skull className="h-4 w-4" />
                    <span className="text-sm">Total Kills</span>
                  </div>
                  <p className="text-3xl font-bold text-neon-red">{selectedZoneData.kills}</p>
                </div>

                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Average Fame</span>
                  </div>
                  <p className="text-neon-orange text-3xl font-bold">
                    {Math.round(selectedZoneData.avgFame).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Risk Level</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {selectedZoneData.dangerRating >= 75
                      ? '🔴 Extreme'
                      : selectedZoneData.dangerRating >= 50
                        ? '🟠 High'
                        : selectedZoneData.dangerRating >= 25
                          ? '🟡 Medium'
                          : '🟢 Low'}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-6 rounded-lg border border-neon-blue/50 bg-neon-blue/10 p-4">
                <p className="text-sm font-medium text-neon-blue">💡 Recommendation</p>
                <p className="text-albion-gray-400 mt-2 text-xs">
                  {selectedZoneData.dangerRating >= 75
                    ? 'Extreme danger! Travel in large groups and avoid if possible.'
                    : selectedZoneData.dangerRating >= 50
                      ? 'High risk area. Bring backup and stay alert.'
                      : selectedZoneData.dangerRating >= 25
                        ? 'Moderate risk. Exercise caution when traveling.'
                        : 'Relatively safe area. Standard precautions apply.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <MapPin className="mx-auto mb-4 h-16 w-16 text-albion-gray-700" />
                <p className="text-albion-gray-500">Select a zone to view detailed statistics</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-albion-gray-500">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-neon-red" />
          <span>Extreme (75+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-neon-orange h-3 w-3 rounded-full" />
          <span>High (50-74)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-neon-blue" />
          <span>Medium (25-49)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-600" />
          <span>Low (0-24)</span>
        </div>
      </div>
    </div>
  );
}
