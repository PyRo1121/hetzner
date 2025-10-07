/**
 * Player Progression Analytics
 * Track player growth, fame gains, and skill development
 */

export interface PlayerSnapshot {
  playerId: string;
  playerName: string;
  timestamp: string;
  killFame: number;
  deathFame: number;
  totalKills: number;
  totalDeaths: number;
  kdRatio: number;
}

export interface ProgressionMetrics {
  fameGrowthRate: number; // Fame per day
  killsGrowthRate: number; // Kills per day
  kdTrend: 'improving' | 'declining' | 'stable';
  activityLevel: 'very_active' | 'active' | 'moderate' | 'low';
  estimatedRank: number; // Percentile ranking
  projectedFame30d: number; // Projected fame in 30 days
}

/**
 * Calculate progression metrics from historical snapshots
 */
export function calculateProgression(snapshots: PlayerSnapshot[]): ProgressionMetrics {
  if (snapshots.length < 2) {
    return {
      fameGrowthRate: 0,
      killsGrowthRate: 0,
      kdTrend: 'stable',
      activityLevel: 'low',
      estimatedRank: 50,
      projectedFame30d: snapshots[0]?.killFame || 0,
    };
  }

  // Sort by timestamp
  const sorted = [...snapshots].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  // Calculate time span in days
  const timeSpanMs = new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime();
  const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);

  if (timeSpanDays === 0) {
    return {
      fameGrowthRate: 0,
      killsGrowthRate: 0,
      kdTrend: 'stable',
      activityLevel: 'low',
      estimatedRank: 50,
      projectedFame30d: last.killFame,
    };
  }

  // Fame growth rate (per day)
  const fameGrowthRate = (last.killFame - first.killFame) / timeSpanDays;

  // Kills growth rate (per day)
  const killsGrowthRate = (last.totalKills - first.totalKills) / timeSpanDays;

  // K/D trend
  const kdDiff = last.kdRatio - first.kdRatio;
  const kdTrend = kdDiff > 0.1 ? 'improving' : kdDiff < -0.1 ? 'declining' : 'stable';

  // Activity level based on kills per day
  const activityLevel = 
    killsGrowthRate > 10 ? 'very_active' :
    killsGrowthRate > 5 ? 'active' :
    killsGrowthRate > 2 ? 'moderate' : 'low';

  // Estimated rank (simplified - would need full player database)
  const estimatedRank = Math.min(99, Math.max(1, 
    50 + (last.killFame / 1000000) * 10
  ));

  // Projected fame in 30 days
  const projectedFame30d = last.killFame + (fameGrowthRate * 30);

  return {
    fameGrowthRate,
    killsGrowthRate,
    kdTrend,
    activityLevel,
    estimatedRank,
    projectedFame30d,
  };
}

/**
 * Generate progression insights
 */
export function generateInsights(metrics: ProgressionMetrics): string[] {
  const insights: string[] = [];

  // Fame growth insights
  if (metrics.fameGrowthRate > 100000) {
    insights.push('🔥 Exceptional fame growth! You\'re on fire!');
  } else if (metrics.fameGrowthRate > 50000) {
    insights.push('📈 Strong fame growth. Keep it up!');
  } else if (metrics.fameGrowthRate < 10000) {
    insights.push('💡 Consider more PvP activity to boost fame gains');
  }

  // K/D trend insights
  if (metrics.kdTrend === 'improving') {
    insights.push('⚔️ Your K/D ratio is improving! Great progress!');
  } else if (metrics.kdTrend === 'declining') {
    insights.push('🛡️ K/D ratio declining. Focus on survival tactics.');
  }

  // Activity insights
  if (metrics.activityLevel === 'very_active') {
    insights.push('🎮 Very active player! You\'re dominating the battlefield!');
  } else if (metrics.activityLevel === 'low') {
    insights.push('📅 Low activity detected. More battles = more fame!');
  }

  // Ranking insights
  if (metrics.estimatedRank > 90) {
    insights.push('👑 Top 10% player! You\'re among the elite!');
  } else if (metrics.estimatedRank > 75) {
    insights.push('🏆 Top 25% player! Excellent performance!');
  }

  // Projection insights
  if (metrics.projectedFame30d > metrics.fameGrowthRate * 30) {
    insights.push('🚀 At this rate, you\'ll gain significant fame this month!');
  }

  return insights;
}

/**
 * Compare player to average
 */
export function compareToAverage(
  playerMetrics: ProgressionMetrics,
  averageMetrics: ProgressionMetrics
): {
  fameComparison: number; // Percentage difference
  killsComparison: number;
  rankComparison: number;
  summary: string;
} {
  const fameComparison = averageMetrics.fameGrowthRate > 0
    ? ((playerMetrics.fameGrowthRate - averageMetrics.fameGrowthRate) / averageMetrics.fameGrowthRate) * 100
    : 0;

  const killsComparison = averageMetrics.killsGrowthRate > 0
    ? ((playerMetrics.killsGrowthRate - averageMetrics.killsGrowthRate) / averageMetrics.killsGrowthRate) * 100
    : 0;

  const rankComparison = playerMetrics.estimatedRank - averageMetrics.estimatedRank;

  let summary = '';
  if (fameComparison > 50) {
    summary = 'You\'re performing significantly above average!';
  } else if (fameComparison > 0) {
    summary = 'You\'re performing above average. Good job!';
  } else if (fameComparison > -50) {
    summary = 'You\'re performing slightly below average.';
  } else {
    summary = 'Consider reviewing your strategy to improve performance.';
  }

  return {
    fameComparison,
    killsComparison,
    rankComparison,
    summary,
  };
}
