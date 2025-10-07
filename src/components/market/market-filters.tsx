'use client';

import { useState } from 'react';

import { Search, Filter, X } from 'lucide-react';

const cities = [
  'All Cities',
  'Caerleon',
  'Bridgewatch',
  'Lymhurst',
  'Martlock',
  'Fort Sterling',
  'Thetford',
  'Black Market',
];

const qualities = [
  { value: 'all', label: 'All Qualities' },
  { value: '1', label: 'Normal' },
  { value: '2', label: 'Good' },
  { value: '3', label: 'Outstanding' },
  { value: '4', label: 'Excellent' },
  { value: '5', label: 'Masterpiece' },
];

const tiers = ['All', 'T4', 'T5', 'T6', 'T7', 'T8'];

interface MarketFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  selectedQualities: number[];
  onQualitiesChange: (qualities: number[]) => void;
  selectedTier: string;
  onTierChange: (tier: string) => void;
}

export function MarketFilters({ 
  searchTerm, 
  onSearchChange,
  selectedCities,
  onCitiesChange,
  selectedQualities,
  onQualitiesChange,
  selectedTier,
  onTierChange,
}: MarketFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      onCitiesChange(selectedCities.filter(c => c !== city));
    } else {
      onCitiesChange([...selectedCities, city]);
    }
  };

  const toggleQuality = (quality: number) => {
    if (selectedQualities.includes(quality)) {
      onQualitiesChange(selectedQualities.filter(q => q !== quality));
    } else {
      onQualitiesChange([...selectedQualities, quality]);
    }
  };

  const handleReset = () => {
    onSearchChange('');
    onCitiesChange(['Caerleon', 'Bridgewatch']);
    onQualitiesChange([1, 2, 3, 4, 5]);
    onTierChange('All');
  };

  const hasActiveFilters =
    searchTerm || selectedCities.length < cities.length - 1 || selectedQualities.length < 5 || selectedTier !== 'All';

  return (
    <div className="panel-float space-y-4">
      {/* Main Filters Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-albion-gray-500" />
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 py-2 pl-10 pr-4 text-sm text-white placeholder-albion-gray-500 transition-colors focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          />
        </div>

        {/* City Filter - Multi-select Pills */}
        <div className="md:col-span-2 flex flex-wrap gap-2">
          {cities.slice(1).map((city) => (
            <button
              key={city}
              onClick={() => toggleCity(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCities.includes(city)
                  ? 'bg-neon-green text-white shadow-lg shadow-neon-green/30'
                  : 'bg-albion-gray-800 text-albion-gray-500 hover:bg-albion-gray-700 hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Quality & Tier Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Quality Pills */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-albion-gray-500 font-medium">Quality:</span>
          <div className="flex gap-2">
            {qualities.slice(1).map((quality) => (
              <button
                key={quality.value}
                onClick={() => toggleQuality(Number(quality.value))}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedQualities.includes(Number(quality.value))
                    ? 'bg-neon-purple text-white shadow-lg shadow-neon-purple/30'
                    : 'bg-albion-gray-800 text-albion-gray-500 hover:bg-albion-gray-700 hover:text-white'
                }`}
              >
                {quality.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tier Pills */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-albion-gray-500 font-medium">Tier:</span>
          <div className="flex gap-2">
            {tiers.map((tier) => (
              <button
                key={tier}
                onClick={() => onTierChange(tier)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  selectedTier === tier
                    ? 'bg-neon-blue text-white shadow-lg shadow-neon-blue/30'
                    : 'bg-albion-gray-800 text-albion-gray-500 hover:bg-albion-gray-700 hover:text-white'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters ? <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg bg-albion-gray-800 px-3 py-1.5 text-sm font-medium text-albion-gray-500 transition-colors hover:bg-albion-gray-700 hover:text-white"
            >
              <X className="h-4 w-4" />
              Reset
            </button> : null}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 rounded-lg bg-albion-gray-800 px-3 py-1.5 text-sm font-medium text-albion-gray-500 transition-colors hover:bg-albion-gray-700 hover:text-white"
          >
            <Filter className="h-4 w-4" />
            Advanced
          </button>
        </div>
      </div>

      {/* Advanced Filters (Collapsible) */}
      {showAdvanced ? <div className="grid gap-4 border-t border-albion-gray-700 pt-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-albion-gray-500">
              Min Price
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-3 py-2 text-sm text-white transition-colors focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-albion-gray-500">
              Max Price
            </label>
            <input
              type="number"
              placeholder="999999"
              className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-3 py-2 text-sm text-white transition-colors focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-albion-gray-500">
              Category
            </label>
            <select className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-3 py-2 text-sm text-white transition-colors focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue">
              <option>All Categories</option>
              <option>Weapons</option>
              <option>Armor</option>
              <option>Accessories</option>
              <option>Consumables</option>
            </select>
          </div>
        </div> : null}
    </div>
  );
}
