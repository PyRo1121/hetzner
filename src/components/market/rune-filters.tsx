'use client';

/**
 * Custom Rune Filters with Shadcn/ui
 * Phase 1, Week 3, Day 16
 * - Shadcn/ui dropdowns with lore-themed icons
 * - Debounced async search
 * - Multi-select support
 * - Keyboard navigation
 */

import { useState, useCallback, useEffect } from 'react';

import { Search, X, Filter } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce';

interface FilterState {
  cities: string[];
  qualities: number[];
  tiers: string[];
  searchTerm: string;
}

interface RuneFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

const CITIES = [
  { value: 'Caerleon', label: 'Caerleon', icon: '🏰' },
  { value: 'Bridgewatch', label: 'Bridgewatch', icon: '🌉' },
  { value: 'Lymhurst', label: 'Lymhurst', icon: '🌲' },
  { value: 'Martlock', label: 'Martlock', icon: '⛰️' },
  { value: 'Fort Sterling', label: 'Fort Sterling', icon: '❄️' },
  { value: 'Thetford', label: 'Thetford', icon: '🌿' },
];

const QUALITIES = [
  { value: 1, label: 'Normal', color: 'text-gray-400' },
  { value: 2, label: 'Good', color: 'text-green-400' },
  { value: 3, label: 'Outstanding', color: 'text-blue-400' },
  { value: 4, label: 'Excellent', color: 'text-purple-400' },
  { value: 5, label: 'Masterpiece', color: 'text-orange-400' },
];

const TIERS = [
  { value: 'T4', label: 'Tier 4' },
  { value: 'T5', label: 'Tier 5' },
  { value: 'T6', label: 'Tier 6' },
  { value: 'T7', label: 'Tier 7' },
  { value: 'T8', label: 'Tier 8' },
];

export function RuneFilters({ onFilterChange }: RuneFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    cities: [],
    qualities: [],
    tiers: [],
    searchTerm: '',
  });

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update search term in filters when debounced value changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchTerm: debouncedSearch }));
  }, [debouncedSearch]);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleCity = useCallback((city: string) => {
    setFilters(prev => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter(c => c !== city)
        : [...prev.cities, city],
    }));
  }, []);

  const toggleQuality = useCallback((quality: number) => {
    setFilters(prev => ({
      ...prev,
      qualities: prev.qualities.includes(quality)
        ? prev.qualities.filter(q => q !== quality)
        : [...prev.qualities, quality],
    }));
  }, []);

  const toggleTier = useCallback((tier: string) => {
    setFilters(prev => ({
      ...prev,
      tiers: prev.tiers.includes(tier)
        ? prev.tiers.filter(t => t !== tier)
        : [...prev.tiers, tier],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      cities: [],
      qualities: [],
      tiers: [],
      searchTerm: '',
    });
    setSearchInput('');
  }, []);

  const hasActiveFilters = filters.cities.length > 0 || 
                          filters.qualities.length > 0 || 
                          filters.tiers.length > 0 || 
                          filters.searchTerm.length > 0;

  return (
    <div className="panel-float mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-neon-blue" />
        <h3 className="text-lg font-semibold">Rune Filters</h3>
        {hasActiveFilters ? <button
            onClick={clearFilters}
            className="ml-auto text-sm text-albion-gray-500 hover:text-white transition-colors flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear All
          </button> : null}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-albion-gray-500" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-albion-gray-500 transition-colors focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cities */}
        <div>
          <label className="mb-2 block text-sm font-medium text-albion-gray-400">
            Cities
          </label>
          <div className="space-y-2">
            {CITIES.map((city) => (
              <button
                key={city.value}
                onClick={() => toggleCity(city.value)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                  filters.cities.includes(city.value)
                    ? 'bg-neon-blue text-white'
                    : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
                }`}
              >
                <span>{city.icon}</span>
                <span>{city.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Qualities */}
        <div>
          <label className="mb-2 block text-sm font-medium text-albion-gray-400">
            Quality
          </label>
          <div className="space-y-2">
            {QUALITIES.map((quality) => (
              <button
                key={quality.value}
                onClick={() => toggleQuality(quality.value)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                  filters.qualities.includes(quality.value)
                    ? 'bg-neon-blue text-white'
                    : `bg-albion-gray-800 ${quality.color} hover:bg-albion-gray-700`
                }`}
              >
                <span>{quality.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tiers */}
        <div>
          <label className="mb-2 block text-sm font-medium text-albion-gray-400">
            Tier
          </label>
          <div className="space-y-2">
            {TIERS.map((tier) => (
              <button
                key={tier.value}
                onClick={() => toggleTier(tier.value)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                  filters.tiers.includes(tier.value)
                    ? 'bg-neon-blue text-white'
                    : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
                }`}
              >
                <span>{tier.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters ? <div className="mt-4 pt-4 border-t border-albion-gray-700">
          <p className="text-sm text-albion-gray-500">
            Active filters: {' '}
            {filters.cities.length > 0 ? `${filters.cities.length} cities, ` : null}
            {filters.qualities.length > 0 ? `${filters.qualities.length} qualities, ` : null}
            {filters.tiers.length > 0 ? `${filters.tiers.length} tiers, ` : null}
            {filters.searchTerm ? `search: "${filters.searchTerm}"` : null}
          </p>
        </div> : null}
    </div>
  );
}
