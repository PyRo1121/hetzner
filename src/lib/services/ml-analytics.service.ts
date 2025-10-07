/**
 * ML Analytics Service (Singleton)
 * Provides machine learning-powered insights for PvP and market data
 * Uses TensorFlow.js for client-side ML computations
 */

import * as tf from '@tensorflow/tfjs';

import { CACHE_TTL, getCache, setCache } from '@/lib/cache/redis-cache.server';

export interface PvPFeatures {
  killerAvgIP: number;
  victimAvgIP: number;
  killerGuildSize: number;
  victimGuildSize: number;
  timeOfDay: number; // 0-23
  location: string;
  killerWeaponType: string;
  victimWeaponType: string;
  qualityDifference: number; // killer - victim
}

export interface PvPPrediction {
  winProbability: number;
  confidence: number;
  factors: {
    name: string;
    impact: number; // -1 to 1
    description: string;
  }[];
}

export interface MarketFeatures {
  itemId: string;
  city: string;
  quality: number;
  currentPrice: number;
  priceHistory: number[]; // last 7 days
  volumeHistory: number[]; // last 7 days
  timeOfDay: number;
  dayOfWeek: number;
}

export interface MarketPrediction {
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  volatility: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

export interface BuildCounter {
  buildId: string;
  buildName: string;
  counterBuilds: Array<{
    buildId: string;
    buildName: string;
    winRate: number;
    sampleSize: number;
  }>;
}

class MLAnalyticsService {
  private static instance: MLAnalyticsService | null = null;
  private pvpModel: tf.LayersModel | null = null;
  private marketModel: tf.LayersModel | null = null;
  private isInitialized = false;

  static getInstance(): MLAnalyticsService {
    MLAnalyticsService.instance ??= new MLAnalyticsService();
    return MLAnalyticsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize TensorFlow.js
      await tf.ready();

      // Create simple models for demonstration
      this.createPVPModel();
      this.createMarketModel();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ML models:', error);
      // Fallback to rule-based predictions
    }
  }

