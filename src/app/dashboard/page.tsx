import { Suspense } from 'react';

import dynamic from 'next/dynamic';

import { Activity, TrendingUp, Zap } from 'lucide-react';

import { GoldPriceServer } from '@/components/dashboard/gold-price-server';
import { MarketOverviewServer } from '@/components/dashboard/market-overview-server';
import { PriceHeatmapWrapper } from '@/components/dashboard/price-heatmap-wrapper';
import { PvPWidgetServer } from '@/components/dashboard/pvp-widget-server';
import { QuickStatsServer } from '@/components/dashboard/quick-stats-server';
import { RecentActivityServer } from '@/components/dashboard/recent-activity-server';
import { CardSkeleton } from '@/components/ui/skeleton';
import { ServerStatusServer } from '@/components/widgets/server-status-server';

const MarketTicker = dynamic(
  () => import('@/components/widgets/market-ticker').then(mod => ({ default: mod.MarketTicker })),
  {
    loading: () => <div className="panel-float h-12 animate-pulse" />,
  }
);

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Albion Online Omni-Dashboard',
  description: 'Real-time market intelligence and trading insights',
};

// Revalidate every 60 seconds
export const revalidate = 60;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neon-blue/20 via-neon-purple/10 to-transparent p-8 backdrop-blur-sm border border-neon-blue/20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 h-96 w-96 rounded-full bg-neon-blue/10 blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 h-96 w-96 rounded-full bg-neon-purple/10 blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-neon-blue/20 backdrop-blur-sm border border-neon-blue/30">
              <Activity className="h-6 w-6 text-neon-blue" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-neon-blue to-neon-purple bg-clip-text text-transparent">
                Market Intelligence Hub
              </h1>
              <p className="text-albion-gray-400 mt-1">
                Real-time insights from <span className="text-neon-blue font-semibold">15M+</span> market data points
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button className="px-4 py-2 rounded-lg bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/30 text-neon-blue font-medium transition-all hover:scale-105 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Opportunities
            </button>
            <button className="px-4 py-2 rounded-lg bg-albion-gray-800/50 hover:bg-albion-gray-700 border border-albion-gray-700 text-white font-medium transition-all hover:scale-105 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Market Ticker - Enhanced */}
      <div className="relative">
        <MarketTicker />
      </div>

      {/* Quick Stats - Server Component with Streaming */}
      <Suspense fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel-float h-32 animate-pulse" />
          ))}
        </div>
      }>
        <QuickStatsServer />
      </Suspense>

      {/* Main Dashboard Grid - Improved Layout */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left Column - Market Overview & Heatmap */}
        <div className="xl:col-span-8 space-y-6">
          {/* Market Overview - Server Component */}
          <Suspense fallback={<CardSkeleton />}>
            <MarketOverviewServer />
          </Suspense>

          {/* Price Heatmap - Enhanced */}
          <Suspense fallback={<div className="panel-float h-[500px] animate-pulse" />}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-2xl blur-xl" />
              <div className="relative">
                <PriceHeatmapWrapper />
              </div>
            </div>
          </Suspense>
        </div>

        {/* Right Sidebar - Widgets */}
        <div className="xl:col-span-4 space-y-6">
          {/* Server Status - Server Component */}
          <Suspense fallback={<div className="panel-float h-48 animate-pulse" />}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-green/20 to-neon-blue/20 rounded-2xl blur-lg" />
              <div className="relative">
                <ServerStatusServer />
              </div>
            </div>
          </Suspense>
          
          {/* Gold Price Widget - Server Component */}
          <Suspense fallback={<div className="panel-float h-48 animate-pulse" />}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-gold/20 to-neon-blue/20 rounded-2xl blur-lg" />
              <div className="relative">
                <GoldPriceServer />
              </div>
            </div>
          </Suspense>

          {/* PvP Widget - Server Component */}
          <Suspense fallback={<div className="panel-float h-64 animate-pulse" />}>
            <PvPWidgetServer />
          </Suspense>

          {/* Recent Activity - Server Component */}
          <Suspense fallback={<div className="panel-float h-64 animate-pulse" />}>
            <RecentActivityServer />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
