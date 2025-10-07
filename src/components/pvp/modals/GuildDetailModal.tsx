import { useEffect, useState } from 'react';

import { X, Users, Trophy, Sword, Shield } from 'lucide-react';

import { getGuildById, getGuildMembers, getGuildStats } from '@/lib/api/gameinfo/guilds';
import { gameinfoClient } from '@/lib/api/gameinfo/client';

interface GuildDetailModalProps {
  guildId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GuildDetailModal({ guildId, isOpen, onClose }: GuildDetailModalProps) {
  const [data, setData] = useState<{
    profile: { guild: any | null; alliance: any | null };
    members: { guildId: string; members: any[] };
    recentBattles: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && guildId) {
      setLoading(true);
      (async () => {
        try {
          const [guild, members, stats, battles] = await Promise.all([
            getGuildById(guildId),
            getGuildMembers(guildId),
            getGuildStats(guildId),
            gameinfoClient.getRecentBattles('week', 50),
          ]);

          const alliance = guild?.AllianceId ? await gameinfoClient.getAlliance(guild.AllianceId) : null;
          const recentBattles = (battles || []).filter((b) => {
            try {
              return b?.guilds && b.guilds[guildId] !== undefined;
            } catch {
              return false;
            }
          });

          setData({
            profile: { guild: guild ? { ...guild, ...stats } : null, alliance },
            members: { guildId, members: members || [] },
            recentBattles,
          });
        } catch {
          setData(null);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isOpen, guildId]);

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-albion-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-albion-gray-700 p-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-neon-orange" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {loading ? 'Loading...' : data?.profile.guild?.Name || 'Guild Details'}
              </h2>
              <p className="text-sm text-albion-gray-400">
                {data?.profile.alliance?.Name ? `Alliance: ${data.profile.alliance.Name}` : null}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-albion-gray-400 hover:bg-albion-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Guild Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Sword className="h-5 w-5 text-neon-red" />
                    <span className="text-sm font-medium text-albion-gray-400">Kill Fame</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">
                    {(data.profile.guild?.killFame || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-neon-blue" />
                    <span className="text-sm font-medium text-albion-gray-400">Death Fame</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">
                    {(data.profile.guild?.DeathFame || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-neon-green" />
                    <span className="text-sm font-medium text-albion-gray-400">Members</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">
                    {data.profile.guild?.MemberCount || 0}
                  </p>
                </div>
              </div>

              {/* Members */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Members</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.members.members.slice(0, 12).map((member) => (
                    <div key={member.Id} className="rounded-lg bg-albion-gray-800 p-4">
                      <p className="font-medium text-white">{member.Name}</p>
                      <p className="text-sm text-albion-gray-400">
                        Kill Fame: {(member.KillFame || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                {data.members.members.length > 12 && (
                  <p className="text-sm text-albion-gray-500 mt-2">
                    And {data.members.members.length - 12} more members...
                  </p>
                )}
              </div>

              {/* Recent Battles */}
              {data.recentBattles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Battles</h3>
                  <div className="space-y-2">
                    {data.recentBattles.slice(0, 5).map((battle) => (
                      <div key={battle.id} className="rounded-lg bg-albion-gray-800 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{battle.name || `Battle #${battle.id}`}</p>
                            <p className="text-sm text-albion-gray-400">
                              {new Date(battle.startTime).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-neon-green">Kills: {battle.totalKills}</p>
                            <p className="text-sm text-neon-blue">Fame: {battle.totalFame.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-albion-gray-500">
              Guild data not found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
