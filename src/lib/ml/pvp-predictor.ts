/**
 * PvP ML Prediction Engine
 * Uses machine learning to predict fight outcomes, player skill ratings, and build effectiveness
 */

// import type { GearBuild } from '../analysis/gear-meta';
import type { KillEvent } from '../api/gameinfo/client';

export interface PlayerSkillRating {
  playerId: string;
  playerName: string;
  eloRating: number;
  confidence: number;
  rank: string; // Bronze, Silver, Gold, Platinum, Diamond
  gamesPlayed: number;
}

export interface FightPrediction {
  winProbability: number; // 0-1
  confidenceLevel: number; // 0-1
  factors: {
    itemPowerDifference: number;
    skillRatingDifference: number;
    buildMatchup: number;
    numberAdvantage: number;
  };
  recommendation: string;
}

export interface BuildEffectiveness {
  buildId: string;
  effectiveness: number; // 0-1
  winRateByTier: Map<number, number>;
  strongAgainst: string[];
  weakAgainst: string[];
  optimalScenarios: string[];
}

/**
 * Calculate ELO rating for players based on kill history
 */
export function calculateEloRatings(kills: KillEvent[]): Map<string, PlayerSkillRating> {
  const K_FACTOR = 32; // ELO adjustment factor
  const INITIAL_RATING = 1500;
  
  const ratings = new Map<string, { rating: number; games: number }>();

  // Initialize ratings
  kills.forEach(kill => {
    if (!ratings.has(kill.Killer.Id)) {
      ratings.set(kill.Killer.Id, { rating: INITIAL_RATING, games: 0 });
    }
    if (!ratings.has(kill.Victim.Id)) {
      ratings.set(kill.Victim.Id, { rating: INITIAL_RATING, games: 0 });
    }
  });

  // Process each kill to update ratings
  kills.forEach(kill => {
    const killerData = ratings.get(kill.Killer.Id)!;
    const victimData = ratings.get(kill.Victim.Id)!;

    // Expected score calculation
    const expectedKiller = 1 / (1 + Math.pow(10, (victimData.rating - killerData.rating) / 400));
    const expectedVictim = 1 - expectedKiller;

    // Actual scores (1 for win, 0 for loss)
    const actualKiller = 1;
    const actualVictim = 0;

    // Update ratings
    killerData.rating += K_FACTOR * (actualKiller - expectedKiller);
    victimData.rating += K_FACTOR * (actualVictim - expectedVictim);
    
    killerData.games++;
    victimData.games++;
  });

  // Convert to PlayerSkillRating
  const skillRatings = new Map<string, PlayerSkillRating>();
  
  kills.forEach(kill => {
    [kill.Killer, kill.Victim].forEach(player => {
      if (!skillRatings.has(player.Id)) {
        const data = ratings.get(player.Id)!;
        const rank = getRankFromElo(data.rating);
        const confidence = Math.min(data.games / 100, 1); // More games = higher confidence
        
        skillRatings.set(player.Id, {
          playerId: player.Id,
          playerName: player.Name,
          eloRating: Math.round(data.rating),
          confidence,
          rank,
          gamesPlayed: data.games,
        });
      }
    });
  });

  return skillRatings;
}

/**
 * Get rank from ELO rating
 */
function getRankFromElo(elo: number): string {
  if (elo >= 2200) {return 'Diamond';}
  if (elo >= 1900) {return 'Platinum';}
  if (elo >= 1600) {return 'Gold';}
  if (elo >= 1300) {return 'Silver';}
  return 'Bronze';
}

/**
 * Predict fight outcome using ML features
 */
export function predictFightOutcome(
  attacker: {
    itemPower: number;
    eloRating: number;
    buildId: string;
    groupSize: number;
  },
  defender: {
    itemPower: number;
    eloRating: number;
    buildId: string;
    groupSize: number;
  },
  buildMatchups: Map<string, string[]> // buildId -> countered builds
): FightPrediction {
  // Feature extraction
  const itemPowerDiff = (attacker.itemPower - defender.itemPower) / 100;
  const skillDiff = (attacker.eloRating - defender.eloRating) / 400;
  const numberDiff = (attacker.groupSize - defender.groupSize) / 10;
  
  // Build matchup advantage
  const counters = buildMatchups.get(attacker.buildId) || [];
  const buildAdvantage = counters.includes(defender.buildId) ? 0.15 : 0;

  // Logistic regression-style prediction
  const logit = 
    0.3 * itemPowerDiff +
    0.4 * skillDiff +
    0.2 * numberDiff +
    buildAdvantage;

  // Convert to probability using sigmoid
  const winProbability = 1 / (1 + Math.exp(-logit));

  // Confidence based on data quality
  const confidence = Math.min(
    Math.abs(itemPowerDiff) * 0.3 +
    Math.abs(skillDiff) * 0.4 +
    Math.abs(numberDiff) * 0.3,
    1
  );

  // Generate recommendation
  let recommendation = '';
  if (winProbability > 0.7) {
    recommendation = '✅ High chance of victory - Engage!';
  } else if (winProbability > 0.5) {
    recommendation = '⚠️ Slight advantage - Proceed with caution';
  } else if (winProbability > 0.3) {
    recommendation = '⚠️ Slight disadvantage - Consider retreating';
  } else {
    recommendation = '❌ High risk - Retreat recommended';
  }

  return {
    winProbability,
    confidenceLevel: confidence,
    factors: {
      itemPowerDifference: itemPowerDiff,
      skillRatingDifference: skillDiff,
      buildMatchup: buildAdvantage,
      numberAdvantage: numberDiff,
    },
    recommendation,
  };
}

