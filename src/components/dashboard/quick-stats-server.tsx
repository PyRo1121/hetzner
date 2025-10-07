import { cache } from 'react';

import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

import { supabase } from '@/backend/supabase/clients';

// Cache the stats query with React cache()
const getMarketStats = cache(async () => {
  const { data: marketData } = await supabase
    .from('market_prices')
    .select('itemId, city, sellPriceMin, buyPriceMax')
    .eq('server', 'Americas')
    .order('timestamp', { ascending: false })
    .limit(1000);

  if (!marketData || marketData.length === 0) {
    return {
      activeMarkets: 0,
      totalItems: 0,
      hotItems: 0,
      profitOpportunities: 0,
    };
  }

  const uniqueCities = new Set(marketData.map(p => p.city)).size;
  const uniqueItems = new Set(marketData.map(p => p.itemId)).size;
  const hotItems = marketData.filter(p => p.sellPriceMin > 0 && p.buyPriceMax > 0).length;
  const profitOpportunities = marketData.filter(
    p => p.sellPriceMin > 0 && p.buyPriceMax > 0 && (p.sellPriceMin - p.buyPriceMax) > 0
  ).length;

  return {
    activeMarkets: uniqueCities,
    totalItems: uniqueItems,
    hotItems,
    profitOpportunities,
  };
});

export async function QuickStatsServer() {
  const stats = await getMarketStats();

  const statCards = [
    {
      name: 'Active Markets',
      value: stats.activeMarkets.toString(),
      change: '+100%',
      trend: 'up' as const,
      icon: Activity,
      color: 'text-neon-blue',
    },
    {
      name: 'Total Items',
      value: stats.totalItems.toLocaleString(),
      change: '+15%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-neon-gold',
    },
    {
      name: 'Hot Items',
      value: stats.hotItems.toLocaleString(),
      change: '+23%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-neon-green',
    },
    {
      name: 'Profit Opportunities',
      value: stats.profitOpportunities.toLocaleString(),
      change: '+8%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-neon-purple',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className="panel-float group relative overflow-hidden transition-all duration-300 hover:scale-105"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className={`absolute inset-0 blur-xl ${stat.color} opacity-20`} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-albion-gray-500">{stat.name}</p>
              <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              <div className="mt-2 flex items-center gap-1">
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-neon-green" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-neon-red" />
                )}
                <span
                  className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-neon-green' : 'text-neon-red'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
            <div className={`rounded-lg bg-albion-gray-800 p-3 ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
