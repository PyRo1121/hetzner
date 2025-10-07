'use client';

/**
 * Weapon Rankings Component
 * Shows top players by weapon category with detailed stats
 */

import { useState, useEffect } from 'react';

import { Sword, Trophy } from 'lucide-react';

interface WeaponRanking {
  Player: {
    Id: string;
    Name: string;
    GuildName?: string;
    AllianceName?: string;
  };
  KillFame: number;
}

export function WeaponRankings() {
  const [selectedWeapon, setSelectedWeapon] = useState('all');
  const [rankings, setRankings] = useState<WeaponRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weaponCategories, setWeaponCategories] = useState<string[]>([]);

  useEffect(() => {
    async function fetchWeaponCategories() {
      try {
        const response = await fetch(
          'https://gameinfo.albiononline.com/api/gameinfo/items/_weaponCategories'
        );
        const data = await response.json();
        const categories = data.map((cat: any) => cat.id || cat);
        setWeaponCategories(['all', ...categories.slice(0, 15)]);
      } catch (error) {
        console.error('Failed to fetch weapon categories:', error);
      }
    }

    fetchWeaponCategories();
  }, []);

  useEffect(() => {
    async function fetchRankings() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://gameinfo.albiononline.com/api/gameinfo/events/playerweaponfame?range=week&limit=50&offset=0&weaponCategory=${selectedWeapon}`
        );
        const data = await response.json();
        setRankings(data);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedWeapon) {
      fetchRankings();
    }
  }, [selectedWeapon]);

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-albion-gray-800" />
          <div className="h-96 rounded bg-albion-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Sword className="h-6 w-6 text-neon-purple" />
        <div>
          <h3 className="text-xl font-bold">⚔️ Weapon Rankings</h3>
          <p className="text-sm text-albion-gray-500">
            Top players by weapon category this week
          </p>
        </div>
      </div>

      {/* Weapon Selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {weaponCategories.map((weapon) => (
          <button
            key={weapon}
            onClick={() => setSelectedWeapon(weapon)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedWeapon === weapon
                ? 'bg-neon-purple text-white'
                : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
            }`}
          >
            {weapon.charAt(0).toUpperCase() + weapon.slice(1)}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      <div className="space-y-2">
        {rankings.map((ranking, index) => (
          <div
            key={ranking.Player.Id}
            className={`rounded-lg border p-3 transition-all ${
              index < 3
                ? 'border-neon-orange/50 bg-neon-orange/10'
                : 'border-albion-gray-700 bg-albion-gray-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {index < 3 ? <Trophy
                    className="h-5 w-5"
                    style={{
                      color:
                        index === 0
                          ? '#FFD700'
                          : index === 1
                          ? '#C0C0C0'
                          : '#CD7F32',
                    }}
                  /> : null}
                <span className="text-lg font-bold text-albion-gray-600">
                  #{index + 1}
                </span>
                <div>
                  <p className="font-semibold text-white">
                    {ranking.Player.Name}
                  </p>
                  {ranking.Player.GuildName ? <p className="text-xs text-albion-gray-500">
                      {ranking.Player.GuildName}
                      {ranking.Player.AllianceName ? ` [${ranking.Player.AllianceName}]` : null}
                    </p> : null}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-neon-orange">
                  {ranking.KillFame.toLocaleString()}
                </p>
                <p className="text-xs text-albion-gray-500">kill fame</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rankings.length === 0 ? <div className="py-12 text-center text-albion-gray-500">
          No rankings available for this weapon category
        </div> : null}
    </div>
  );
}