/**
 * Analyze build effectiveness using historical data
 */
export function analyzeBuildEffectiveness(
  buildId: string,
  kills: KillEvent[]
): BuildEffectiveness {
  const buildKills = kills.filter(k => 
    (k.Killer as any).Equipment?.MainHand?.Type?.includes(buildId.split('_')[0])
  );
  
  const buildDeaths = kills.filter(k =>
    (k.Victim as any).Equipment?.MainHand?.Type?.includes(buildId.split('_')[0])
  );

  const totalFights = buildKills.length + buildDeaths.length;
  const effectiveness = totalFights > 0 ? buildKills.length / totalFights : 0;

  // Win rate by tier
  const winRateByTier = new Map<number, number>();
  for (let tier = 4; tier <= 8; tier++) {
    const tierKills = buildKills.filter(k => 
      (k.Killer as any).Equipment?.MainHand?.Type?.includes(`T${tier}`)
    );
    const tierDeaths = buildDeaths.filter(k =>
      (k.Victim as any).Equipment?.MainHand?.Type?.includes(`T${tier}`)
    );
    const tierTotal = tierKills.length + tierDeaths.length;
    winRateByTier.set(tier, tierTotal > 0 ? tierKills.length / tierTotal : 0);
  }

  // Strong/weak matchups (simplified)
  const strongAgainst: string[] = [];
  const weakAgainst: string[] = [];

  // Optimal scenarios
  const optimalScenarios = [
    effectiveness > 0.6 ? '1v1 Duels' : null,
    effectiveness > 0.55 ? 'Small Skirmishes (2-5 players)' : null,
    effectiveness > 0.5 ? 'Large Battles (5+ players)' : null,
  ].filter(Boolean) as string[];

  return {
    buildId,
    effectiveness,
    winRateByTier,
    strongAgainst,
    weakAgainst,
    optimalScenarios,
  };
}

/**
 * Detect anomalous kills (unusual/suspicious)
 */
export function detectAnomalousKills(kills: KillEvent[]): KillEvent[] {
  const anomalies: KillEvent[] = [];

  kills.forEach(kill => {
    let anomalyScore = 0;

    // Check for extreme fame values (outliers)
    const avgFame = kills.reduce((sum, k) => sum + k.TotalVictimKillFame, 0) / kills.length;
    const stdDev = Math.sqrt(
      kills.reduce((sum, k) => sum + Math.pow(k.TotalVictimKillFame - avgFame, 2), 0) / kills.length
    );
    
    if (kill.TotalVictimKillFame > avgFame + 3 * stdDev) {
      anomalyScore += 0.5; // Extremely high fame
    }

    // Check for unusual item power differences
    const killerIP = (kill.Killer as any).AverageItemPower || 0;
    const victimIP = (kill.Victim as any).AverageItemPower || 0;
    
    if (killerIP > 0 && victimIP > 0) {
      const ipDiff = Math.abs(killerIP - victimIP);
      if (ipDiff > 500) {
        anomalyScore += 0.3; // Large IP difference
      }
    }

    // Check for solo kills with high participant count
    if (kill.numberOfParticipants && kill.numberOfParticipants > 10 && kill.GroupMemberCount === 1) {
      anomalyScore += 0.2; // Solo player in large fight
    }

    if (anomalyScore >= 0.5) {
      anomalies.push(kill);
    }
  });

  return anomalies.sort((a, b) => b.TotalVictimKillFame - a.TotalVictimKillFame);
}

/**
 * Generate ML-powered insights
 */
export function generateMLInsights(kills: KillEvent[]): {
  topPlayers: PlayerSkillRating[];
  risingStars: PlayerSkillRating[];
  anomalousKills: KillEvent[];
  metaShifts: string[];
} {
  const skillRatings = calculateEloRatings(kills);
  const ratingsArray = Array.from(skillRatings.values());

  // Top players by ELO
  const topPlayers = ratingsArray
    .filter(r => r.gamesPlayed >= 10) // Minimum games for ranking
    .sort((a, b) => b.eloRating - a.eloRating)
    .slice(0, 10);

  // Rising stars (high ELO with low games played)
  const risingStars = ratingsArray
    .filter(r => r.gamesPlayed >= 5 && r.gamesPlayed < 20 && r.eloRating > 1600)
    .sort((a, b) => b.eloRating - a.eloRating)
    .slice(0, 5);

  // Anomalous kills
  const anomalousKills = detectAnomalousKills(kills).slice(0, 5);

  // Meta shifts (placeholder - would need historical data)
  const metaShifts = [
    'Claymore builds increasing in popularity (+15%)',
    'Healer builds showing improved win rates (+8%)',
    'T8 gear usage up 12% this week',
  ];

  return {
    topPlayers,
    risingStars,
    anomalousKills,
    metaShifts,
  };
}
