'use client';

import { Suspense, useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { ArrowLeftRight, BarChart3, DollarSign, TrendingUp } from 'lucide-react';

import { ArbitrageCalculator } from '@/components/market/arbitrage-calculator';
import { MarketFilters } from '@/components/market/market-filters';
import { MarketMLAnalytics } from '@/components/market/MarketMLAnalytics';
import { PriceTable } from '@/components/market/price-table';

type TabType = 'prices' | 'arbitrage' | 'trends';

export default function MarketPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('prices');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Caerleon', 'Bridgewatch']);
  const [selectedQualities, setSelectedQualities] = useState<number[]>([1, 2, 3, 4, 5]);
  const [selectedTier, setSelectedTier] = useState<string>('All');

  // Handle search from header
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      setActiveTab('prices');
    }
  }, [searchParams]);

  const tabs = [
    { id: 'prices' as TabType, label: 'Market Prices', icon: DollarSign },
    { id: 'arbitrage' as TabType, label: 'Arbitrage', icon: ArrowLeftRight },
    { id: 'trends' as TabType, label: 'Price Trends', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-neon-green/20 bg-gradient-to-br from-neon-green/20 via-neon-blue/10 to-transparent p-8 backdrop-blur-sm">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-1/2 -top-1/2 h-96 w-96 animate-pulse rounded-full bg-neon-green/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl border border-neon-green/30 bg-neon-green/20 p-3 backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 text-neon-green" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-white via-neon-green to-neon-blue bg-clip-text text-4xl font-bold text-transparent">
                Market Intelligence
              </h1>
              <p className="text-albion-gray-400 mt-1">
                Real-time prices from <span className="font-semibold text-neon-green">15M+</span>{' '}
                data points across all cities
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="panel-float p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg shadow-neon-blue/50'
                    : 'text-albion-gray-400 bg-albion-gray-800/50 hover:bg-albion-gray-700 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'prices' ? (
        <>
          {/* Filters */}
          <Suspense fallback={<div className="panel-float h-32 animate-pulse" />}>
            <MarketFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCities={selectedCities}
              onCitiesChange={setSelectedCities}
              selectedQualities={selectedQualities}
              onQualitiesChange={setSelectedQualities}
              selectedTier={selectedTier}
              onTierChange={setSelectedTier}
            />
          </Suspense>

          {/* Price Table */}
          <Suspense fallback={<div className="panel-float h-96 animate-pulse" />}>
            <PriceTable
              searchTerm={searchTerm}
              selectedCities={selectedCities}
              selectedQualities={selectedQualities}
              selectedTier={selectedTier}
            />
          </Suspense>
        </>
      ) : null}

      {activeTab === 'arbitrage' ? (
        <Suspense fallback={<div className="panel-float h-96 animate-pulse" />}>
          <ArbitrageCalculator />
        </Suspense>
      ) : null}

      {activeTab === 'trends' ? (
        <div className="space-y-6">
          {/* ML Analytics Section */}
          <MarketMLAnalytics
            features={{
              itemId: searchTerm || 'T4_BAG',
              city: selectedCities[0] || 'Caerleon',
              quality: selectedQualities[0] || 1,
              currentPrice: 1000, // This would come from actual market data
              priceHistory: [950, 980, 1020, 990, 1050, 1000, 1030], // Last 7 days
              volumeHistory: [100, 120, 95, 110, 130, 105, 115], // Last 7 days
              timeOfDay: new Date().getHours(),
              dayOfWeek: new Date().getDay(),
            }}
          />

          {/* Additional Trend Analysis */}
          <div className="panel-float p-8">
            <div className="text-center">
              <BarChart3 className="mx-auto mb-4 h-16 w-16 text-neon-purple" />
              <h2 className="mb-2 text-2xl font-bold">Advanced Price Trends</h2>
              <p className="text-albion-gray-400 mb-6">
                Historical price analysis and market patterns
              </p>
              <div className="inline-block rounded-lg border border-neon-purple/30 bg-neon-purple/20 px-4 py-2 text-neon-purple">
                Coming soon - Enhanced trend visualization
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
