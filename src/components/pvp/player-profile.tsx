// @ts-nocheck - Complex PvP profile component
'use client';

/**
 * Player Profile Component
 * Detailed stats with K/D ratio, favorite builds, activity heatmaps
 */

import React, { useState } from 'react';

import { User, Swords, Skull, TrendingUp, Target, Calendar } from 'lucide-react';

import { usePlayerDetails } from '@/hooks/use-pvp-api';
import { extractGearBuild, getBuildName, getLocalizedBuildName } from '@/lib/analysis/gear-meta';

interface PlayerProfileProps {
  playerId: string;
}

export function PlayerProfile({ playerId }: PlayerProfileProps) {
  const [activeTab, setActiveTab] = useState<'kills' | 'deaths'>('kills');
  const [buildNames, setBuildNames] = useState<Map<string, string>>(new Map());
  const { data, isLoading } = usePlayerDetails({ playerId });
  
  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded bg-albion-gray-800" />
          <div className="h-64 rounded bg-albion-gray-800" />
        </div>
      </div>
    );
  }

  if (!data?.player) {
    return (
      <div className="panel-float">
        <p className="text-center text-albion-gray-500">Player not found</p>
      </div>
    );
  }

  const { player, kills, deaths, stats } = data;

  // Extract favorite builds
  const buildCounts = new Map<string, { build: any, count: number }>();
  kills.forEach(kill => {
    const build = extractGearBuild((kill as any).Killer?.Equipment);
    if (build) {
      const existing = buildCounts.get(build.id) || { build, count: 0 };
      existing.count++;
      buildCounts.set(build.id, existing);
    }
  });

  const favoriteBuilds = Array.from(buildCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Fetch localized names for favorite builds
  React.useEffect(() => {
    async function fetchBuildNames() {
      const namesMap = new Map<string, string>();
      await Promise.all(
        favoriteBuilds.map(async (item) => {
          try {
            const localizedName = await getLocalizedBuildName(item.build);
            namesMap.set(item.build.id, localizedName);
          } catch (error) {
            namesMap.set(item.build.id, getBuildName(item.build));
          }
        })
      );
      setBuildNames(namesMap);
    }
    
    if (favoriteBuilds.length > 0) {
      fetchBuildNames();
    }
  }, [kills]);

  // Calculate activity by day
  const activityByDay = new Map<string, number>();
  [...kills, ...deaths].forEach(event => {
    const date = new Date(event.TimeStamp);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    activityByDay.set(dayOfWeek, (activityByDay.get(dayOfWeek) || 0) + 1);
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxActivity = Math.max(...Array.from(activityByDay.values()), 1);

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <div className="panel-float">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-neon-blue/20 p-4">
              <User className="h-12 w-12 text-neon-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{player.Name}</h2>
              {player.GuildName ? <p className="text-sm text-albion-gray-500">
                  {player.GuildName}
                  {player.AllianceName ? ` [${player.AllianceName}]` : null}
                </p> : null}
            </div>
          </div>

          {/* K/D Badge */}
          <div className="rounded-lg bg-albion-gray-800 px-6 py-4 text-center">
            <p className="text-sm text-albion-gray-500">K/D Ratio</p>
            <p className={`text-3xl font-bold ${
              stats.kdRatio >= 2 ? 'text-neon-green' :
              stats.kdRatio >= 1 ? 'text-neon-blue' :
              'text-neon-red'
            }`}>
              {stats.kdRatio.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <Swords className="h-4 w-4" />
            <span className="text-sm">Total Kills</span>
          </div>
          <p className="text-2xl font-bold text-neon-green">{stats.totalKills}</p>
        </div>

        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <Skull className="h-4 w-4" />
            <span className="text-sm">Total Deaths</span>
          </div>
          <p className="text-2xl font-bold text-neon-red">{stats.totalDeaths}</p>
        </div>

        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Avg Kill Fame</span>
          </div>
          <p className="text-2xl font-bold text-neon-orange">
            {kills.length > 0 ? Math.round(kills.reduce((sum, k) => sum + (k.TotalVictimKillFame || 0), 0) / kills.length).toLocaleString() : '0'}
          </p>
        </div>

        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <Target className="h-4 w-4" />
            <span className="text-sm">Total Fame</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {((player.KillFame || 0) + (player.DeathFame || 0)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="panel-float">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-neon-blue" />
          <h3 className="text-lg font-bold">Activity Heatmap</h3>
        </div>
        <div className="flex justify-between gap-2">
          {daysOfWeek.map(day => {
            const activity = activityByDay.get(day) || 0;
            const intensity = activity / maxActivity;
            
            return (
              <div key={day} className="flex-1 text-center">
                <div
                  className="mb-2 h-24 rounded transition-all hover:scale-105"
                  style={{
                    backgroundColor: intensity > 0
                      ? `rgba(0, 212, 255, ${0.2 + intensity * 0.8})`
                      : '#1f2937',
                  }}
                  title={`${day}: ${activity} events`}
                />
                <p className="text-xs text-albion-gray-500">{day}</p>
                <p className="text-sm font-bold text-white">{activity}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Favorite Builds */}
      <div className="panel-float">
        <h3 className="mb-4 text-lg font-bold">Favorite Builds</h3>
        <div className="space-y-2">
          {favoriteBuilds.map((item, index) => (
            <div
              key={item.build}
              className="flex items-center justify-between rounded-lg bg-albion-gray-800 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-albion-gray-600">
                  #{index + 1}
                </span>
                <span className="font-medium text-white">
                  {buildNames.get(item.build.id) || getBuildName(item.build)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-albion-gray-500">
                  {item.count} kills
                </span>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-albion-gray-900">
                  <div
                    className="h-full bg-neon-blue"
                    style={{
                      width: `${(item.count / stats.totalKills) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Tabs */}
      <div className="panel-float">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setActiveTab('kills')}
            className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
              activeTab === 'kills'
                ? 'bg-neon-green text-white'
                : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
            }`}
          >
            Recent Kills ({kills.length})
          </button>
          <button
            onClick={() => setActiveTab('deaths')}
            className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
              activeTab === 'deaths'
                ? 'bg-neon-red text-white'
                : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
            }`}
          >
            Recent Deaths ({deaths.length})
          </button>
        </div>

        <div className="space-y-2">
          {(activeTab === 'kills' ? kills : deaths).slice(0, 10).map(event => (
            <div
              key={event.EventId}
              className="rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    {activeTab === 'kills' ? event.Victim.Name : event.Killer.Name}
                  </p>
                  <p className="text-xs text-albion-gray-500">
                    {new Date(event.TimeStamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neon-orange">
                    {event.TotalVictimKillFame?.toLocaleString()} fame
                  </p>
                  {(event as any).numberOfParticipants && (event as any).numberOfParticipants > 1 ? <span className="text-xs text-albion-gray-400">
                      {(event as any).numberOfParticipants} participants
                    </span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
