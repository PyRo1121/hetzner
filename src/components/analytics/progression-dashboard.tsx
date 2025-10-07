'use client';

import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Zap, Trophy, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { calculateProgression, generateInsights, type PlayerSnapshot, type ProgressionMetrics } from '@/lib/analytics/player-progression';

interface ProgressionDashboardProps {
  playerId: string;
  playerName: string;
}

export function ProgressionDashboard({ playerId, playerName }: ProgressionDashboardProps) {
  const [snapshots, setSnapshots] = useState<PlayerSnapshot[]>([]);
  const [metrics, setMetrics] = useState<ProgressionMetrics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgressionData();
  }, [playerId]);

  const loadProgressionData = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from API/database
      // For now, generate sample data
      const sampleSnapshots = generateSampleSnapshots(playerId, playerName);
      setSnapshots(sampleSnapshots);

      const progressionMetrics = calculateProgression(sampleSnapshots);
      setMetrics(progressionMetrics);

      const playerInsights = generateInsights(progressionMetrics);
      setInsights(playerInsights);
    } catch (error) {
      console.error('Failed to load progression data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="panel-float h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const chartData = snapshots.map(s => ({
    date: new Date(s.timestamp).toLocaleDateString(),
    fame: s.killFame / 1000000, // Convert to millions
    kills: s.totalKills,
    kd: s.kdRatio,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <h2 className="mb-2 text-2xl font-bold text-white">Progression Analytics</h2>
        <p className="text-sm text-albion-gray-500">
          Track your growth and performance over time
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-float"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neon-blue/20">
              <TrendingUp className="h-6 w-6 text-neon-blue" />
            </div>
            <div>
              <div className="text-xs text-albion-gray-500">Fame Growth</div>
              <div className="text-xl font-bold text-white">
                {(metrics.fameGrowthRate / 1000).toFixed(1)}K/day
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel-float"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neon-green/20">
              <Zap className="h-6 w-6 text-neon-green" />
            </div>
            <div>
              <div className="text-xs text-albion-gray-500">Kills/Day</div>
              <div className="text-xl font-bold text-white">
                {metrics.killsGrowthRate.toFixed(1)}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel-float"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              metrics.kdTrend === 'improving' ? 'bg-neon-green/20' : 
              metrics.kdTrend === 'declining' ? 'bg-red-500/20' : 'bg-albion-gray-700'
            }`}>
              {metrics.kdTrend === 'improving' ? (
                <TrendingUp className="h-6 w-6 text-neon-green" />
              ) : metrics.kdTrend === 'declining' ? (
                <TrendingDown className="h-6 w-6 text-red-500" />
              ) : (
                <Target className="h-6 w-6 text-albion-gray-400" />
              )}
            </div>
            <div>
              <div className="text-xs text-albion-gray-500">K/D Trend</div>
              <div className="text-xl font-bold capitalize text-white">
                {metrics.kdTrend.replace('_', ' ')}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="panel-float"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neon-gold/20">
              <Trophy className="h-6 w-6 text-neon-gold" />
            </div>
            <div>
              <div className="text-xs text-albion-gray-500">Rank Percentile</div>
              <div className="text-xl font-bold text-white">
                Top {(100 - metrics.estimatedRank).toFixed(0)}%
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fame Growth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="panel-float"
      >
        <h3 className="mb-4 text-lg font-semibold text-white">Fame Growth Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
            />
            <Line
              type="monotone"
              dataKey="fame"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="panel-float"
      >
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Activity className="h-5 w-5 text-neon-blue" />
          Insights & Recommendations
        </h3>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="rounded-lg bg-albion-gray-800 p-3 text-sm text-albion-gray-300"
            >
              {insight}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Projection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="panel-float"
      >
        <h3 className="mb-4 text-lg font-semibold text-white">30-Day Projection</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-albion-gray-500">Projected Fame</div>
            <div className="text-3xl font-bold text-neon-gold">
              {(metrics.projectedFame30d / 1000000).toFixed(2)}M
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-albion-gray-500">Expected Growth</div>
            <div className="text-2xl font-bold text-neon-green">
              +{((metrics.fameGrowthRate * 30) / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Generate sample snapshots for demonstration
function generateSampleSnapshots(playerId: string, playerName: string): PlayerSnapshot[] {
  const snapshots: PlayerSnapshot[] = [];
  const now = Date.now();
  const baseFame = 5000000;
  const baseKills = 500;

  for (let i = 30; i >= 0; i--) {
    const timestamp = new Date(now - i * 24 * 60 * 60 * 1000).toISOString();
    const killFame = baseFame + (30 - i) * 50000 + Math.random() * 20000;
    const totalKills = baseKills + (30 - i) * 5 + Math.floor(Math.random() * 3);
    const totalDeaths = Math.floor(totalKills / 2.5);

    snapshots.push({
      playerId,
      playerName,
      timestamp,
      killFame,
      deathFame: totalDeaths * 10000,
      totalKills,
      totalDeaths,
      kdRatio: totalKills / totalDeaths,
    });
  }

  return snapshots;
}
