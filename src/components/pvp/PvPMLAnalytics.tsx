'use client';

import { useEffect, useState } from 'react';

import { Brain, Target, Zap } from 'lucide-react';

import type { PvPFeatures, PvPPrediction } from '@/lib/services/ml-analytics.service';

interface PvPMLAnalyticsProps {
  features: PvPFeatures;
}

export function PvPMLAnalytics({ features }: PvPMLAnalyticsProps) {
  const [prediction, setPrediction] = useState<PvPPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/pvp/ml-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const payload: { success: boolean; data?: PvPPrediction } = await response.json();
        if (payload.success && payload.data) {
          setPrediction(payload.data);
        } else {
          setPrediction(null);
        }
      } catch (error) {
        console.error('ML analysis failed:', error);
      } finally {
        setLoading(false);
      }
    };

    void runAnalysis();
  }, [features]);

  if (loading) {
    return (
      <div className="panel-float">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple" />
          <span className="ml-3 text-albion-gray-400">Analyzing battle...</span>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="panel-float">
        <div className="text-center py-12 text-albion-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>ML Analysis unavailable</p>
        </div>
      </div>
    );
  }

  const winProbability = prediction.winProbability * 100;
  const isLikelyWin = winProbability > 60;
  const isLikelyLoss = winProbability < 40;

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Brain className="h-6 w-6 text-neon-purple" />
        <div>
          <h3 className="text-xl font-bold">ML Battle Analysis</h3>
          <p className="text-sm text-albion-gray-500">
            AI-powered win prediction and tactical insights
          </p>
        </div>
      </div>

      {/* Win Probability */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-albion-gray-400">Win Probability</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${
              isLikelyWin ? 'text-neon-green' :
              isLikelyLoss ? 'text-neon-red' : 'text-neon-blue'
            }`}>
              {winProbability.toFixed(1)}%
            </span>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isLikelyWin ? 'bg-neon-green/20 text-neon-green' :
              isLikelyLoss ? 'bg-neon-red/20 text-neon-red' : 'bg-neon-blue/20 text-neon-blue'
            }`}>
              {isLikelyWin ? 'Favorable' : isLikelyLoss ? 'Unfavorable' : 'Even Match'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-albion-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isLikelyWin ? 'bg-gradient-to-r from-neon-green to-neon-green/80' :
              isLikelyLoss ? 'bg-gradient-to-r from-neon-red to-neon-red/80' :
              'bg-gradient-to-r from-neon-blue to-neon-blue/80'
            }`}
            style={{ width: `${winProbability}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-albion-gray-500 mt-1">
          <span>0%</span>
          <span className="text-albion-gray-400">Confidence: {(prediction.confidence * 100).toFixed(0)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Key Factors */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Key Factors</h4>
        <div className="space-y-3">
          {prediction.factors.map((factor, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-albion-gray-800/50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-white">{factor.name}</div>
                <div className="text-sm text-albion-gray-400">{factor.description}</div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className={`w-16 h-2 rounded-full ${
                  factor.impact > 0.3 ? 'bg-neon-green' :
                  factor.impact < -0.3 ? 'bg-neon-red' : 'bg-albion-gray-600'
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      factor.impact > 0 ? 'bg-neon-green' : 'bg-neon-red'
                    }`}
                    style={{
                      width: `${Math.abs(factor.impact) * 100}%`,
                      marginLeft: factor.impact < 0 ? `${100 - Math.abs(factor.impact) * 100}%` : '0%'
                    }}
                  />
                </div>
                <span className={`text-sm font-medium ${
                  factor.impact > 0.1 ? 'text-neon-green' :
                  factor.impact < -0.1 ? 'text-neon-red' : 'text-albion-gray-400'
                }`}>
                  {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tactical Insights */}
      <div className="border-t border-albion-gray-700 pt-6">
        <h4 className="text-lg font-semibold text-white mb-4">Tactical Insights</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-albion-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-neon-blue" />
              <span className="font-medium text-white">Recommended Strategy</span>
            </div>
            <p className="text-sm text-albion-gray-400">
              {isLikelyWin
                ? 'Maintain pressure with coordinated attacks. Focus on high-value targets.'
                : 'Play defensively, use hit-and-run tactics. Wait for mistakes from opponent.'
              }
            </p>
          </div>

          <div className="p-4 bg-albion-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-neon-yellow" />
              <span className="font-medium text-white">Risk Assessment</span>
            </div>
            <p className="text-sm text-albion-gray-400">
              {prediction.confidence > 0.7
                ? 'High confidence prediction. Outcomes are statistically predictable.'
                : 'Moderate confidence. Battle outcome could go either way based on execution.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-3 bg-albion-gray-800/30 rounded-lg border border-albion-gray-700">
        <p className="text-xs text-albion-gray-500 text-center">
          ⚠️ ML predictions are based on historical data and patterns. Actual battle outcomes may vary due to player skill, tactics, and random factors.
        </p>
      </div>
    </div>
  );
}
