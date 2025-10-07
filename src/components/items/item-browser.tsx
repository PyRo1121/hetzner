'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';

import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Grid, List, Search } from 'lucide-react';

import { getItemRenderPath } from '@/lib/render/item-icons';

interface Item {
  id: string;
  name: string;
  tier: number;
  category: string;
  subcategory?: string;
  itemPower?: number;
}

interface ItemBrowserProps {
  items: Item[];
  onItemSelect?: (item: Item) => void;
}

export function ItemBrowser({ items, onItemSelect }: ItemBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category));
    return ['all', ...Array.from(cats)];
  }, [items]);

  // Get unique tiers
  const tiers = useMemo(() => {
    const tierSet = new Set(items.map((item) => item.tier));
    return ['all', ...Array.from(tierSet).sort((a, b) => a - b)];
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      // Tier filter
      const matchesTier = selectedTier === 'all' || item.tier === selectedTier;

      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [items, searchQuery, selectedCategory, selectedTier]);

  // Get item icon URL via storage-first proxy
  const getItemIconUrl = (itemId: string, size: number = 64) => {
    return getItemRenderPath(itemId, { size }) ?? '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Item Browser</h2>
          <p className="text-sm text-albion-gray-500">
            Browse and search {items.length.toLocaleString()} items
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 rounded-lg bg-albion-gray-800 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md px-3 py-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-neon-blue text-white'
                : 'text-albion-gray-400 hover:text-white'
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md px-3 py-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-neon-blue text-white'
                : 'text-albion-gray-400 hover:text-white'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-albion-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 py-2 pl-10 pr-4 text-white placeholder-albion-gray-500 focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-albion-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none rounded-lg border border-albion-gray-700 bg-albion-gray-900 py-2 pl-10 pr-4 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tier Filter */}
        <div>
          <select
            value={selectedTier}
            onChange={(e) =>
              setSelectedTier(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="w-full appearance-none rounded-lg border border-albion-gray-700 bg-albion-gray-900 px-4 py-2 text-white focus:border-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
          >
            {tiers.map((tier) => (
              <option key={tier} value={tier}>
                {tier === 'all' ? 'All Tiers' : `Tier ${tier}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-albion-gray-500">
        <span>
          Showing {filteredItems.length.toLocaleString()} of {items.length.toLocaleString()} items
        </span>
        {searchQuery ? (
          <button onClick={() => setSearchQuery('')} className="text-neon-blue hover:underline">
            Clear search
          </button>
        ) : null}
      </div>

      {/* Items Grid/List */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {filteredItems.map((item) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => onItemSelect?.(item)}
                className="group relative overflow-hidden rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4 text-left transition-all hover:border-neon-blue hover:bg-albion-gray-700"
              >
                {/* Item Icon */}
                <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-lg bg-albion-gray-900">
                  <Image
                    src={getItemIconUrl(item.id)}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="object-contain"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Tier Badge */}
                <div className="absolute right-2 top-2 rounded-full bg-albion-gray-900 px-2 py-1 text-xs font-bold text-neon-gold">
                  T{item.tier}
                </div>

                {/* Item Info */}
                <div>
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-white group-hover:text-neon-blue">
                    {item.name}
                  </h3>
                  <p className="text-xs text-albion-gray-500">{item.category}</p>
                  {item.itemPower ? (
                    <p className="mt-1 text-xs text-neon-purple">IP: {item.itemPower}</p>
                  ) : null}
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {filteredItems.map((item) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => onItemSelect?.(item)}
                className="group flex w-full items-center gap-4 rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-3 text-left transition-all hover:border-neon-blue hover:bg-albion-gray-700"
              >
                {/* Item Icon */}
                <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-albion-gray-900">
                  <Image
                    src={getItemIconUrl(item.id, 48)}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Item Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-neon-blue">
                    {item.name}
                  </h3>
                  <p className="text-sm text-albion-gray-500">{item.category}</p>
                </div>

                {/* Tier Badge */}
                <div className="rounded-full bg-albion-gray-900 px-3 py-1 text-sm font-bold text-neon-gold">
                  T{item.tier}
                </div>

                {/* Item Power */}
                {item.itemPower ? (
                  <div className="text-sm text-neon-purple">IP: {item.itemPower}</div>
                ) : null}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-albion-gray-700" />
          <h3 className="mb-2 text-lg font-semibold text-white">No items found</h3>
          <p className="text-sm text-albion-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : null}
    </div>
  );
}
