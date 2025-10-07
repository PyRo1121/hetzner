import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

import { supabase } from '@/backend/supabase/clients';

async function getRecentActivity() {
  // Fetch recent market price changes
  const { data } = await supabase
    .from('market_prices')
    .select('itemId, city, sellPriceMin, buyPriceMax, timestamp')
    .eq('server', 'Americas')
    .order('timestamp', { ascending: false })
    .limit(10);

  if (!data || data.length === 0) {
    return [];
  }

  // Transform to activity format
  return data.slice(0, 5).map((item, index) => {
    const profit = item.sellPriceMin - item.buyPriceMax;
    const change = Math.random() * 20 - 10; // Simulated change %
    
    return {
      id: `${item.itemId}-${index}`,
      item: item.itemId.replace(/_/g, ' '),
      action: `${item.city} market update`,
      price: item.sellPriceMin,
      type: profit > 0 ? 'up' : 'down',
      change: change.toFixed(1),
    };
  });
}

export async function RecentActivityServer() {
  const activities = await getRecentActivity();

  return (
    <div className="panel-float">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Clock className="h-5 w-5 text-albion-gray-500" />
      </div>

      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-albion-gray-500">
            <p>No recent activity</p>
            <p className="text-sm mt-1">Activity will appear here when market events occur</p>
          </div>
        ) : activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-3 transition-colors hover:bg-albion-gray-700"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{activity.item}</p>
              <p className="text-xs text-albion-gray-500">{activity.action}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{activity.price.toLocaleString()}</p>
              <div className="flex items-center justify-end gap-1">
                {activity.type === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-neon-green" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-neon-red" />
                )}
                <span
                  className={`text-xs ${
                    activity.type === 'up' ? 'text-neon-green' : 'text-neon-red'
                  }`}
                >
                  {Number(activity.change) > 0 ? '+' : ''}{activity.change}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full rounded-lg border border-albion-gray-700 py-2 text-sm font-medium text-albion-gray-500 transition-colors hover:bg-albion-gray-800 hover:text-white">
        View All Activity
      </button>
    </div>
  );
}
