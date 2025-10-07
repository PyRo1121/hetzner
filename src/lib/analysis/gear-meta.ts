// @ts-nocheck - Complex gear analysis with dynamic build data
/**
 * Gear Meta Analysis Engine
 * Analyzes kill data to identify meta builds, win rates, and counters
 */

import { getGearName } from '../utils/gear-names';
import { itemsService } from '@/lib/services';

import type { KillEvent } from '../api/gameinfo/client';

export interface GearBuild {
  id: string;
  mainHand: string;
  offHand: string | null;
  head: string;
  armor: string;
  shoes: string;
  cape: string | null;
  food: string | null;
  potion: string | null;
}

export interface BuildStats {
  build: GearBuild;
  totalKills: number;
  totalDeaths: number;
  winRate: number;
  avgFame: number;
  popularity: number; // 0-1
  trend: 'rising' | 'falling' | 'stable';
  counters: string[]; // Build IDs that counter this
  counteredBy: string[]; // Build IDs this counters
}

export interface MetaSnapshot {
  timestamp: Date;
  topBuilds: BuildStats[];
  risingBuilds: BuildStats[];
  fallingBuilds: BuildStats[];
  totalKillsAnalyzed: number;
}

/**
 * Extract gear build from kill event
 */
export function extractGearBuild(equipment: any): GearBuild | null {
  if (!equipment) {return null;}
  
  // Handle both nested and flat equipment structures
  const mainHand = equipment.MainHand?.Type || equipment.MainHand || '';
  const offHand = equipment.OffHand?.Type || equipment.OffHand || null;
  const head = equipment.Head?.Type || equipment.Head || '';
  const armor = equipment.Armor?.Type || equipment.Armor || '';
  const shoes = equipment.Shoes?.Type || equipment.Shoes || '';
  const cape = equipment.Cape?.Type || equipment.Cape || null;
  const food = equipment.Food?.Type || equipment.Food || null;
  const potion = equipment.Potion?.Type || equipment.Potion || null;

  // Need at least weapon and armor to be a valid build
  if (!mainHand || !armor) {return null;}

  return {
    id: generateBuildId({ MainHand: mainHand, OffHand: offHand, Head: head, Armor: armor, Shoes: shoes }),
    mainHand,
    offHand,
    head,
    armor,
    shoes,
    cape,
    food,
    potion,
  };
}

/**
 * Generate unique build ID from equipment
 */
function generateBuildId(equipment: any): string {
  const parts = [
    equipment.MainHand,
    equipment.OffHand,
    equipment.Head,
    equipment.Armor,
    equipment.Shoes,
  ].filter(Boolean);
  
  return parts.join('_');
}

/**
 * Analyze kills to generate meta statistics
 */
export function analyzeMetaBuilds(kills: KillEvent[]): BuildStats[] {
  console.log(`🔍 Analyzing ${kills.length} kills for meta builds...`);
  
  const buildMap = new Map<string, {
    build: GearBuild;
    kills: number;
    deaths: number;
    totalFame: number;
    appearances: number;
  }>();

  // Process each kill
  kills.forEach(kill => {
    // Killer's build (winner)
    const killerBuild = extractGearBuild((kill as any).Killer?.Equipment);
    if (killerBuild) {
      const stats = buildMap.get(killerBuild.id) || {
        build: killerBuild,
        kills: 0,
        deaths: 0,
        totalFame: 0,
        appearances: 0,
      };
      stats.kills++;
      stats.totalFame += kill.TotalVictimKillFame || 0;
      stats.appearances++;
      buildMap.set(killerBuild.id, stats);
    }

    // Victim's build (loser)
    const victimBuild = extractGearBuild((kill as any).Victim?.Equipment);
    if (victimBuild) {
      const stats = buildMap.get(victimBuild.id) || {
        build: victimBuild,
        kills: 0,
        deaths: 0,
        totalFame: 0,
        appearances: 0,
      };
      stats.deaths++;
      stats.appearances++;
      buildMap.set(victimBuild.id, stats);
    }
  });
  
  console.log(`📊 Found ${buildMap.size} unique builds`);

  // Calculate statistics
  const totalAppearances = Array.from(buildMap.values()).reduce(
    (sum, stats) => sum + stats.appearances,
    0
  );

  const buildStats: BuildStats[] = [];

  buildMap.forEach((stats) => {
    const totalFights = stats.kills + stats.deaths;
    const winRate = totalFights > 0 ? stats.kills / totalFights : 0;
    const popularity = stats.appearances / totalAppearances;

    buildStats.push({
      build: stats.build,
      totalKills: stats.kills,
      totalDeaths: stats.deaths,
      winRate,
      avgFame: totalFights > 0 ? stats.totalFame / totalFights : 0,
      popularity,
      trend: 'stable', // Will be calculated with historical data
      counters: [],
      counteredBy: [],
    });
  });

  // Sort by popularity
  return buildStats.sort((a, b) => b.popularity - a.popularity);
}

