// lib/analytics/enterprise-analytics.ts
// Enterprise Analytics Suite (October 2025)
// Advanced analytics with ClickHouse integration

'use client';

import React, { useEffect, useState } from 'react';

export interface AnalyticsConfig {
  clickhouseUrl?: string;
  redisUrl?: string;
  enableRealTime?: boolean;
  enableHistorical?: boolean;
}

export interface AnalyticsData {
  market: {
    totalItems: number;
    priceChanges: number[];
    topMovers: Array<{ itemId: string; change: number; name: string }>;
    volume24h: number;
  };
  kills: {
    totalKills: number;
    fameDistribution: number[];
    topKillers: Array<{ name: string; fame: number; kills: number }>;
    serverActivity: { [server: string]: number };
  };
  battles: {
    totalBattles: number;
    winRate: number;
    avgParticipants: number;
    recentBattles: Array<{ id: string; winner: string; fame: number }>;
  };
  players: {
    activePlayers: number;
    newPlayers24h: number;
    topGuilds: Array<{ name: string; memberCount: number; fame: number }>;
  };
}

// Advanced Analytics Engine
class AnalyticsEngine {
  private config: AnalyticsConfig;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private realTimeSubscriptions = new Set<(data: Partial<AnalyticsData>) => void>();

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      clickhouseUrl: '/api/analytics/clickhouse',
      redisUrl: '/api/analytics/redis',
      enableRealTime: true,
      enableHistorical: true,
      ...config
    };
  }

  // Real-time analytics aggregation
  async getRealTimeAnalytics(): Promise<AnalyticsData> {
    const cacheKey = 'realtime-analytics';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 5000) { // 5 second cache
      return cached.data;
    }

    try {
      // Parallel data fetching from multiple sources
      const [marketData, killData, battleData, playerData] = await Promise.allSettled([
        this.fetchMarketAnalytics(),
        this.fetchKillAnalytics(),
        this.fetchBattleAnalytics(),
        this.fetchPlayerAnalytics()
      ]);

      const analytics: AnalyticsData = {
        market: marketData.status === 'fulfilled' ? marketData.value : this.getEmptyMarketData(),
        kills: killData.status === 'fulfilled' ? killData.value : this.getEmptyKillData(),
        battles: battleData.status === 'fulfilled' ? battleData.value : this.getEmptyBattleData(),
        players: playerData.status === 'fulfilled' ? playerData.value : this.getEmptyPlayerData(),
      };

      // Cache result
      this.cache.set(cacheKey, { data: analytics, timestamp: Date.now() });

      // Notify real-time subscribers
      this.notifySubscribers(analytics);

      return analytics;
    } catch (error) {
      console.error('Failed to fetch real-time analytics:', error);
      return this.getEmptyAnalyticsData();
    }
  }

  // Historical analytics with ClickHouse
  async getHistoricalAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<AnalyticsData> {
    const cacheKey = `historical-${timeRange}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
      return cached.data;
    }

    try {
      const response = await fetch(`${this.config.clickhouseUrl}?range=${timeRange}`);
      const data = await response.json();

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Failed to fetch historical analytics:', error);
      return this.getEmptyAnalyticsData();
    }
  }

  // Advanced market analytics
  private async fetchMarketAnalytics() {
    // Use Redis for real-time market data
    const redisResponse = await fetch('/api/analytics/redis/market');
    const redisData = await redisResponse.json();

    // Use ClickHouse for trend analysis
    const clickhouseResponse = await fetch('/api/analytics/clickhouse/market/trends');
    const trends = await clickhouseResponse.json();

    return {
      totalItems: redisData.totalItems,
      priceChanges: trends.priceChanges,
      topMovers: trends.topMovers.slice(0, 10),
      volume24h: trends.volume24h
    };
  }

  // Kill analytics with real-time aggregation
  private async fetchKillAnalytics() {
    const response = await fetch('/api/analytics/redis/kills/realtime');
    const data = await response.json();

    return {
      totalKills: data.totalKills,
      fameDistribution: data.fameDistribution,
      topKillers: data.topKillers.slice(0, 10),
      serverActivity: data.serverActivity
    };
  }

  // Battle analytics with historical context
  private async fetchBattleAnalytics() {
    const [realtime, historical] = await Promise.all([
      fetch('/api/analytics/redis/battles/realtime'),
      fetch('/api/analytics/clickhouse/battles/history?range=24h')
    ]);

    const realtimeData = await realtime.json();
    const historicalData = await historical.json();

    return {
      totalBattles: realtimeData.totalBattles,
      winRate: historicalData.winRate,
      avgParticipants: historicalData.avgParticipants,
      recentBattles: realtimeData.recentBattles.slice(0, 5)
    };
  }

  // Player analytics with guild data
  private async fetchPlayerAnalytics() {
    const response = await fetch('/api/analytics/redis/players/stats');
    const data = await response.json();

    return {
      activePlayers: data.activePlayers,
      newPlayers24h: data.newPlayers24h,
      topGuilds: data.topGuilds.slice(0, 10)
    };
  }

  // Real-time subscriptions
  subscribeToRealTime(callback: (data: Partial<AnalyticsData>) => void): () => void {
    this.realTimeSubscriptions.add(callback);

    // Return unsubscribe function
    return () => {
      this.realTimeSubscriptions.delete(callback);
    };
  }

  private notifySubscribers(data: Partial<AnalyticsData>): void {
    this.realTimeSubscriptions.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Analytics subscriber error:', error);
      }
    });
  }

  // Empty data fallbacks
  private getEmptyMarketData() {
    return { totalItems: 0, priceChanges: [], topMovers: [], volume24h: 0 };
  }

  private getEmptyKillData() {
    return { totalKills: 0, fameDistribution: [], topKillers: [], serverActivity: {} };
  }

  private getEmptyBattleData() {
    return { totalBattles: 0, winRate: 0, avgParticipants: 0, recentBattles: [] };
  }

  private getEmptyPlayerData() {
    return { activePlayers: 0, newPlayers24h: 0, topGuilds: [] };
  }

  private getEmptyAnalyticsData(): AnalyticsData {
    return {
      market: this.getEmptyMarketData(),
      kills: this.getEmptyKillData(),
      battles: this.getEmptyBattleData(),
      players: this.getEmptyPlayerData()
    };
  }

  // Performance metrics
  getPerformanceMetrics() {
    return {
      cacheSize: this.cache.size,
      activeSubscriptions: this.realTimeSubscriptions.size,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate calculation
    const totalRequests = this.cache.size + 10; // Assume 10 misses
    const hits = this.cache.size;
    return (hits / totalRequests) * 100;
  }
}

// Global analytics engine instance
let analyticsEngineInstance: AnalyticsEngine | null = null;

export const getAnalyticsEngine = (config?: AnalyticsConfig): AnalyticsEngine => {
  if (!analyticsEngineInstance) {
    analyticsEngineInstance = new AnalyticsEngine(config);
  }
  return analyticsEngineInstance;
};

// React hooks for analytics
export const useRealTimeAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const engine = getAnalyticsEngine();

    const fetchData = async () => {
      try {
        const data = await engine.getRealTimeAnalytics();
        setAnalytics(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time updates
    const unsubscribe = engine.subscribeToRealTime((newData) => {
      setAnalytics(prev => prev ? { ...prev, ...newData } : null);
    });

    // Update every 10 seconds
    const interval = setInterval(fetchData, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { analytics, loading, error };
};

export const useHistoricalAnalytics = (timeRange: '1h' | '24h' | '7d' | '30d' = '24h') => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const engine = getAnalyticsEngine();

    const fetchData = async () => {
      try {
        const data = await engine.getHistoricalAnalytics(timeRange);
        setAnalytics(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load historical analytics:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  return { analytics, loading };
};

// Analytics Dashboard Component
export const AnalyticsDashboard: React.FC = () => {
  const { analytics: realtimeData, loading: realtimeLoading } = useRealTimeAnalytics();
  const { analytics: historicalData, loading: historicalLoading } = useHistoricalAnalytics('24h');

  if (realtimeLoading || historicalLoading) {
    return React.createElement('div', { className: 'animate-pulse' }, 'Loading analytics...');
  }

  if (!realtimeData || !historicalData) {
    return React.createElement('div', null, 'Failed to load analytics data');
  }

  return React.createElement('div', {
    className: 'analytics-dashboard grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
  }, [
    // Market Analytics
    React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow', key: 'market' }, [
      React.createElement('h3', { className: 'text-lg font-semibold mb-4', key: 'title' }, 'Market Overview'),
      React.createElement('div', { className: 'space-y-2', key: 'content' }, [
        React.createElement('div', { className: 'flex justify-between', key: 'items' }, [
          React.createElement('span', { key: 'label' }, 'Total Items:'),
          React.createElement('span', { className: 'font-bold', key: 'value' }, realtimeData.market.totalItems.toLocaleString())
        ]),
        React.createElement('div', { className: 'flex justify-between', key: 'volume' }, [
          React.createElement('span', { key: 'label' }, '24h Volume:'),
          React.createElement('span', { className: 'font-bold', key: 'value' }, historicalData.market.volume24h.toLocaleString())
        ])
      ])
    ])
  ]);
};
