import { useState } from 'react';

import { Trophy, Swords, Shield, Crown } from 'lucide-react';

import { useGuildLeaderboards, type GuildLeaderboardType, type GuildLeaderboardRange } from '@/hooks/use-guild-leaderboards';

import { AllianceDetailModal } from './modals/AllianceDetailModal';
import { GuildDetailModal } from './modals/GuildDetailModal';

export function GuildLeaderboards() {
  const [leaderboardType, setLeaderboardType] = useState<GuildLeaderboardType>('attacks');
  const [timeRange, setTimeRange] = useState<GuildLeaderboardRange>('week');
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [selectedAllianceId, setSelectedAllianceId] = useState<string | null>(null);

  const { guilds, isLoading, error } = useGuildLeaderboards({
    type: leaderboardType,
    range: timeRange,
    limit: 50,
    offset: 0,
  });

  const handleGuildClick = (guildId: string) => {
    setSelectedGuildId(guildId);
  };

  const handleAllianceClick = (allianceId: string) => {
    setSelectedAllianceId(allianceId);
  };

  const closeGuildModal = () => {
    setSelectedGuildId(null);
  };

  const closeAllianceModal = () => {
    setSelectedAllianceId(null);
  };

  if (error) {
    return (
      <div className="panel-float">
        <div className="text-center py-8">
          <p className="text-red-400">Failed to load guild leaderboards</p>
          <p className="text-sm text-albion-gray-500 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
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

  // Empty state when API returns no leaderboard rows
  if (!isLoading && (!guilds || guilds.length === 0)) {
    return (
      <div className="panel-float">
        <div className="text-center py-8">
          <p className="text-albion-gray-300">No leaderboard data available right now.</p>
          <p className="text-sm text-albion-gray-500 mt-2">
            This can happen when the Gameinfo endpoints return empty results. Try changing the range or type, or refresh later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-neon-orange" />
          <div>
            <h3 className="text-xl font-bold">Guild Leaderboards</h3>
            <p className="text-sm text-albion-gray-500">
              Top {guilds.length} guilds by performance
            </p>
          </div>
        </div>

        {/* Time Range */}
        <div className="flex gap-2">
          {(['week', 'month'] as GuildLeaderboardRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-neon-blue text-white'
                  : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
              }`}
            >
              {range === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Type Tabs */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => setLeaderboardType('attacks')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors ${
            leaderboardType === 'attacks'
              ? 'bg-neon-red text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <Swords className="h-5 w-5" />
          Attacks Won
        </button>
        <button
          onClick={() => setLeaderboardType('defenses')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors ${
            leaderboardType === 'defenses'
              ? 'bg-neon-blue text-white'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <Shield className="h-5 w-5" />
          Defenses Won
        </button>
        <button
          onClick={() => setLeaderboardType('kill_fame')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors ${
            leaderboardType === 'kill_fame'
              ? 'bg-neon-green text-black'
              : 'bg-albion-gray-800 text-albion-gray-400 hover:bg-albion-gray-700'
          }`}
        >
          <Trophy className="h-5 w-5" />
          Kill Fame
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-hidden rounded-lg border border-albion-gray-700">
        <table className="w-full">
          <thead className="bg-albion-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-albion-gray-400">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-albion-gray-400">
                Guild
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-albion-gray-400">
                {guilds.length > 0 ? guilds[0]?.metricLabel : leaderboardType === 'kill_fame' ? 'Kill Fame' : leaderboardType === 'attacks' ? 'Attacks Won' : 'Defenses Won'}
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-albion-gray-400">
                Kill Fame
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-albion-gray-400">
                Death Fame
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-albion-gray-400">
                K/D Ratio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-albion-gray-800">
            {guilds.map((guild, index) => {
              const kdRatio = guild.deathFame && guild.deathFame > 0
                ? (Number(guild.killFame ?? 0) / guild.deathFame).toFixed(2)
                : Number(guild.killFame ?? 0).toFixed(2);
              const isTop3 = index < 3;

              return (
                <tr
                  key={`${guild.guildId}-${guild.rank}`}
                  className={`transition-colors hover:bg-albion-gray-800/50 ${
                    isTop3 ? 'bg-albion-gray-800/30' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {index === 0 ? <Crown className="h-5 w-5 text-neon-orange" /> : null}
                      {index === 1 ? <Crown className="h-5 w-5 text-albion-gray-400" /> : null}
                      {index === 2 ? <Crown className="h-5 w-5 text-amber-700" /> : null}
                      <span className={`text-lg font-bold ${
                        isTop3 ? 'text-white' : 'text-albion-gray-500'
                      }`}>
                        #{index + 1}
                      </span>
                    </div>
                  </td>

                  {/* Guild Name */}
                  <td className="px-4 py-3">
                    <div>
                      <button
                        onClick={() => handleGuildClick(guild.guildId)}
                        className="font-semibold text-white hover:text-neon-blue transition-colors text-left"
                      >
                        {guild.guildName}
                      </button>
                      {guild.allianceName ? (
                        <button
                          onClick={() => handleAllianceClick(guild.allianceId ?? '')}
                          className="text-xs text-albion-gray-500 hover:text-neon-purple transition-colors block"
                        >
                          [{guild.allianceName}]
                        </button>
                      ) : null}
                    </div>
                  </td>

                  {/* Wins */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-neon-green">
                      {guild.metricValue.toLocaleString()}
                    </span>
                  </td>

                  {/* Kill Fame */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-white">
                      {(guild.killFame ?? 0).toLocaleString()}
                    </span>
                  </td>

                  {/* Death Fame */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-albion-gray-400">
                      {(guild.deathFame ?? 0).toLocaleString()}
                    </span>
                  </td>

                  {/* K/D Ratio */}
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${
                      parseFloat(kdRatio) >= 2 ? 'text-neon-green' :
                      parseFloat(kdRatio) >= 1 ? 'text-neon-blue' :
                      'text-neon-red'
                    }`}>
                      {kdRatio}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {guilds.length === 0 ? <div className="py-12 text-center text-albion-gray-500">
          No guild data available for this time period
        </div> : null}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-albion-gray-500">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-neon-green" />
          <span>K/D ≥ 2.0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-neon-blue" />
          <span>K/D ≥ 1.0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-neon-red" />
          <span>K/D &lt; 1.0</span>
        </div>
      </div>
    </div>

    {/* Modals */}
    <GuildDetailModal
      guildId={selectedGuildId ?? ''}
      isOpen={selectedGuildId !== null}
      onClose={closeGuildModal}
    />
    <AllianceDetailModal
      allianceId={selectedAllianceId ?? ''}
      isOpen={selectedAllianceId !== null}
      onClose={closeAllianceModal}
    />
    </>
  );
}
