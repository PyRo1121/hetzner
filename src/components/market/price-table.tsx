'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';

import { ArrowUpDown, ExternalLink, TrendingDown, TrendingUp } from 'lucide-react';

import { useItemsByIds } from '@/hooks/use-items';
import { useMarketPrices } from '@/hooks/use-market-prices';
import { getItemImageUrlOptimized } from '@/lib/utils/image-urls';

// Real data will be fetched via React Query hooks
// For now, using a simple example structure
type PriceData = {
  id: string;
  itemId: string; // Add itemId for image rendering
  name: string;
  tier: number;
  city: string;
  quality: number;
  sellPriceMin: number;
  buyPriceMax: number;
  profit: number;
  roi: number;
  timestamp: string;
};

type SortField = 'name' | 'tier' | 'sellPriceMin' | 'buyPriceMax' | 'profit' | 'roi';
type SortDirection = 'asc' | 'desc';

interface PriceTableProps {
  searchTerm?: string;
  selectedCities?: string[];
  selectedQualities?: number[];
  selectedTier?: string;
}

export function PriceTable({
  searchTerm = '',
  selectedCities = ['Caerleon', 'Bridgewatch', 'Lymhurst'],
  selectedQualities = [1, 2, 3, 4, 5],
  selectedTier = 'All',
}: PriceTableProps) {
  const [sortField, setSortField] = useState<SortField>('profit');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch real market prices from database with filters
  // When searching, we pass searchTerm to query DB directly
  const { data: marketData, isLoading } = useMarketPrices({
    locations: selectedCities,
    qualities: selectedQualities.map(String),
    searchTerm, // Pass search term to query DB
    // No limit needed - hook will use 300 for initial load, 20000 when searching
  });

  // Helper to format item ID as readable name (fallback)
  const formatItemId = (id: string): string => {
    return id
      .replace(/^T\d+_/, '') // Remove tier prefix
      .replace(/@\d+$/, '') // Remove enchantment suffix
      .replace(/^MAIN_|^2H_|^OFF_/, '') // Remove weapon prefixes
      .replace(/^ARMOR_|^HEAD_|^SHOES_/, '') // Remove armor prefixes
      .replace(/^CAPEITEM_/, '') // Remove cape prefix
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize words
  };

  // Get unique item IDs from market data
  const uniqueItemIds = marketData ? [...new Set(marketData.map((p) => p.itemId))] : [];

  // Load localized item names using the client-side hook
  const { data: items } = useItemsByIds(uniqueItemIds);

  // Transform to table format and deduplicate by keeping best prices
  const tableData = useMemo(() => {
    if (!marketData || marketData.length === 0) {
      return [];
    }

    // Group by itemId and keep best prices
    const grouped = new Map<string, any>();

    for (const price of marketData) {
      const existing = grouped.get(price.itemId);
      if (!existing || price.sellPriceMin < existing.sellPriceMin) {
        // Create a complete PriceData-like object
        const itemData = items?.get(price.itemId);
        const localizedName = itemData ? itemData.name : null;
        const displayName = localizedName ?? formatItemId(price.itemId);

        const completePriceData = {
          id: `${price.itemId}-${price.city}-${price.quality}`,
          itemId: price.itemId,
          name: displayName,
          tier: parseInt(price.itemId.match(/T(\d)/)?.[1] ?? '4'),
          city: price.city,
          quality: price.quality,
          sellPriceMin: price.sellPriceMin,
          buyPriceMax: price.buyPriceMax,
          profit: price.buyPriceMax > 0 ? price.sellPriceMin - price.buyPriceMax : 0,
          roi:
            price.buyPriceMax > 0
              ? ((price.sellPriceMin - price.buyPriceMax) / price.buyPriceMax) * 100
              : 0,
          timestamp: price.timestamp,
        };
        grouped.set(price.itemId, completePriceData);
      }
    }

    return Array.from(grouped.values()).map((price) => {
      // Get localized name or format the ID as fallback
      const itemData = items?.get(price.itemId);
      const localizedName = itemData ? itemData.name : null;
      const displayName = localizedName ?? formatItemId(price.itemId);

      return {
        id: `${price.itemId}-${price.city}-${price.quality}`,
        itemId: price.itemId,
        name: displayName,
        tier: parseInt(price.itemId.match(/T(\d)/)?.[1] ?? '4'),
        city: price.city,
        quality: price.quality,
        sellPriceMin: price.sellPriceMin,
        buyPriceMax: price.buyPriceMax,
        profit: price.buyPriceMax > 0 ? price.sellPriceMin - price.buyPriceMax : 0,
        roi:
          price.buyPriceMax > 0
            ? ((price.sellPriceMin - price.buyPriceMax) / price.buyPriceMax) * 100
            : 0,
        timestamp: price.timestamp,
      };
    });
  }, [marketData, items]);

  const prices: PriceData[] = tableData;

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter by search term and tier
  const filteredPrices = prices.filter((price) => {
    // Search filter
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      const nameMatch = price.name.toLowerCase().includes(searchLower);
      const idMatch = price.itemId.toLowerCase().includes(searchLower);

      if (!nameMatch && !idMatch) {
        return false;
      }
    }

    // Tier filter
    if (selectedTier !== 'All') {
      const tierNum = selectedTier.replace('T', '');
      if (price.tier.toString() !== tierNum) {
        return false;
      }
    }

    return true;
  });

  const sortedPrices = [...filteredPrices].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return aValue > bValue ? modifier : -modifier;
  });

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="py-12 text-center">
          <p className="text-albion-gray-400 mb-2">Loading market data...</p>
          <p className="text-sm text-albion-gray-500">Fetching latest prices from database</p>
        </div>
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div className="panel-float">
        <div className="py-12 text-center">
          <p className="text-albion-gray-400 mb-2">No market data available</p>
          <p className="text-sm text-albion-gray-500">Waiting for data sync to populate prices</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float overflow-hidden">
      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-albion-gray-700 px-4 py-3">
        <div>
          <p className="text-albion-gray-400 text-sm">
            Showing <span className="font-semibold text-neon-blue">{sortedPrices.length}</span> of{' '}
            <span className="font-semibold">{prices.length}</span> items
          </p>
          {!searchTerm ? (
            <p className="mt-1 text-xs text-albion-gray-500">
              💡 Showing latest 300 items. Use search to find specific items from 15M+ records.
            </p>
          ) : null}
        </div>
        {searchTerm ? (
          <div className="text-xs">
            <span className="text-albion-gray-500">Searching database for: </span>
            <span className="font-medium text-neon-blue">{searchTerm}</span>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-albion-gray-700">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-sm font-semibold text-albion-gray-500 transition-colors hover:text-white"
                >
                  Item
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('tier')}
                  className="flex items-center gap-2 text-sm font-semibold text-albion-gray-500 transition-colors hover:text-white"
                >
                  Tier
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-albion-gray-500">
                City
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('sellPriceMin')}
                  className="flex items-center justify-end gap-2 text-sm font-semibold text-albion-gray-500 transition-colors hover:text-white"
                >
                  Sell Price
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('buyPriceMax')}
                  className="flex items-center justify-end gap-2 text-sm font-semibold text-albion-gray-500 transition-colors hover:text-white"
                >
                  Buy Price
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('profit')}
                  className="flex items-center justify-end gap-2 text-sm font-semibold text-albion-gray-500 transition-colors hover:text-white"
                >
                  Profit
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('roi')}
                  className="flex items-center justify-end gap-2 text-sm font-semibold text-albion-gray-500 transition-colors hover:text-white"
                >
                  ROI %
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sortedPrices.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-albion-gray-800">
                      <Image
                        src={getItemImageUrlOptimized(item.itemId, {
                          quality: item.quality as 1 | 2 | 3 | 4 | 5,
                          size: 64,
                        })}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-albion-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-albion-gray-800 px-2 py-1 text-xs font-medium text-neon-blue">
                    T{item.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-albion-gray-500">{item.city}</td>
                <td className="px-4 py-3 text-right text-sm font-medium">
                  {item.sellPriceMin.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium">
                  {item.buyPriceMax.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.profit >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-neon-green" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-neon-red" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        item.profit >= 0 ? 'text-neon-green' : 'text-neon-red'
                      }`}
                    >
                      {item.profit.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`text-sm font-medium ${
                      item.roi >= 0 ? 'text-neon-green' : 'text-neon-red'
                    }`}
                  >
                    {item.roi > 0 ? '+' : ''}
                    {item.roi.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="rounded p-1 text-albion-gray-500 transition-colors hover:bg-albion-gray-800 hover:text-white">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
