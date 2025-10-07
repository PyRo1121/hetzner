import { Suspense } from 'react';

import { Trophy, Sword, Pickaxe } from 'lucide-react';

import { PvELeaderboards } from '@/components/pvp/pve-leaderboards';
import { WeaponRankings } from '@/components/pvp/weapon-rankings';

export const metadata = {
  title: 'Advanced PvP Stats | Albion Online Omni-Dashboard',
  description: 'Weapon rankings, PvE leaderboards, and gathering statistics',
};

export default function AdvancedPvPPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="panel-float">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-neon-purple/20 p-3">
            <Trophy className="h-8 w-8 text-neon-purple" />
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              <span className="text-neon-purple">Advanced</span> PvP Statistics
            </h1>
            <p className="text-albion-gray-500">
              Weapon rankings, PvE leaderboards, and gathering statistics
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <Sword className="h-4 w-4" />
            <span className="text-sm">Weapon Categories</span>
          </div>
          <p className="text-2xl font-bold text-white">15+</p>
          <p className="mt-1 text-xs text-neon-purple">Tracked weapons</p>
        </div>

        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <Trophy className="h-4 w-4" />
            <span className="text-sm">Top Players</span>
          </div>
          <p className="text-2xl font-bold text-white">750+</p>
          <p className="mt-1 text-xs text-neon-green">Across all categories</p>
        </div>

        <div className="panel-float">
          <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
            <Pickaxe className="h-4 w-4" />
            <span className="text-sm">Gathering Types</span>
          </div>
          <p className="text-2xl font-bold text-white">6</p>
          <p className="mt-1 text-xs text-neon-blue">Resource categories</p>
        </div>
      </div>

      {/* Weapon Rankings */}
      <Suspense fallback={<div className="panel-float h-96 animate-pulse bg-albion-gray-800" />}>
        <WeaponRankings />
      </Suspense>

      {/* PvE & Gathering Leaderboards */}
      <Suspense fallback={<div className="panel-float h-96 animate-pulse bg-albion-gray-800" />}>
        <PvELeaderboards />
      </Suspense>
    </div>
  );
}
