'use client';

import { Suspense } from 'react';

import { TrendingUp } from 'lucide-react';

import { KillFeed } from '@/components/pvp/KillFeed';
import { PvPSearch } from '@/components/pvp/pvp-search';

export default function KillsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="panel-float">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-neon-red/20 p-3">
            <TrendingUp className="h-8 w-8 text-neon-red" />
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              <span className="text-neon-red">Kill</span> Feed
            </h1>
            <p className="text-albion-gray-500">Live PvP kills and player search</p>
          </div>
        </div>
      </div>

      {/* Live Kill Feed */}
      <Suspense fallback={<div className="panel-float h-96 animate-pulse bg-albion-gray-800" />}>
        <KillFeed />
      </Suspense>

      {/* Player/Guild Search */}
      <Suspense fallback={<div className="panel-float h-64 animate-pulse bg-albion-gray-800" />}>
        <PvPSearch />
      </Suspense>
    </div>
  );
}
