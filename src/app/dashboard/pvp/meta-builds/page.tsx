'use client';

import { Suspense } from 'react';

import { Target } from 'lucide-react';

import { MetaBuilds } from '@/components/pvp/meta-builds';

export default function MetaBuildsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="panel-float">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-neon-blue/20 p-3">
            <Target className="h-8 w-8 text-neon-blue" />
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              <span className="text-neon-blue">Meta</span> Builds
            </h1>
            <p className="text-albion-gray-500">
              Top performing PvP builds based on recent kill data
            </p>
          </div>
        </div>
      </div>

      {/* Meta Builds Component */}
      <Suspense fallback={<div className="panel-float h-96 animate-pulse bg-albion-gray-800" />}>
        <MetaBuilds />
      </Suspense>
    </div>
  );
}
