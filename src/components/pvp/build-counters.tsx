'use client';

/**
 * Build Counter-Analysis Component
 * Shows what beats what in a matrix visualization
 */

import { useEffect, useState } from 'react';

import { Shield, Swords, Target } from 'lucide-react';

// Using clean architecture: hooks → services → database
import { useRecentKills } from '@/hooks';
import {
  analyzeMetaBuilds,
  calculateCounters,
  getBuildName,
  type BuildStats,
} from '@/lib/analysis/gear-meta';
import { itemsService } from '@/lib/services/items.service';

export function BuildCounters() {
  const { data: kills, isLoading } = useRecentKills();
  const [builds, setBuilds] = useState<BuildStats[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<BuildStats | null>(null);
  const [buildNames, setBuildNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!kills || kills.length === 0) {
      return;
    }

    // Type narrowing - kills is guaranteed to be defined here
    const validKills = kills;

    async function processBuilds() {
      try {
        // @ts-expect-error - gear-meta.ts uses @ts-nocheck, type mismatch is expected
        let builds = analyzeMetaBuilds(validKills);
        // @ts-expect-error - gear-meta.ts uses @ts-nocheck, type mismatch is expected
        builds = calculateCounters(builds, validKills);

        const topBuilds = builds.sort((a, b) => b.popularity - a.popularity).slice(0, 10);

        setBuilds(topBuilds);

        // Load localized names using itemsService
        const names = new Map<string, string>();
        await Promise.all(
          topBuilds.map(async (build) => {
            const [weapon, armor] = await Promise.all([
              itemsService.getById(build.build.mainHand),
              itemsService.getById(build.build.armor),
            ]);

            const weaponName = weapon
              ? itemsService.getLocalizedName(weapon)
              : build.build.mainHand;
            const armorName = armor ? itemsService.getLocalizedName(armor) : build.build.armor;

            names.set(build.build.id, `${weaponName} + ${armorName}`);
          })
        );

        setBuildNames(names);
      } catch (error) {
        console.error('Failed to process builds:', error);
      }
    }

    void processBuilds();
  }, [kills]);

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

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-neon-purple" />
          <div>
            <h3 className="text-xl font-bold">Build Counter Matrix</h3>
            <p className="text-sm text-albion-gray-500">
              Rock-paper-scissors analysis of top builds
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Build List */}
        <div className="space-y-2">
          <h4 className="text-albion-gray-400 mb-3 text-sm font-semibold">Select a Build</h4>

          {builds.map((build, index) => {
            const buildName = buildNames.get(build.build.id) ?? getBuildName(build.build);
            const isSelected = selectedBuild?.build.id === build.build.id;

            return (
              <button
                key={build.build.id}
                onClick={() => setSelectedBuild(isSelected ? null : build)}
                className={`w-full rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-neon-purple bg-neon-purple/10'
                    : 'border-albion-gray-700 bg-albion-gray-800 hover:border-albion-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-albion-gray-600">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-white">{buildName}</p>
                      <p className="text-xs text-albion-gray-500">
                        {(build.winRate * 100).toFixed(1)}% win rate
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <div className="rounded bg-neon-green/20 px-2 py-1 text-neon-green">
                      +{build.counters.length}
                    </div>
                    <div className="rounded bg-neon-red/20 px-2 py-1 text-neon-red">
                      -{build.counteredBy.length}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Counter Details */}
        <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-900 p-6">
          {selectedBuild ? (
            <div>
              <div className="mb-6">
                <h4 className="text-2xl font-bold text-white">
                  {buildNames.get(selectedBuild.build.id) ?? getBuildName(selectedBuild.build)}
                </h4>
                <p className="text-sm text-albion-gray-500">Counter Analysis</p>
              </div>

              {/* Strong Against */}
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <Swords className="h-5 w-5 text-neon-green" />
                  <h5 className="font-semibold text-neon-green">
                    Strong Against ({selectedBuild.counters.length})
                  </h5>
                </div>

                {selectedBuild.counters.length > 0 ? (
                  <div className="space-y-2">
                    {selectedBuild.counters.map((counterId) => {
                      const counterBuild = builds.find((b) => b.build.id === counterId);
                      if (!counterBuild) {
                        return null;
                      }

                      return (
                        <div
                          key={counterId}
                          className="rounded-lg border border-neon-green/30 bg-neon-green/10 p-3"
                        >
                          <p className="font-medium text-white">
                            {getBuildName(counterBuild.build)}
                          </p>
                          <p className="text-xs text-albion-gray-500">
                            {(counterBuild.winRate * 100).toFixed(1)}% win rate overall
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-albion-gray-500">No counter data available</p>
                )}
              </div>

              {/* Weak Against */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-neon-red" />
                  <h5 className="font-semibold text-neon-red">
                    Weak Against ({selectedBuild.counteredBy.length})
                  </h5>
                </div>

                {selectedBuild.counteredBy.length > 0 ? (
                  <div className="space-y-2">
                    {selectedBuild.counteredBy.map((counterId) => {
                      const counterBuild = builds.find((b) => b.build.id === counterId);
                      if (!counterBuild) {
                        return null;
                      }

                      return (
                        <div
                          key={counterId}
                          className="rounded-lg border border-neon-red/30 bg-neon-red/10 p-3"
                        >
                          <p className="font-medium text-white">
                            {getBuildName(counterBuild.build)}
                          </p>
                          <p className="text-xs text-albion-gray-500">
                            {(counterBuild.winRate * 100).toFixed(1)}% win rate overall
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-albion-gray-500">No counter data available</p>
                )}
              </div>

              {/* Stats Summary */}
              <div className="mt-6 rounded-lg border border-neon-blue/50 bg-neon-blue/10 p-4">
                <p className="text-sm font-medium text-neon-blue">📊 Build Statistics</p>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-albion-gray-500">Win Rate</p>
                    <p className="font-bold text-white">
                      {(selectedBuild.winRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-albion-gray-500">Popularity</p>
                    <p className="font-bold text-white">
                      {(selectedBuild.popularity * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-albion-gray-500">Total Kills</p>
                    <p className="font-bold text-white">{selectedBuild.totalKills}</p>
                  </div>
                  <div>
                    <p className="text-albion-gray-500">Avg Fame</p>
                    <p className="font-bold text-white">
                      {Math.round(selectedBuild.avgFame).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <Target className="mx-auto mb-4 h-16 w-16 text-albion-gray-700" />
                <p className="text-albion-gray-500">Select a build to view counter analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4">
        <p className="text-albion-gray-400 text-sm">
          <strong className="text-white">How it works:</strong> Counter relationships are calculated
          based on kill data. A build &quot;counters&quot; another if it has a significantly higher
          win rate against that specific build.
        </p>
      </div>
    </div>
  );
}
