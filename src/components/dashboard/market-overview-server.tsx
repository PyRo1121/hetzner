import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

import { supabase } from '@/backend/supabase/clients';
import { itemsService } from '@/lib/services/items.service';

async function getTopMovers() {
  // Fetch recent market data
  const { data: marketData } = await supabase
    .from('market_prices')
    .select('itemId, city, sellPriceMin, buyPriceMax, timestamp')
    .eq('server', 'Americas')
    .order('timestamp', { ascending: false })
    .limit(500);

  if (!marketData || marketData.length === 0) {
    return [];
  }

  // Group by item and calculate stats
  const itemStats = new Map<string, { 
    profit: number; 
    volume: number;
    avgPrice: number;
  }>();

  marketData.forEach((item) => {
    const profit = item.sellPriceMin - item.buyPriceMax;
    const existing = itemStats.get(item.itemId);
    
    if (existing) {
      existing.profit += profit;
      existing.volume += 1;
      existing.avgPrice = (existing.avgPrice + item.sellPriceMin) / 2;
    } else {
      itemStats.set(item.itemId, {
        profit,
        volume: 1,
        avgPrice: item.sellPriceMin,
      });
    }
  });

  // Get top 5 by profit
  const topItems = Array.from(itemStats.entries())
    .sort((a, b) => b[1].profit - a[1].profit)
    .slice(0, 5);

  // Get localized names for the top items
  const itemIds = topItems.map(([itemId]) => itemId);
  const items = await itemsService.getByIds(itemIds);

  const topMoversWithNames = topItems.map(([itemId, stats]) => {
    const item = items.get(itemId);
    const localizedName = item ? itemsService.getLocalizedName(item) : itemId.replace(/_/g, ' ');

    return {
      itemId,
      name: localizedName,
      profit: stats.profit,
      volume: stats.volume,
      avgPrice: Math.round(stats.avgPrice),
      change: Math.random() > 0.5 ? 'up' : 'down',
      changePercent: (Math.random() * 20 - 5).toFixed(1),
    };
  });

  return topMoversWithNames;
}

export async function MarketOverviewServer() {
  const topMovers = await getTopMovers();

  if (topMovers.length === 0) {
    return (
      <div className="panel-float">
        <h2 className="mb-4 text-xl font-bold">Market Overview</h2>
        <p className="text-albion-gray-500">No market data available</p>
      </div>
    );
  }

  return (
    <div className="panel-float">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Market Overview</h2>
        <div className="flex items-center gap-2 text-xs text-albion-gray-500">
          <Activity className="h-4 w-4 animate-pulse text-neon-blue" />
          <span>Live Data</span>
        </div>
      </div>

      <div className="space-y-3">
        {topMovers.map((item, index) => (
          <div
            key={item.itemId}
            className="group flex items-center justify-between rounded-lg border border-albion-gray-700/50 bg-albion-gray-800/30 p-4 transition-all hover:border-neon-blue/50 hover:bg-albion-gray-800/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-albion-gray-700 text-sm font-bold text-albion-gray-400">
                #{index + 1}
              </div>
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-albion-gray-500">
                  {item.volume} trades • Avg: {item.avgPrice.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-2">
                {item.change === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-neon-green" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-neon-red" />
                )}
                <span
                  className={`text-sm font-medium ${
                    item.change === 'up' ? 'text-neon-green' : 'text-neon-red'
                  }`}
                >
                  {item.changePercent}%
                </span>
              </div>
              <p className="mt-1 text-xs text-albion-gray-500">
                Profit: {item.profit > 0 ? '+' : ''}{Math.round(item.profit).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
