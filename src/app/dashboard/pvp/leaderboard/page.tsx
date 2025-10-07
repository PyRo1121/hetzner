'use client';

import { Suspense } from 'react';

import { Trophy } from 'lucide-react';

import { PlayerLeaderboard } from '@/components/pvp/player-leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="panel-float">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-neon-orange/20 p-3">
            <Trophy className="h-8 w-8 text-neon-orange" />
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              <span className="text-neon-orange">Player</span> Leaderboard
            </h1>
            <p className="text-albion-gray-500">
              Top PvP performers ranked by kills, fame, and K/D ratio
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard Component */}
      <Suspense fallback={<div className="panel-float h-96 animate-pulse bg-albion-gray-800" />}>
        <PlayerLeaderboard />
      </Suspense>
    </div>
  );
}