/**
 * Calculate build counter relationships
 */
export function calculateCounters(buildStats: BuildStats[], kills: KillEvent[]): BuildStats[] {
  const counterMatrix = new Map<string, Map<string, number>>();

  // Build counter matrix
  kills.forEach(kill => {
    const killerBuild = extractGearBuild((kill as any).Killer?.Equipment);
    const victimBuild = extractGearBuild((kill as any).Victim?.Equipment);

    if (killerBuild && victimBuild) {
      if (!counterMatrix.has(killerBuild.id)) {
        counterMatrix.set(killerBuild.id, new Map());
      }
      const counters = counterMatrix.get(killerBuild.id)!;
      counters.set(victimBuild.id, (counters.get(victimBuild.id) || 0) + 1);
    }
  });

  // Assign counters to builds
  return buildStats.map(build => {
    const counters = counterMatrix.get(build.id);
    if (!counters) {return build;}

    // Find top 3 builds this build counters
    const countersList = Array.from(counters.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([buildId]) => buildId);

    // Find top 3 builds that counter this build
    const counteredByList: string[] = [];
    counterMatrix.forEach((victims, attackerId) => {
      if (victims.has(build.id)) {
        counteredByList.push(attackerId);
      }
    });

    return {
      ...build,
      counters: countersList,
      counteredBy: counteredByList.slice(0, 3),
    };
  });
}

/**
 * Detect meta trends by comparing snapshots
 */
export function detectTrends(
  current: BuildStats[],
  previous: BuildStats[]
): BuildStats[] {
  const previousMap = new Map(previous.map(b => [b.build.id, b]));

  return current.map(build => {
    const prev = previousMap.get(build.id);
    
    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    
    if (prev) {
      const popularityChange = build.popularity - prev.popularity;
      const winRateChange = build.winRate - prev.winRate;
      
      if (popularityChange > 0.05 || winRateChange > 0.1) {
        trend = 'rising';
      } else if (popularityChange < -0.05 || winRateChange < -0.1) {
        trend = 'falling';
      }
    } else {
      // New build
      trend = 'rising';
    }

    return { ...build, trend };
  });
}

/**
 * Get build name from equipment (legacy - uses IDs)
 */
export function getBuildName(build: GearBuild): string {
  const weapon = build.mainHand.split('_').pop() || 'Unknown';
  const armor = build.armor.split('_')[1] || 'Unknown';
  
  return `${weapon} ${armor}`;
}

/**
 * Get localized build name using items.json
 * @param build - The gear build
 * @returns Promise with localized build name
 */
export async function getLocalizedBuildName(build: GearBuild): Promise<string> {
  try {
    const [weaponItem, armorItem] = await Promise.all([
      itemsService.getById(build.mainHand),
      itemsService.getById(build.armor),
    ]);
    const weaponName = weaponItem?.name ?? build.mainHand;
    const armorName = armorItem?.name ?? build.armor;
    
    // Localized names already include tier (e.g., "Master's Dagger Pair")
    // Just combine them with a separator
    return `${weaponName} + ${armorName}`;
  } catch (error) {
    console.warn('Failed to get localized build name:', error);
    return getBuildName(build); // Fallback to ID-based name
  }
}

/**
 * Get full localized gear description
 */
export async function getLocalizedGearDescription(build: GearBuild, locale: string = 'EN-US'): Promise<string> {
  try {
    const [mainHand, offHand, head, armor, shoes] = await Promise.all([
      getGearName(build.mainHand, locale),
      getGearName(build.offHand, locale),
      getGearName(build.head, locale),
      getGearName(build.armor, locale),
      getGearName(build.shoes, locale),
    ]);
    
    const parts = [mainHand];
    if (offHand !== 'None') {
      parts.push(`+ ${offHand}`);
    }
    parts.push(`| ${head}`, armor, shoes);
    
    return parts.join(' ');
  } catch (error) {
    console.warn('Failed to get localized gear description:', error);
    return `${build.mainHand} | ${build.head} ${build.armor} ${build.shoes}`;
  }
}

/**
 * Get build tier (average item tier)
 */
export function getBuildTier(build: GearBuild): number {
  const items = [
    build.mainHand,
    build.head,
    build.armor,
    build.shoes,
  ].filter(item => item != null); // Filter out null/undefined items

  const tiers = items
    .map(item => {
      const match = item?.match(/T(\d)/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(t => t > 0);

  return tiers.length > 0
    ? Math.round(tiers.reduce((a, b) => a + b, 0) / tiers.length)
    : 4; // Default to tier 4 if no valid tiers found
}
