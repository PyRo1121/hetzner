'use client';

/**
 * PvP Search Component
 * Comprehensive search for players and guilds with detailed modal popouts
 */

import { useState } from 'react';

import { Search, User, Users, Swords, Shield, TrendingUp, Award } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ServerSelector } from '@/components/ui/server-selector';
import { useAppStore } from '@/lib/store/app-store';
import { usePlayerDetails, type Player, type Guild } from '@/hooks/use-pvp-api';

type SearchType = 'player' | 'guild';

export function PvPSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('player');
  const [isSearching, setIsSearching] = useState(false);
  const [playerResults, setPlayerResults] = useState<Player[]>([]);
  const [guildResults, setGuildResults] = useState<Guild[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const { selectedServer } = useAppStore();
  
  // Fetch player details when a player is selected
  const { data: playerDetails } = usePlayerDetails({ 
    playerId: selectedPlayer?.Id || '', 
    enabled: !!selectedPlayer,
    server: selectedServer,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {return;}

    setIsSearching(true);
    try {
      // Use our API route to avoid CORS
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      params.append('server', selectedServer);
      const response = await fetch(`/api/pvp/search?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        if (searchType === 'player') {
          setPlayerResults(result.data.players || []);
          setGuildResults([]);
        } else {
          setGuildResults(result.data.guilds || []);
          setPlayerResults([]);
        }
      } else {
        console.error('Search failed:', result.error);
        setPlayerResults([]);
        setGuildResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setPlayerResults([]);
      setGuildResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    // Player details will be fetched by the hook when modal opens
  };

  const handleGuildClick = (guild: Guild) => {
    setSelectedGuild(guild);
    // Guild details would need a separate hook/API endpoint
    // For now, just show basic info
  };

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold">PvP Search</h3>
        <p className="text-sm text-albion-gray-500">
          Search for players or guilds to view detailed statistics
        </p>
      </div>

      {/* Server Selector */}
      <div className="mb-4">
        <ServerSelector />
      </div>

      {/* Search Type Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setSearchType('player')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            searchType === 'player'
              ? 'bg-neon-blue text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <User className="h-4 w-4" />
          Players
        </button>
        <button
          onClick={() => setSearchType('guild')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            searchType === 'guild'
              ? 'bg-neon-blue text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <Users className="h-4 w-4" />
          Guilds
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-albion-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search for ${searchType === 'player' ? 'a player' : 'a guild'}...`}
            className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-900 py-2 pl-10 pr-4 text-white placeholder-albion-gray-500 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="rounded-lg bg-neon-blue px-6 py-2 font-medium text-white transition-colors hover:bg-neon-blue/80 disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {playerResults.length > 0 ? <div className="space-y-2">
          <p className="text-sm text-albion-gray-500">
            Found {playerResults.length} player{playerResults.length !== 1 ? 's' : ''}
          </p>
          {playerResults.map((player) => (
            <button
              key={player.Id}
              onClick={() => handlePlayerClick(player)}
              className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4 text-left transition-all hover:border-neon-blue"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{player.Name}</p>
                  {player.GuildName ? <p className="text-sm text-albion-gray-500">
                      {player.GuildName}
                      {player.AllianceName ? ` [${player.AllianceName}]` : null}
                    </p> : null}
                </div>
                <div className="text-right">
                  <p className="text-sm text-albion-gray-500">Fame Ratio</p>
                  <p className="text-lg font-bold text-neon-blue">
                    {player.FameRatio?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div> : null}

      {guildResults.length > 0 ? <div className="space-y-2">
          <p className="text-sm text-albion-gray-500">
            Found {guildResults.length} guild{guildResults.length !== 1 ? 's' : ''}
          </p>
          {guildResults.map((guild) => (
            <button
              key={guild.Id}
              onClick={() => handleGuildClick(guild)}
              className="w-full rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4 text-left transition-all hover:border-neon-blue"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{guild.Name}</p>
                  {guild.AllianceName ? <p className="text-sm text-albion-gray-500">
                      [{guild.AllianceTag}] {guild.AllianceName}
                    </p> : null}
                </div>
                <div className="text-right">
                  <p className="text-sm text-albion-gray-500">Members</p>
                  <p className="text-lg font-bold text-neon-blue">
                    {guild.MemberCount || 0}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div> : null}

      {/* Player Detail Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-4xl bg-albion-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedPlayer?.Name}
            </DialogTitle>
          </DialogHeader>

          {selectedPlayer ? <div className="space-y-6">
              {/* Player Info */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
                    <Swords className="h-4 w-4" />
                    <span className="text-sm">Kill Fame</span>
                  </div>
                  <p className="text-2xl font-bold text-neon-green">
                    {selectedPlayer.KillFame?.toLocaleString() || '0'}
                  </p>
                </div>

                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Death Fame</span>
                  </div>
                  <p className="text-2xl font-bold text-neon-red">
                    {selectedPlayer.DeathFame?.toLocaleString() || '0'}
                  </p>
                </div>

                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Fame Ratio</span>
                  </div>
                  <p className="text-2xl font-bold text-neon-blue">
                    {selectedPlayer.FameRatio?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Guild Info */}
              {selectedPlayer.GuildName ? <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-neon-blue" />
                    <div>
                      <p className="font-semibold text-white">{selectedPlayer.GuildName}</p>
                      {selectedPlayer.AllianceName ? <p className="text-sm text-albion-gray-500">
                          [{selectedPlayer.AllianceName}]
                        </p> : null}
                    </div>
                  </div>
                </div> : null}

              {/* Recent Activity */}
              {playerDetails ? <div>
                  <h4 className="mb-3 font-semibold">Recent Activity</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent Kills */}
                    <div>
                      <p className="mb-2 text-sm text-albion-gray-500">Recent Kills ({playerDetails.kills.length})</p>
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {playerDetails.kills.slice(0, 5).map((kill: any) => (
                          <div key={kill.EventId} className="rounded bg-albion-gray-800 p-2">
                            <p className="text-sm font-medium text-white">{kill.Victim.Name}</p>
                            <p className="text-xs text-albion-gray-500">
                              {new Date(kill.TimeStamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Deaths */}
                    <div>
                      <p className="mb-2 text-sm text-albion-gray-500">Recent Deaths ({playerDetails.deaths.length})</p>
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {playerDetails.deaths.slice(0, 5).map((death: any) => (
                          <div key={death.EventId} className="rounded bg-albion-gray-800 p-2">
                            <p className="text-sm font-medium text-white">{death.Killer.Name}</p>
                            <p className="text-xs text-albion-gray-500">
                              {new Date(death.TimeStamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div> : null}
            </div> : null}
        </DialogContent>
      </Dialog>

      {/* Guild Detail Modal */}
      <Dialog open={!!selectedGuild} onOpenChange={() => setSelectedGuild(null)}>
        <DialogContent className="max-w-4xl bg-albion-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedGuild?.Name}
            </DialogTitle>
          </DialogHeader>

          {selectedGuild ? <div className="space-y-6">
              {/* Guild Stats */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Members</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {selectedGuild.MemberCount || 'N/A'}
                  </p>
                </div>

                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="mb-2 flex items-center gap-2 text-albion-gray-500">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">Guild ID</span>
                  </div>
                  <p className="text-sm font-mono text-albion-gray-400">
                    {selectedGuild.Id}
                  </p>
                </div>
              </div>

              {/* Alliance Info */}
              {selectedGuild.AllianceName ? <div className="rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-neon-purple" />
                    <div>
                      <p className="font-semibold text-white">{selectedGuild.AllianceName}</p>
                      <p className="text-sm text-albion-gray-500">[{selectedGuild.AllianceTag}]</p>
                    </div>
                  </div>
                </div> : null}

              <div className="text-center text-sm text-albion-gray-500">
                <p>Detailed guild stats coming soon</p>
              </div>
            </div> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
