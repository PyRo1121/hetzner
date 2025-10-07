import { useEffect, useState } from 'react';

import { X, Users, Trophy, Crown } from 'lucide-react';

import { gameinfoClient } from '@/lib/api/gameinfo/client';

interface AllianceDetailModalProps {
  allianceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AllianceDetailModal({ allianceId, isOpen, onClose }: AllianceDetailModalProps) {
  const [data, setData] = useState<{ alliance: any | null } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && allianceId) {
      setLoading(true);
      (async () => {
        try {
          const alliance = await gameinfoClient.getAlliance(allianceId);
          setData({ alliance });
        } catch {
          setData(null);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isOpen, allianceId]);

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-albion-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-albion-gray-700 p-6">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-neon-purple" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {loading ? 'Loading...' : data?.alliance?.Name || 'Alliance Details'}
              </h2>
              <p className="text-sm text-albion-gray-400">
                {data?.alliance?.Tag ? `Tag: [${data.alliance.Tag}]` : null}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple" />
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Alliance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-neon-blue" />
                    <span className="text-sm font-medium text-albion-gray-400">Total Members</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">
                    {data.alliance?.MemberCount || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-neon-green" />
                    <span className="text-sm font-medium text-albion-gray-400">Kill Fame</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">
                    {(data.alliance?.KillFame || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-neon-red" />
                    <span className="text-sm font-medium text-albion-gray-400">Death Fame</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">
                    {(data.alliance?.DeathFame || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Guilds in Alliance */}
              {data.alliance?.Guilds && data.alliance.Guilds.length > 0 ? <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Member Guilds</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.alliance.Guilds.map((guild: any) => (
                      <div key={guild.Id} className="rounded-lg bg-albion-gray-800 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{guild.Name}</p>
                            <p className="text-sm text-albion-gray-400">
                              Members: {guild.MemberCount || 0}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-neon-green">
                              Fame: {(guild.KillFame || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div> : null}

              {/* Alliance Info */}
              <div className="rounded-lg bg-albion-gray-800 p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Alliance Information</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-albion-gray-400">
                    Founded: {data.alliance?.Founded ? new Date(data.alliance.Founded).toLocaleDateString() : 'Unknown'}
                  </p>
                  {data.alliance?.FounderId ? <p className="text-albion-gray-400">
                      Founder: {data.alliance.FounderId}
                    </p> : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-albion-gray-500">
              Alliance data not found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
