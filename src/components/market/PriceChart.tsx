'use client';

import { useEffect, useState } from 'react';

import { Calendar, MapPin, TrendingUp } from 'lucide-react';

import { marketService } from '@/lib/services/market.service';

interface PriceChartProps {
  itemId: string;
  city?: string;
  quality?: number;
  days?: number;
}

interface PriceData {
  timestamp: string;
  avgPrice: number;
  itemCount: number;
}

export function PriceChart({ itemId, city = 'Caerleon', quality = 1, days = 7 }: PriceChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPriceHistory = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await marketService.getPriceHistoryFromAPI(itemId, {
          city,
          quality,
          days,
        });
        setPriceData(data);
      } catch (err) {
        setError('Failed to load price history');
        console.error('Price history error:', err);
      } finally {
        setLoading(false);
      }
    };

    void loadPriceHistory();
  }, [itemId, city, quality, days]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    }
    return price.toLocaleString();
  };

  const getPriceChange = () => {
    if (priceData.length < 2) {
      return null;
    }

    const latest = priceData[priceData.length - 1].avgPrice;
    const previous = priceData[priceData.length - 2].avgPrice;
    const change = ((latest - previous) / previous) * 100;

    return {
      value: change,
      isPositive: change > 0,
      formatted: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    };
  };

  const priceChange = getPriceChange();

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-neon-blue" />
          <div>
            <h3 className="text-xl font-bold">Price History</h3>
            <p className="text-sm text-albion-gray-500">
              {itemId} in {city}
            </p>
          </div>
        </div>

        {priceChange ? (
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold ${
                priceChange.isPositive ? 'text-neon-green' : 'text-neon-red'
              }`}
            >
              {priceChange.formatted}
            </span>
            <TrendingUp
              className={`h-5 w-5 ${
                priceChange.isPositive ? 'text-neon-green' : 'text-neon-red'
              } ${priceChange.isPositive ? '' : 'rotate-180'}`}
            />
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/20 p-4 text-red-400">
          {error}
        </div>
      ) : null}

      {/* Chart Placeholder - Will replace with recharts */}
      <div className="mb-6 flex h-64 items-center justify-center rounded-lg bg-albion-gray-800">
        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neon-blue" />
        ) : (
          <div className="text-center text-albion-gray-500">
            <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>Chart visualization</p>
            <p className="text-sm">Install recharts for full chart</p>
          </div>
        )}
      </div>

      {/* Price Stats */}
      {!loading && priceData.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="text-center">
            <div className="text-albion-gray-400 mb-1 text-sm">Current Price</div>
            <div className="text-lg font-bold text-white">
              {formatPrice(priceData[priceData.length - 1].avgPrice)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-albion-gray-400 mb-1 text-sm">24h High</div>
            <div className="text-lg font-bold text-neon-green">
              {formatPrice(Math.max(...priceData.slice(-24).map((d) => d.avgPrice)))}
            </div>
          </div>

          <div className="text-center">
            <div className="text-albion-gray-400 mb-1 text-sm">24h Low</div>
            <div className="text-lg font-bold text-neon-red">
              {formatPrice(Math.min(...priceData.slice(-24).map((d) => d.avgPrice)))}
            </div>
          </div>

          <div className="text-center">
            <div className="text-albion-gray-400 mb-1 text-sm">Volume</div>
            <div className="text-lg font-bold text-neon-blue">
              {priceData
                .slice(-24)
                .reduce((sum, d) => sum + d.itemCount, 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="mt-6 border-t border-albion-gray-700 pt-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-albion-gray-500" />
            <select
              value={city}
              onChange={() => {
                /* TODO: Update city */
              }}
              className="rounded border border-albion-gray-700 bg-albion-gray-800 px-2 py-1 text-white"
            >
              <option value="Caerleon">Caerleon</option>
              <option value="Bridgewatch">Bridgewatch</option>
              <option value="Lymhurst">Lymhurst</option>
              <option value="Martlock">Martlock</option>
              <option value="Fort Sterling">Fort Sterling</option>
              <option value="Thetford">Thetford</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-albion-gray-500" />
            <select
              value={days}
              onChange={() => {
                /* TODO: Update days */
              }}
              className="rounded border border-albion-gray-700 bg-albion-gray-800 px-2 py-1 text-white"
            >
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
