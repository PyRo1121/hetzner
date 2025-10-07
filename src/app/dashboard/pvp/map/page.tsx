'use client';

import { Suspense } from 'react';

import { Map } from 'lucide-react';

import { KillMap } from '@/components/pvp/kill-map';

export default function MapPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="panel-float">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-neon-green/20 p-3">
            <Map className="h-8 w-8 text-neon-green" />
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              <span className="text-neon-green">Kill</span> Map
            </h1>
            <p className="text-albion-gray-500">
              Geographic distribution of recent PvP activity
            </p>
          </div>
        </div>
      </div>

      {/* Kill Map Component */}
      <Suspense fallback={<div className="panel-float h-96 animate-pulse bg-albion-gray-800" />}>
        <KillMap />
      </Suspense>
    </div>
  );
}