  private createPVPModel(): void {
    // Simple neural network for PvP win prediction
    this.pvpModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 16, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }),
      ],
    });

    this.pvpModel.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });
  }

  private createMarketModel(): void {
    // Simple LSTM-like model for price prediction
    this.marketModel = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [7], units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1 }),
      ],
    });

    this.marketModel.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
    });
  }

  async predictPVPOutcome(features: PvPFeatures): Promise<PvPPrediction> {
    await this.initialize();

    const input = tf.tensor2d([
      [
        features.killerAvgIP / 2000, // normalize
        features.victimAvgIP / 2000,
        features.killerGuildSize / 100,
        features.victimGuildSize / 100,
        features.timeOfDay / 24,
        this.hashString(features.location) / 1000,
        this.hashString(features.killerWeaponType) / 1000,
        features.qualityDifference / 5,
      ],
    ]);

    let winProbability = 0.5; // default
    let confidence = 0.5;

    if (this.pvpModel) {
      try {
        const prediction = this.pvpModel.predict(input) as tf.Tensor;
        winProbability = (await prediction.data())[0];
        confidence = Math.min(Math.abs(winProbability - 0.5) * 2, 0.9); // higher confidence when prediction is more extreme
        prediction.dispose();
      } catch (error) {
        console.error('PVP prediction failed:', error);
      }
    } else {
      // Rule-based fallback
      const ipAdvantage = (features.killerAvgIP - features.victimAvgIP) / 100;
      const guildAdvantage = (features.killerGuildSize - features.victimGuildSize) / 10;
      winProbability = 0.5 + Math.tanh(ipAdvantage + guildAdvantage) * 0.3;
      confidence = 0.6;
    }

    input.dispose();

    const factors = this.analyzePVPFactors(features, winProbability);

    return {
      winProbability,
      confidence,
      factors,
    };
  }

  async predictMarketPrice(features: MarketFeatures): Promise<MarketPrediction> {
    await this.initialize();

    // Simple features: current price, trend, volatility, time factors
    const priceHistory = features.priceHistory.slice(-7);
    const avgPrice = priceHistory.reduce((a, b) => a + b, 0) / priceHistory.length;
    const trend =
      priceHistory.length > 1
        ? (priceHistory[priceHistory.length - 1] - priceHistory[0]) / priceHistory[0]
        : 0;
    const volatility = this.calculateVolatility(priceHistory);
    const volumeAvg =
      features.volumeHistory.reduce((a, b) => a + b, 0) / features.volumeHistory.length;

    const input = tf.tensor2d([
      [
        features.currentPrice / avgPrice, // relative to average
        trend,
        volatility,
        features.timeOfDay / 24,
        features.dayOfWeek / 7,
        volumeAvg / 100,
        this.hashString(features.itemId) / 10000,
      ],
    ]);

    let predictedPrice = features.currentPrice * (1 + trend * 0.1); // default trend-based
    let confidence = 0.5;

    if (this.marketModel) {
      try {
        const prediction = this.marketModel.predict(input) as tf.Tensor;
        const predictionValue = (await prediction.data())[0];
        predictedPrice = features.currentPrice * (1 + predictionValue * 0.1); // small adjustments
        confidence = 0.7;
        prediction.dispose();
      } catch (error) {
        console.error('Market prediction failed:', error);
      }
    }

    input.dispose();

    const trendDirection =
      predictedPrice > features.currentPrice
        ? 'up'
        : predictedPrice < features.currentPrice
          ? 'down'
          : 'stable';

    return {
      predictedPrice,
      confidence,
      trend: trendDirection,
      volatility,
      factors: this.analyzeMarketFactors(features, predictedPrice),
    };
  }

  async analyzeBuildCounters(buildId: string): Promise<BuildCounter> {
    // Mock analysis - in real implementation, this would analyze kill data
    const cacheKey = `ml:build_counters:${buildId}`;
    const cached = await getCache<BuildCounter>(cacheKey);
    if (cached) {
      return cached;
    }

    // Simulate analysis of kill data to find counter builds
    const mockCounters: BuildCounter = {
      buildId,
      buildName: this.getBuildName(buildId),
      counterBuilds: [
        {
          buildId: 'counter1',
          buildName: 'Heavy Plate Counter',
          winRate: 0.65,
          sampleSize: 127,
        },
        {
          buildId: 'counter2',
          buildName: 'Caster Counter',
          winRate: 0.58,
          sampleSize: 89,
        },
        {
          buildId: 'counter3',
          buildName: 'Mobility Counter',
          winRate: 0.72,
          sampleSize: 156,
        },
      ],
    };

    await setCache(cacheKey, mockCounters, CACHE_TTL.STABLE);
    return mockCounters;
  }

  private analyzePVPFactors(features: PvPFeatures, prediction: number): PvPPrediction['factors'] {
    const factors = [];

    // IP Advantage
    const ipDiff = features.killerAvgIP - features.victimAvgIP;
    factors.push({
      name: 'IP Advantage',
      impact: Math.tanh(ipDiff / 200) * (prediction > 0.5 ? 1 : -1),
      description: `${ipDiff > 0 ? '+' : ''}${ipDiff.toFixed(0)} IP advantage`,
    });

    // Guild Size
    const guildDiff = features.killerGuildSize - features.victimGuildSize;
    factors.push({
      name: 'Guild Size',
      impact: Math.tanh(guildDiff / 20) * (prediction > 0.5 ? 1 : -1),
      description: `${guildDiff > 0 ? '+' : ''}${guildDiff} member advantage`,
    });

    // Quality Difference
    factors.push({
      name: 'Gear Quality',
      impact: features.qualityDifference * 0.2 * (prediction > 0.5 ? 1 : -1),
      description: `${features.qualityDifference > 0 ? '+' : ''}${features.qualityDifference} quality levels`,
    });

    // Time of Day
    const timeBonus = features.timeOfDay >= 18 && features.timeOfDay <= 22 ? 0.1 : 0;
    factors.push({
      name: 'Peak Hours',
      impact: timeBonus * (prediction > 0.5 ? 1 : -1),
      description: 'Evening peak activity',
    });

    return factors;
  }

  private analyzeMarketFactors(
    features: MarketFeatures,
    _prediction: number
  ): MarketPrediction['factors'] {
    const factors = [];
    const currentTrend =
      features.priceHistory.length > 1
        ? (features.priceHistory[features.priceHistory.length - 1] - features.priceHistory[0]) /
          features.priceHistory[0]
        : 0;

    factors.push({
      name: 'Price Trend',
      impact: currentTrend,
      description: `${(currentTrend * 100).toFixed(1)}% recent trend`,
    });

    factors.push({
      name: 'Volatility',
      impact: -this.calculateVolatility(features.priceHistory), // Lower volatility is positive for prediction confidence
      description: `${(this.calculateVolatility(features.priceHistory) * 100).toFixed(1)}% volatility`,
    });

    factors.push({
      name: 'Volume',
      impact: Math.tanh(features.volumeHistory[features.volumeHistory.length - 1] / 50) * 0.5,
      description: `${features.volumeHistory[features.volumeHistory.length - 1]} recent volume`,
    });

    return factors;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) {
      return 0;
    }

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private getBuildName(buildId: string): string {
    // Mock build names - in real implementation, this would come from a database
    const buildNames: Record<string, string> = {
      sword_axe: 'Sword & Axe Hybrid',
      caster_staff: 'Caster Staff Build',
      plate_armor: 'Heavy Plate Tank',
      mobility_quarterstaff: 'Mobility Quarterstaff',
      bow_hunters: 'Hunter Bow Build',
      hammer_shield: 'Hammer & Shield Tank',
      fire_staff: 'Fire Staff DPS',
      frost_staff: 'Frost Staff CC',
      dagger_rogue: 'Dagger Rogue',
      spear_lancer: 'Spear Lancer',
    };

    return buildNames[buildId] || `Build ${buildId}`;
  }
}

export const mlAnalyticsService = MLAnalyticsService.getInstance();
