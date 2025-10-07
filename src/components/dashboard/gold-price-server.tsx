import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

import { supabase } from '@/backend/supabase/clients';

async function getGoldPrice() {
  const { data } = await supabase
    .from('gold_prices')
    .select('price, timestamp')
    .order('timestamp', { ascending: false })
    .limit(2);

  if (!data || data.length === 0) {
    return { price: 0, change: 0, isPositive: true };
  }

  const latestPrice = data[0];
  const previousPrice = data[1];
  
  const price = latestPrice?.price || 0;
  const change = latestPrice && previousPrice 
    ? ((latestPrice.price - previousPrice.price) / previousPrice.price) * 100
    : 0;
  const isPositive = change >= 0;

  return { price, change, isPositive };
}

export async function GoldPriceServer() {
  const { price: goldPrice, change, isPositive } = await getGoldPrice();

  return (
    <div className="panel-float">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gold Price</h3>
        <div className="rounded-lg bg-neon-gold/10 p-2">
          <DollarSign className="h-5 w-5 text-neon-gold" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Price */}
        <div>
          <p className="text-sm text-albion-gray-500">Current Rate</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neon-gold">{goldPrice.toLocaleString()}</span>
            <span className="text-sm text-albion-gray-500">silver</span>
          </div>
        </div>

        {/* Change */}
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-neon-green" />
          ) : (
            <TrendingDown className="h-4 w-4 text-neon-red" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)}% (24h)
          </span>
        </div>

        {/* Mini Chart Placeholder */}
        <div className="h-16 rounded-lg bg-albion-gray-800 p-2">
          <div className="flex h-full items-end justify-between gap-1">
            {[40, 55, 45, 60, 50, 65, 58, 70, 65, 75, 68, 72].map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className="flex-1 rounded-sm bg-neon-gold/50"
              />
            ))}
          </div>
        </div>

        {/* Info Note */}
        <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-3">
          <p className="text-xs text-albion-gray-500">
            Real-time gold prices from Albion market data
          </p>
        </div>
      </div>
    </div>
  );
}
