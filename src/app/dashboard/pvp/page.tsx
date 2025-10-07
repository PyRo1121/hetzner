'use client';

import { Suspense, useEffect, useState } from 'react';

import { Swords, TrendingUp, Users, Target } from 'lucide-react';

import { JuiciestFights } from '@/components/pvp/juiciest-fights';
import { RecentBattles } from '@/components/pvp/recent-battles';

export default function PvPMetaPage() {
  const [stats, setStats] = useState({
    totalKills: 0,
    metaBuilds: 0,
    activePlayers: 0,
    avgFame: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch aggregate stats from database
        const response = await fetch('/api/pvp/stats');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error(result.error ?? 'Invalid API response');
        }

        setStats(result.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }

    void fetchStats();
    // Refresh stats every 2 minutes instead of 1
    const interval = setInterval(() => { void fetchStats(); }, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="panel-float">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-neon-red/20 p-3">
            <Swords className="h-8 w-8 text-neon-red" />
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              <span className="text-neon-red">PvP</span> Meta Analysis
            </h1>
            <p className="text-albion-gray-500">
              Comprehensive kill analysis, gear meta tracking, and player rankings
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats - REAL DATA */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <Swords className="h-4 w-4" />
            <span className="text-sm">Recent Kills</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalKills.toLocaleString()}</p>
          <p className="mt-1 text-xs text-neon-green">Live from API</p>
        </div>

        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <Target className="h-4 w-4" />
            <span className="text-sm">Unique Builds</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.metaBuilds.toLocaleString()}</p>
          <p className="mt-1 text-xs text-neon-blue">Detected</p>
        </div>

        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <Users className="h-4 w-4" />
            <span className="text-sm">Active Players</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.activePlayers.toLocaleString()}</p>
          <p className="mt-1 text-xs text-albion-gray-500">Recent activity</p>
        </div>

        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Avg Fame/Kill</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.avgFame.toLocaleString()}</p>
          <p className="mt-1 text-xs text-neon-green">Real-time</p>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Juiciest Fights */}
        <Suspense fallback={<div className="panel-float h-96 animate-pulse bg-albion-gray-800" />}>
          <JuiciestFights />
        </Suspense>

        {/* Recent Battles */}
        <Suspense fallback={<div className="panel-float h-96 animate-pulse bg-albion-gray-800" />}>
          <RecentBattles />
        </Suspense>
      </div>
    </div>
  );
}
