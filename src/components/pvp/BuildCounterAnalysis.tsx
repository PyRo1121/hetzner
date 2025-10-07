'use client';

import { useEffect, useState } from 'react';
import { Shield, Sword, Users } from 'lucide-react';

import type { BuildCounter } from '@/lib/services/ml-analytics.service';

interface BuildCounterAnalysisProps {
  buildId: string;
  buildName?: string;
}

export function BuildCounterAnalysis({ buildId, buildName }: BuildCounterAnalysisProps) {
  const [analysis, setAnalysis] = useState<BuildCounter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/pvp/build-counter/${buildId}`);
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const payload: { success: boolean; data?: BuildCounter } = await response.json();
        if (payload.success && payload.data) {
          setAnalysis(payload.data);
        } else {
          setAnalysis(null);
        }
      } catch (error) {
        console.error('Build counter analysis failed:', error);
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    void runAnalysis();
  }, [buildId]);

  if (loading) {
    return (
      <div className="panel-float">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple" />
          <span className="ml-3 text-albion-gray-400">Analyzing counters...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="panel-float">
        <div className="text-center py-12 text-albion-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Counter analysis unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-neon-purple" />
        <div>
          <h3 className="text-xl font-bold">Build Counter Analysis</h3>
          <p className="text-sm text-albion-gray-500">
            AI-recommended counters for {buildName ?? analysis.buildName}
          </p>
        </div>
      </div>

      {/* Best Counter */}
      {analysis.counterBuilds.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-neon-green/10 to-neon-green/5 border border-neon-green/30 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Sword className="h-5 w-5 text-neon-green" />
            <span className="text-lg font-bold text-neon-green">Top Counter</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-white">{analysis.counterBuilds[0].buildName}</h4>
              <p className="text-sm text-albion-gray-400">
                {analysis.counterBuilds[0].winRate * 100}% win rate vs this build
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-neon-green">
                {(analysis.counterBuilds[0].winRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-albion-gray-400">
                {analysis.counterBuilds[0].sampleSize} battles
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Counter Builds */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Recommended Counters</h4>
        <div className="space-y-3">
          {analysis.counterBuilds.map((counter, index) => (
            <div key={counter.buildId} className="p-4 bg-albion-gray-800/50 rounded-lg border border-albion-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-neon-green text-black' :
                    index === 1 ? 'bg-neon-blue text-white' :
                    'bg-albion-gray-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <h5 className="text-lg font-semibold text-white">{counter.buildName}</h5>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-albion-gray-400" />
                  <span className="text-sm text-albion-gray-400">{counter.sampleSize}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-full bg-albion-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          counter.winRate > 0.6 ? 'bg-neon-green' :
                          counter.winRate > 0.5 ? 'bg-neon-yellow' : 'bg-neon-red'
                        }`}
                        style={{ width: `${counter.winRate * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${
                      counter.winRate > 0.6 ? 'text-neon-green' :
                      counter.winRate > 0.5 ? 'text-neon-yellow' : 'text-neon-red'
                    }`}>
                      {(counter.winRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-albion-gray-400">
                    Win rate against {buildName ?? analysis.buildName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Tips */}
      <div className="mt-6 p-4 bg-albion-gray-800/30 rounded-lg border border-albion-gray-700">
        <h4 className="text-lg font-semibold text-white mb-3">Strategy Tips</h4>
        <div className="space-y-2 text-sm text-albion-gray-400">
          <p>• Focus on builds with {'>'}60% win rate for best results</p>
          <p>• Consider sample size - higher numbers are more reliable</p>
          <p>• Mix counter builds with your team composition</p>
          <p>• Adapt based on opponent gear quality and IP levels</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-albion-gray-800/30 rounded-lg border border-albion-gray-700">
        <p className="text-xs text-albion-gray-500 text-center">
          🤖 ML analysis based on historical PvP data. Individual player skill and tactics can override statistical advantages.
        </p>
      </div>
    </div>
  );
}
