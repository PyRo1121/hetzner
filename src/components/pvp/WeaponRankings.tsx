'use client';

import { useEffect, useState } from 'react';

import { Target } from 'lucide-react';

import { gameinfoClient } from '@/lib/api/gameinfo/client';

interface WeaponRankingsProps {
  range?: 'day' | 'week' | 'month';
  weaponCategory?: string;
}

export function WeaponRankings({ range = 'week', weaponCategory }: WeaponRankingsProps) {
  const [rankings, setRankings] = useState<any[]>([]);
  const [weaponCategories, setWeaponCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(weaponCategory || 'all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);

        // Load weapon categories if not already loaded
        if (weaponCategories.length === 0) {
          const categories = await gameinfoClient.getWeaponCategories();
          setWeaponCategories(categories);
        }

        // Load rankings for selected category
        const data = await gameinfoClient.getPlayerWeaponFameLeaderboard({
          range,
          limit: 50,
          weaponCategory: selectedCategory === 'all' ? undefined : selectedCategory,
        });
        setRankings(data);
      } catch (err) {
        setError('Failed to load weapon rankings');
        console.error('Weapon rankings error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [range, selectedCategory, weaponCategories.length]);

  const formatFame = (fame: number) => {
    if (fame >= 1000000) {return `${(fame / 1000000).toFixed(1)}M`;}
    if (fame >= 1000) {return `${(fame / 1000).toFixed(1)}K`;}
    return fame.toLocaleString();
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      'sword': 'Swords',
      'axe': 'Axes',
      'dagger': 'Daggers',
      'mace': 'Maces',
      'hammer': 'Hammers',
      'spear': 'Spears',
      'bow': 'Bows',
      'crossbow': 'Crossbows',
      'staff': 'Staves',
      'frost': 'Frost Staff',
      'fire': 'Fire Staff',
      'holy': 'Holy Staff',
      'arcane': 'Arcane Staff',
      'cursed': 'Cursed Staff',
      'nature': 'Nature Staff',
    };
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-albion-gray-800" />
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-albion-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-float">
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-neon-purple" />
          <div>
            <h3 className="text-xl font-bold">Weapon Rankings</h3>
            <p className="text-sm text-albion-gray-500">
              Top players by weapon category in the last {range}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-neon-purple text-white'
                : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
            }`}
          >
            All Weapons
          </button>
          {weaponCategories.slice(0, 8).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-neon-purple text-white'
                  : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
              }`}
            >
              {getCategoryName(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-2">
        {rankings.map((player, index) => (
          <div
            key={`${player.player}-${player.weaponCategory}-${index}`}
            className="flex items-center justify-between p-4 bg-albion-gray-800/50 rounded-lg border border-albion-gray-700 hover:bg-albion-gray-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index < 3 ? 'bg-neon-gold text-black' : 'bg-albion-gray-600 text-white'
              }`}>
                {index + 1}
              </div>

              <div>
                <div className="font-bold text-white">{player.player}</div>
                <div className="text-sm text-albion-gray-400">
                  {getCategoryName(player.weaponCategory || 'unknown')}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-neon-green">
                {formatFame(player.killFame || 0)}
              </div>
              <div className="text-sm text-albion-gray-500">
                {player.kills || 0} kills
              </div>
            </div>
          </div>
        ))}
      </div>

      {rankings.length === 0 && (
        <div className="text-center py-12 text-albion-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No weapon rankings found</p>
          <p className="text-sm mt-2">Try selecting a different category or time range</p>
        </div>
      )}

      {/* Stats Summary */}
      {rankings.length > 0 && (
        <div className="mt-6 p-4 bg-albion-gray-800/50 rounded-lg border border-albion-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-albion-gray-400 mb-1">Total Players</div>
              <div className="text-xl font-bold text-white">{rankings.length}</div>
            </div>
            <div>
              <div className="text-sm text-albion-gray-400 mb-1">Avg Fame</div>
              <div className="text-xl font-bold text-neon-blue">
                {formatFame(rankings.reduce((sum, p) => sum + (p.killFame || 0), 0) / rankings.length)}
              </div>
            </div>
            <div>
              <div className="text-sm text-albion-gray-400 mb-1">Top Category</div>
              <div className="text-xl font-bold text-neon-green">
                {getCategoryName(
                  rankings.reduce((prev, current) =>
                    (current.killFame || 0) > (prev.killFame || 0) ? current : prev
                  ).weaponCategory || 'unknown'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
