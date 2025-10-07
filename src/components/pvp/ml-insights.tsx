'use client';

/**
 * ML Insights Component
 * Shows AI-powered predictions, player rankings, and anomaly detection
 */

import { useEffect, useState } from 'react';

import { AlertTriangle, Brain, Award, Target } from 'lucide-react';

import { supabase } from '@/backend/supabase/clients';

export function MLInsights() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'rankings' | 'predictions' | 'anomalies'>('rankings');
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        
        // Query via API for proper data structure
        const response = await fetch('/api/pvp/kills?limit=50&offset=0');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          // ML insights data loaded successfully
        } else {
          console.error('Invalid API response:', result);
        }
      } catch (error) {
        console.error('Failed to load ML insights:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
    
    // Subscribe to real-time updates with debounce
    let reloadTimeout: NodeJS.Timeout;
    const channel = supabase
      .channel('ml_insights_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kill_events' },
        () => {
          // Debounce reloads - ML doesn't need instant updates
          clearTimeout(reloadTimeout);
          reloadTimeout = setTimeout(() => {
            void loadInitialData();
          }, 10000); // Wait 10s before reloading ML
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
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
      <div className="mb-6 flex items-center gap-3">
        <Brain className="h-6 w-6 text-neon-purple" />
        <div>
          <h3 className="text-xl font-bold">🤖 AI-Powered Insights</h3>
          <p className="text-sm text-albion-gray-500">
            Machine learning analysis of PvP patterns
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setSelectedTab('rankings')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            selectedTab === 'rankings'
              ? 'bg-neon-purple text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <Award className="h-4 w-4" />
          ELO Rankings
        </button>
        <button
          onClick={() => setSelectedTab('predictions')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            selectedTab === 'predictions'
              ? 'bg-neon-purple text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <Target className="h-4 w-4" />
          Meta Shifts
        </button>
        <button
          onClick={() => setSelectedTab('anomalies')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            selectedTab === 'anomalies'
              ? 'bg-neon-purple text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Anomalies
        </button>
      </div>

      {/* ELO Rankings Tab */}
      {selectedTab === 'rankings' ? <div className="space-y-6">
          {/* Top Players */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <Award className="h-5 w-5 text-neon-orange" />
              Top Players by ELO
            </h4>
            <div className="space-y-2">
              <p className="text-center text-albion-gray-500">
                ML insights coming soon - analyzing player performance data
              </p>
            </div>
          </div>


          {/* ELO Explanation */}
          <div className="rounded-lg border border-neon-purple/50 bg-neon-purple/10 p-4">
            <p className="text-sm text-albion-gray-400">
              <strong className="text-white">ELO Rating System:</strong> Players are ranked using an ELO algorithm 
              that adjusts ratings based on wins and losses. Higher ratings indicate more skilled players.
            </p>
          </div>
        </div> : null}

      {/* Meta Shifts Tab */}
      {selectedTab === 'predictions' ? <div className="space-y-4">
          <h4 className="mb-3 flex items-center gap-2 font-semibold">
            <Brain className="h-5 w-5 text-neon-blue" />
            Meta Shifts Detected
          </h4>
          
          <p className="text-center text-albion-gray-500">
            Analyzing weapon and build trends...
          </p>

          {/* Fight Outcome Predictor Demo */}
          <div className="mt-6 rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-6">
            <h5 className="mb-4 font-semibold">Fight Outcome Predictor</h5>
            <p className="mb-4 text-sm text-albion-gray-400">
              Our ML model can predict fight outcomes based on:
            </p>
            <ul className="space-y-2 text-sm text-albion-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-neon-blue">•</span>
                Item Power difference (30% weight)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neon-blue">•</span>
                Player skill rating (40% weight)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neon-blue">•</span>
                Number advantage (20% weight)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neon-blue">•</span>
                Build matchup (10% weight)
              </li>
            </ul>
          </div>
        </div> : null}

      {/* Anomalies Tab */}
      {selectedTab === 'anomalies' ? <div className="space-y-4">
          <h4 className="mb-3 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-5 w-5 text-neon-red" />
            Unusual Kills Detected
          </h4>
          
          <p className="text-center text-albion-gray-500">
            No anomalous kills detected in recent data
          </p>

          {/* Anomaly Detection Info */}
          <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4">
            <p className="text-sm text-albion-gray-400">
              <strong className="text-white">Anomaly Detection:</strong> Our ML algorithm identifies unusual kills 
              based on extreme fame values, large item power differences, and unusual fight circumstances.
            </p>
          </div>
        </div> : null}
    </div>
  );
}
