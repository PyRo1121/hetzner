'use client';

/**
 * PvE & Gathering Leaderboards Component
 * Shows top players in PvE and gathering activities
 */

import { useState, useEffect } from 'react';

import { Pickaxe, Swords } from 'lucide-react';

type LeaderboardType = 'pve' | 'gathering';
type GatheringSubtype = 'All' | 'Fiber' | 'Hide' | 'Ore' | 'Rock' | 'Wood';

export function PvELeaderboards() {
  const [type, setType] = useState<LeaderboardType>('pve');
  const [subtype, setSubtype] = useState<GatheringSubtype>('All');
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setIsLoading(true);
        
        let url = `https://gameinfo.albiononline.com/api/gameinfo/players/statistics?range=week&limit=50&offset=0&type=${type === 'pve' ? 'PvE' : 'Gathering'}&region=Total`;
        
        if (type === 'gathering') {
          url += `&subtype=${subtype}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [type, subtype]);

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

  const gatheringSubtypes: GatheringSubtype[] = ['All', 'Fiber', 'Hide', 'Ore', 'Rock', 'Wood'];

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold">🏆 PvE & Gathering Leaderboards</h3>
        <p className="text-sm text-albion-gray-500">
          Top players by fame this week
        </p>
      </div>

      {/* Type Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setType('pve')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            type === 'pve'
              ? 'bg-neon-red text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <Swords className="h-4 w-4" />
          PvE
        </button>
        <button
          onClick={() => setType('gathering')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            type === 'gathering'
              ? 'bg-neon-green text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <Pickaxe className="h-4 w-4" />
          Gathering
        </button>
      </div>

      {/* Gathering Subtype Selector */}
      {type === 'gathering' ? <div className="mb-4 flex flex-wrap gap-2">
          {gatheringSubtypes.map((sub) => (
            <button
              key={sub}
              onClick={() => setSubtype(sub)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                subtype === sub
                  ? 'bg-neon-green text-white'
                  : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
              }`}
            >
              {sub}
            </button>
          ))}
        </div> : null}

      {/* Leaderboard */}
      <div className="space-y-2">
        {players.map((player, index) => (
          <div
            key={player.Player?.Id || index}
            className="flex items-center justify-between rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-albion-gray-600">
                #{index + 1}
              </span>
              <div>
                <p className="font-semibold text-white">
                  {player.Player?.Name || 'Unknown'}
                </p>
                {player.Player?.GuildName ? <p className="text-xs text-albion-gray-500">
                    {player.Player.GuildName}
                  </p> : null}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-neon-blue">
                {(player.Fame || 0).toLocaleString()}
              </p>
              <p className="text-xs text-albion-gray-500">fame</p>
            </div>
          </div>
        ))}
      </div>

      {players.length === 0 ? <div className="py-12 text-center text-albion-gray-500">
          No leaderboard data available
        </div> : null}
    </div>
  );
}
