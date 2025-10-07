'use client';

import { useEffect, useMemo, useState } from 'react';

import { useParams } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';
import { Swords, Trophy, Users } from 'lucide-react';

import { GuildProfile } from '@/components/guilds/guild-profile';
import { BattleDetailModal } from '@/components/pvp/modals/BattleDetailModal';
import { GuildDetailModal } from '@/components/pvp/modals/GuildDetailModal';
import { gameinfoClient, type Battle } from '@/lib/api/gameinfo/client';
import {
  getGuildById,
  getGuildMembers,
  getGuildStats,
  type Guild,
  type GuildMember,
} from '@/lib/api/gameinfo/guilds';

export default function GuildPage() {
  const params = useParams<{ id: string }>();
  const guildId = params?.id;

  const [isGuildModalOpen, setGuildModalOpen] = useState(false);
  const [recentBattles, setRecentBattles] = useState<Battle[]>([]);
  const [selectedBattleId, setSelectedBattleId] = useState<number | null>(null);
  const [isBattleModalOpen, setBattleModalOpen] = useState(false);

  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activity' | 'battles'>(
    'overview'
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [g, m, s, battles] = await Promise.all([
          guildId ? getGuildById(guildId) : Promise.resolve(null),
          guildId ? getGuildMembers(guildId) : Promise.resolve([]),
          guildId ? getGuildStats(guildId) : Promise.resolve(null),
          gameinfoClient.getBattles({ range: 'week', limit: 50, sort: 'recent' }),
        ]);
        if (!active) {
          return;
        }
        setGuild(g);
        setMembers(m ?? []);
        setStats(s);
        setRecentBattles(battles ?? []);
      } catch (e: any) {
        if (!active) {
          return;
        }
        setError(e?.message || 'Failed to load guild data');
        setGuild(null);
        setMembers([]);
        setStats(null);
        setRecentBattles([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [guildId]);

  const openBattle = (id: number) => {
    setSelectedBattleId(id);
    setBattleModalOpen(true);
  };

  const kpiCards = useMemo(() => {
    const items = [
      {
        label: 'Kill Fame',
        icon: Trophy,
        value: stats?.killFame ?? 0,
        format: (v: number) => `${(v / 1_000_000).toFixed(1)}M`,
      },
      {
        label: 'Total Kills',
        icon: Swords,
        value: stats?.totalKills ?? 0,
        format: (v: number) => v.toLocaleString(),
      },
      {
        label: 'K/D Ratio',
        icon: Users,
        value: stats?.kdRatio ?? 0,
        format: (v: number) => Number(v).toFixed(2),
      },
    ];
    return items;
  }, [stats]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-neon-blue" />
            <div>
              <h1 className="text-2xl font-bold text-white">{guild?.Name ?? 'Guild'}</h1>
              <div className="text-xs text-albion-gray-500">
                {guild?.AllianceName
                  ? `${guild.AllianceName} ${guild?.AllianceTag ? `(${guild.AllianceTag})` : ''}`
                  : 'No Alliance'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setGuildModalOpen(true)}
            className="rounded-lg bg-neon-blue px-4 py-2 text-sm font-semibold text-white hover:bg-neon-blue/80"
          >
            Open Guild Details
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-float p-2">
        <div className="flex gap-2">
          {['overview', 'members', 'activity', 'battles'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === t ? 'bg-albion-gray-700 text-white' : 'text-albion-gray-400 hover:bg-albion-gray-700 hover:text-white'}`}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <AnimatePresence>
        {!loading && !error ? (
          <div className="grid gap-4 md:grid-cols-3">
            {kpiCards.map(({ label, icon: Icon, value, format }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel-float"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-neon-gold" />
                  <div>
                    <div className="text-xs text-albion-gray-500">{label}</div>
                    <div className="text-xl font-bold text-white">{format(value)}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}
      </AnimatePresence>

      {/* Content */}
      <div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-albion-gray-800" />
            ))}
          </div>
        ) : error ? (
          <div className="panel-float text-red-400">{error}</div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'overview' && <GuildProfile guildId={guildId} />}
            {activeTab === 'members' && (
              <div className="panel-float">
                <div className="mb-3 text-lg font-semibold text-white">Top Members</div>
                <div className="space-y-2">
                  {members.slice(0, 20).map((m) => (
                    <div
                      key={m.Id}
                      className="flex items-center justify-between rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-neon-blue" />
                        <div>
                          <div className="text-sm font-medium text-white">{m.Name}</div>
                          <div className="text-xs text-albion-gray-500">
                            Fame {(m.KillFame ?? 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-neon-gold">
                        {(m.FameRatio ?? 0).toFixed(2)} Ratio
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div className="text-sm text-albion-gray-500">No members data available.</div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'activity' && (
              <div className="panel-float">
                <div className="mb-3 text-lg font-semibold text-white">Weekly Activity</div>
                <div className="space-y-2">
                  {recentBattles.slice(0, 25).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-lg border border-albion-gray-700 bg-albion-gray-800 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Swords className="h-5 w-5 text-neon-red" />
                        <div className="text-sm font-medium text-white">
                          {b.name || `Battle #${b.id}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-albion-gray-500">
                          {new Date(b.startTime).toLocaleString()}
                        </div>
                        <button className="btn-forge" onClick={() => openBattle(b.id)}>
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                  {recentBattles.length === 0 && (
                    <div className="text-sm text-albion-gray-500">No recent battles.</div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'battles' && (
              <div className="panel-float">
                <div className="mb-3 text-lg font-semibold text-white">Recent Battles</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {recentBattles.slice(0, 12).map((b) => (
                    <div
                      key={b.id}
                      className="rounded-lg border border-albion-gray-700 bg-albion-gray-800 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Swords className="h-5 w-5 text-neon-red" />
                          <div className="text-sm font-medium text-white">
                            {b.name || `Battle #${b.id}`}
                          </div>
                        </div>
                        <button className="btn-forge" onClick={() => openBattle(b.id)}>
                          Details
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-albion-gray-500">
                        {new Date(b.startTime).toLocaleString()}
                      </div>
                      <div className="mt-2 text-xs text-neon-blue">
                        Fame {b.totalFame.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {recentBattles.length === 0 && (
                    <div className="text-sm text-albion-gray-500">No battles found.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {isGuildModalOpen ? (
        <GuildDetailModal
          guildId={guildId}
          isOpen={isGuildModalOpen}
          onClose={() => setGuildModalOpen(false)}
        />
      ) : null}
      {isBattleModalOpen && selectedBattleId !== null ? (
        <BattleDetailModal
          battleId={selectedBattleId}
          isOpen={isBattleModalOpen}
          onClose={() => setBattleModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
