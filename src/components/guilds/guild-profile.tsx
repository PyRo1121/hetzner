'use client';

import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { Users, Trophy, Swords, Shield, TrendingUp, Calendar, Crown } from 'lucide-react';

import { getGuildById, getGuildMembers, getGuildStats, type Guild, type GuildMember } from '@/lib/api/gameinfo/guilds';

interface GuildProfileProps {
  guildId: string;
}

export function GuildProfile({ guildId }: GuildProfileProps) {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGuildData() {
      setIsLoading(true);
      try {
        const [guildData, membersData, statsData] = await Promise.all([
          getGuildById(guildId),
          getGuildMembers(guildId),
          getGuildStats(guildId),
        ]);

        setGuild(guildData);
        setMembers(membersData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load guild data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadGuildData();
  }, [guildId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="panel-float h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="panel-float py-12 text-center">
        <Users className="mx-auto mb-4 h-16 w-16 text-albion-gray-700" />
        <h3 className="mb-2 text-lg font-semibold text-white">Guild Not Found</h3>
        <p className="text-sm text-albion-gray-500">Unable to load guild data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel-float"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-neon-blue to-neon-green">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{guild.Name}</h1>
              {guild.AllianceName ? <p className="text-sm text-albion-gray-400">
                  Alliance: <span className="text-neon-blue">[{guild.AllianceTag}] {guild.AllianceName}</span>
                </p> : null}
              {guild.Founded ? <div className="mt-1 flex items-center gap-2 text-xs text-albion-gray-500">
                  <Calendar className="h-3 w-3" />
                  Founded: {new Date(guild.Founded).toLocaleDateString()}
                </div> : null}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-neon-green">{guild.MemberCount || 0}</div>
            <div className="text-xs text-albion-gray-500">Members</div>
          </div>
        </div>
      </motion.div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel-float"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neon-green/20">
              <Swords className="h-6 w-6 text-neon-green" />
            </div>
            <div>
              <div className="text-xs text-albion-gray-500">Total Kills</div>
              <div className="text-xl font-bold text-white">{stats?.totalKills?.toLocaleString() || 0}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel-float"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neon-gold/20">
              <Trophy className="h-6 w-6 text-neon-gold" />
            </div>
            <div>
              <div className="text-xs text-albion-gray-500">Kill Fame</div>
              <div className="text-xl font-bold text-white">
                {stats?.killFame ? `${(stats.killFame / 1000000).toFixed(1)}M` : '0'}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="panel-float"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neon-blue/20">
              <TrendingUp className="h-6 w-6 text-neon-blue" />
            </div>
            <div>
              <div className="text-xs text-albion-gray-500">K/D Ratio</div>
              <div className="text-xl font-bold text-white">{stats?.kdRatio?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="panel-float"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/20">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <div className="text-xs text-albion-gray-500">Defenses Won</div>
              <div className="text-xl font-bold text-white">{guild.DefensesWon?.toLocaleString() || 0}</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="panel-float"
      >
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
          <Users className="h-6 w-6 text-neon-blue" />
          Top Members
        </h2>

        {members.length === 0 ? (
          <p className="py-8 text-center text-sm text-albion-gray-500">No member data available</p>
        ) : (
          <div className="space-y-2">
            {members.slice(0, 10).map((member, index) => (
              <div
                key={member.Id}
                className="flex items-center justify-between rounded-lg bg-albion-gray-800 p-3 transition-colors hover:bg-albion-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-albion-gray-900 text-sm font-bold text-albion-gray-500">
                    #{index + 1}
                  </div>
                  <span className="font-medium text-white">{member.Name}</span>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-albion-gray-500">Kill Fame</div>
                    <div className="font-medium text-neon-gold">
                      {member.KillFame ? `${(member.KillFame / 1000).toFixed(0)}K` : '0'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-albion-gray-500">K/D</div>
                    <div className="font-medium text-white">
                      {member.FameRatio?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
