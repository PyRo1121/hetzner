'use client';

import { useEffect, useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Flame,
  Layers,
  Sparkles,
  Swords,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

import { EquipmentDisplay, type Equipment } from '@/components/pvp/equipment-display';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/backend/supabase/clients';

type Trend = 'rising' | 'falling' | 'stable';

interface EnrichedBuild {
  id: string;
  displayName: string;
  gearLine: string;
  stats: {
    totalKills: number;
    totalDeaths: number;
    winRate: number;
    popularity: number;
    avgFame: number;
    avgTier: number;
    sampleSize: number;
  };
  trend: Trend;
  isHealer: boolean;
  names: {
    weapon: string;
    head: string;
    armor: string;
    shoes: string;
    cape: string;
  };
  types: {
    weapon: string | null;
    head: string | null;
    armor: string | null;
    shoes: string | null;
    cape: string | null;
  };
  counters: string[];
  counteredBy: string[];
}

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function buildBadgeStyles(trend: Trend): { label: string; className: string } {
  switch (trend) {
    case 'rising':
      return {
        label: 'Trending Up',
        className: 'bg-neon-green/15 text-neon-green border-neon-green/40',
      };
    case 'falling':
      return {
        label: 'Losing Steam',
        className: 'bg-neon-red/15 text-neon-red border-neon-red/40',
      };
    default:
      return {
        label: 'Stable Meta',
        className: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30',
      };
  }
}

function calculateKd(kills: number, deaths: number): number {
  if (deaths === 0) {
    return kills;
  }
  return Number((kills / deaths).toFixed(2));
}

interface HighlightStat {
  label: string;
  icon: React.ReactNode;
  value: string;
  tone: 'primary' | 'secondary';
}

export function MetaBuilds() {
  const [builds, setBuilds] = useState<EnrichedBuild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'rising' | 'falling' | 'healers'>('all');
  const [selectedBuild, setSelectedBuild] = useState<EnrichedBuild | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);

        // Use the cached API endpoint instead of direct DB queries
        const response = await fetch('/api/pvp/meta-builds?minSample=5');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          console.warn('[MetaBuilds] No builds found');
          setBuilds([]);
          return;
        }

        // API already returns enriched data with names!
        const enriched = result.data.map((build: any) => {
          let trend: Trend = 'stable';
          if (build.winRate > 0.6 && build.popularity > 0.05) {
            trend = 'rising';
          } else if (build.winRate < 0.45 || build.popularity < 0.01) {
            trend = 'falling';
          }

          return {
            id: build.buildId,
            displayName: `${build.weaponName} Build`,
            gearLine: [build.weaponName, build.headName, build.armorName, build.shoesName]
              .filter(Boolean)
              .join(' • '),
            stats: {
              totalKills: build.kills,
              totalDeaths: build.deaths,
              winRate: build.winRate,
              popularity: build.popularity,
              avgFame: build.avgFame,
              avgTier: 0,
              sampleSize: build.sampleSize,
            },
            trend,
            isHealer: Boolean(build.isHealer),
            names: {
              weapon: build.weaponName,
              head: build.headName,
              armor: build.armorName,
              shoes: build.shoesName,
              cape: build.capeName,
            },
            types: {
              weapon: build.weaponType,
              head: build.headType,
              armor: build.armorType,
              shoes: build.shoesType,
              cape: build.capeType,
            },
            counters: [],
            counteredBy: [],
          };
        }) as EnrichedBuild[];

        setBuilds(enriched);
      } catch (_error) {
        console.error('[MetaBuilds] Failed to load meta builds:', _error);
        setBuilds([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();

    // Subscribe to real-time updates with debounce
    let reloadTimeout: NodeJS.Timeout;
    const channel = supabase
      .channel('meta_builds_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meta_builds' }, () => {
        // Debounce reloads - builds don't change frequently
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
          void loadInitialData();
        }, 5000); // Wait 5s before reloading
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filteredBuilds = useMemo(() => {
    const filtered = builds.filter((build) => {
      if (filter === 'rising') {
        return build.trend === 'rising';
      }
      if (filter === 'falling') {
        return build.trend === 'falling';
      }
      if (filter === 'healers') {
        return build.isHealer;
      }
      return true;
    });

    return filtered; // Show all builds, no limit
  }, [builds, filter]);

  const aggregateStats = useMemo(() => {
    if (builds.length === 0) {
      return {
        totalBuilds: 0,
        totalKills: 0,
        risingShare: 0,
        avgWinRate: 0,
      };
    }

    const totalKills = builds.reduce((sum, build) => sum + build.stats.totalKills, 0);
    const avgWinRate = builds.reduce((sum, build) => sum + build.stats.winRate, 0) / builds.length;
    const risingCount = builds.filter((build) => build.trend === 'rising').length;

    return {
      totalBuilds: builds.length,
      totalKills,
      risingShare: (risingCount / builds.length) * 100,
      avgWinRate,
    };
  }, [builds]);

  const highlightStats: HighlightStat[] = [
    {
      label: 'Meta Builds Tracked',
      icon: <Layers className="h-4 w-4 text-neon-blue" />,
      value: numberFormatter.format(aggregateStats.totalBuilds),
      tone: 'secondary',
    },
    {
      label: 'Total Kill Volume',
      icon: <Swords className="h-4 w-4 text-neon-red" />,
      value: numberFormatter.format(aggregateStats.totalKills),
      tone: 'primary',
    },
    {
      label: 'Average Win Rate',
      icon: <Target className="h-4 w-4 text-neon-green" />,
      value: `${percentFormatter.format(aggregateStats.avgWinRate)}%`,
      tone: 'secondary',
    },
    {
      label: 'Rising Share',
      icon: <TrendingUp className="text-neon-orange h-4 w-4" />,
      value: `${percentFormatter.format(aggregateStats.risingShare)}%`,
      tone: 'secondary',
    },
  ];

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="space-y-4">
          <div className="h-8 w-56 animate-pulse rounded bg-albion-gray-800" />
          <div className="h-64 animate-pulse rounded bg-albion-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float space-y-6">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-neon-blue/20 p-3">
              <Flame className="h-7 w-7 text-neon-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Meta Build Observatory</h2>
              <p className="text-albion-gray-400 text-sm">
                Live build intelligence across {numberFormatter.format(builds.length)} archetypes •{' '}
                {numberFormatter.format(aggregateStats.totalKills)} kills captured this window
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {highlightStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-albion-gray-800 bg-albion-gray-900/60 p-4 backdrop-blur"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-albion-gray-500">
                  {stat.icon}
                  <span>{stat.label}</span>
                </div>
                <p
                  className={`mt-2 text-2xl font-bold ${stat.tone === 'primary' ? 'text-neon-orange' : 'text-white'}`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 rounded-xl border border-albion-gray-800 bg-albion-gray-900/60 p-4 backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-albion-gray-500">
            <Sparkles className="text-neon-orange h-4 w-4" />
            Focus Filter
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'rising', 'falling', 'healers'] as const).map((value) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                    active
                      ? 'shadow-neon bg-neon-blue text-black'
                      : 'bg-albion-gray-850 text-albion-gray-300 hover:text-white'
                  }`}
                >
                  {value === 'all' ? 'All Builds' : null}
                  {value === 'rising' ? 'Surging' : null}
                  {value === 'falling' ? 'Cooling' : null}
                  {value === 'healers' ? 'Healers' : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredBuilds.map((build, index) => {
          const badge = buildBadgeStyles(build.trend);
          const kd = calculateKd(build.stats.totalKills, build.stats.totalDeaths);

          return (
            <motion.button
              key={build.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedBuild(build)}
              className="to-albion-gray-950 hover:shadow-neon group relative overflow-hidden rounded-2xl border border-albion-gray-800 bg-gradient-to-br from-albion-gray-900/90 via-albion-gray-900 p-5 text-left transition-shadow hover:border-neon-blue/50"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(21,187,255,0.18),_transparent_60%)]" />
              </div>

              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-albion-gray-500">
                    <span className="rounded-full bg-neon-blue/15 px-2 py-1 text-neon-blue">
                      #{index + 1}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{build.displayName}</h3>
                    <p className="mt-1 text-xs text-albion-gray-500">{build.gearLine}</p>
                  </div>

                  <div className="text-albion-gray-400 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-albion-gray-900/70 px-3 py-2">
                      <p className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-neon-green">
                        <Target className="h-3 w-3" /> Win Rate
                      </p>
                      <p className="text-base font-semibold text-white">
                        {percentFormatter.format(build.stats.winRate)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-albion-gray-900/70 px-3 py-2">
                      <p className="text-neon-orange flex items-center gap-1 text-[0.65rem] uppercase tracking-wide">
                        <Users className="h-3 w-3" /> Popularity
                      </p>
                      <p className="text-neon-orange text-base font-semibold">
                        {percentFormatter.format(build.stats.popularity)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-albion-gray-900/70 px-3 py-2">
                      <p className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-albion-gray-500">
                        <Swords className="h-3 w-3" /> Kill Volume
                      </p>
                      <p className="text-base font-semibold text-white">
                        {numberFormatter.format(build.stats.totalKills)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-albion-gray-900/70 px-3 py-2">
                      <p className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-neon-red">
                        <Activity className="h-3 w-3" /> K/D Ratio
                      </p>
                      <p className="text-base font-semibold text-neon-red">{kd}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 text-right text-xs text-albion-gray-500">
                  <div className="rounded-lg bg-albion-gray-900/70 px-3 py-2">
                    <p className="text-[0.6rem] uppercase tracking-wide">Sample Size</p>
                    <p className="text-sm font-semibold text-neon-blue">
                      {numberFormatter.format(build.stats.sampleSize)} matches
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </section>

      {filteredBuilds.length === 0 ? (
        <div className="rounded-xl border border-albion-gray-800 bg-albion-gray-900/60 p-12 text-center text-sm text-albion-gray-500">
          No builds match the selected signal filter yet. Adjust filters to explore the wider meta.
        </div>
      ) : null}

      <Dialog open={!!selectedBuild} onOpenChange={() => setSelectedBuild(null)}>
        <DialogContent className="bg-albion-gray-950/95 max-w-4xl border border-neon-blue/40 text-white backdrop-blur">
          {selectedBuild ? (
            <BuildInsights build={selectedBuild} onClose={() => setSelectedBuild(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BuildInsightsProps {
  build: EnrichedBuild;
  onClose: () => void;
}

function BuildInsights({ build, onClose }: BuildInsightsProps) {
  const kd = calculateKd(build.stats.totalKills, build.stats.totalDeaths);

  // Convert build types to Equipment format
  const equipment: Equipment = {
    MainHand: build.types.weapon ? { Type: build.types.weapon } : null,
    Head: build.types.head ? { Type: build.types.head } : null,
    Armor: build.types.armor ? { Type: build.types.armor } : null,
    Shoes: build.types.shoes ? { Type: build.types.shoes } : null,
    Cape: build.types.cape ? { Type: build.types.cape } : null,
  };

  return (
    <div className="space-y-7">
      <DialogHeader>
        <DialogTitle className="flex flex-col gap-3 text-3xl font-black text-white">
          <span className="flex items-center gap-3 text-base font-semibold text-neon-blue">
            <Zap className="h-5 w-5" /> Meta Intelligence Report
          </span>
          <span className="flex items-center gap-3">
            {build.displayName}
            {build.isHealer ? (
              <span className="rounded-full bg-neon-green/15 px-3 py-1 text-sm font-semibold text-neon-green">
                Healer
              </span>
            ) : null}
            {build.trend === 'rising' ? (
              <span className="rounded-full bg-neon-green/15 px-3 py-1 text-sm font-semibold text-neon-green">
                Trending Up
              </span>
            ) : build.trend === 'falling' ? (
              <span className="rounded-full bg-neon-red/15 px-3 py-1 text-sm font-semibold text-neon-red">
                Cooling Off
              </span>
            ) : (
              <span className="rounded-full bg-neon-blue/15 px-3 py-1 text-sm font-semibold text-neon-blue">
                Stable Share
              </span>
            )}
          </span>
          <p className="text-albion-gray-400 text-sm">{build.gearLine}</p>
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InsightCard
              title="Win Rate"
              subtitle="Success against all tracked builds"
              value={`${percentFormatter.format(build.stats.winRate)}%`}
              accent="text-neon-green"
              icon={<Target className="h-4 w-4 text-neon-green" />}
            />
            <InsightCard
              title="Popularity"
              subtitle="Share of total killer events"
              value={`${percentFormatter.format(build.stats.popularity)}%`}
              accent="text-neon-orange"
              icon={<Users className="text-neon-orange h-4 w-4" />}
            />
            <InsightCard
              title="Kill / Death"
              subtitle={`${numberFormatter.format(build.stats.totalKills)} kills · ${numberFormatter.format(build.stats.totalDeaths)} deaths`}
              value={kd.toString()}
              accent="text-neon-red"
              icon={<Activity className="h-4 w-4 text-neon-red" />}
            />
            <InsightCard
              title="Avg Fame"
              subtitle="Per match contribution"
              value={numberFormatter.format(build.stats.avgFame)}
              accent="text-neon-blue"
              icon={<Trophy className="h-4 w-4 text-neon-blue" />}
            />
          </div>

          <div className="border-albion-gray-850 rounded-xl border bg-albion-gray-900/70 p-5">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <BarChart3 className="text-neon-orange h-4 w-4" /> Gear Loadout
            </h4>
            <EquipmentDisplay equipment={equipment} showInventory={false} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-neon-blue/30 bg-albion-gray-900/70 p-5">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neon-blue">
              <Users className="h-4 w-4" /> Sample & Tier
            </h4>
            <p className="text-xs text-albion-gray-500">Sample Size</p>
            <p className="text-lg font-semibold text-white">
              {numberFormatter.format(build.stats.sampleSize)} engagements
            </p>
            <p className="mt-4 text-xs text-albion-gray-500">Average Item Tier</p>
            <p className="text-lg font-semibold text-neon-blue">T{build.stats.avgTier}</p>
          </div>

          <CounterList title="Favored Against" counters={build.counters} tone="positive" />
          <CounterList title="Struggles Against" counters={build.counteredBy} tone="negative" />
        </aside>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="rounded-xl border border-neon-blue/50 px-4 py-2 text-sm font-semibold text-neon-blue transition-colors hover:bg-neon-blue hover:text-black"
        >
          Close Insights
        </button>
      </div>
    </div>
  );
}

interface InsightCardProps {
  title: string;
  subtitle: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}

function InsightCard({ title, subtitle, value, icon, accent }: InsightCardProps) {
  return (
    <div className="border-albion-gray-850 rounded-xl border bg-albion-gray-900/60 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-albion-gray-500">
        {icon}
        <span>{title}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-albion-gray-500">{subtitle}</p>
    </div>
  );
}

interface CounterListProps {
  title: string;
  counters: string[];
  tone: 'positive' | 'negative';
}

function CounterList({ title, counters, tone }: CounterListProps) {
  const toneClass = tone === 'positive' ? 'text-neon-green' : 'text-neon-red';
  const borderClass = tone === 'positive' ? 'border-neon-green/40' : 'border-neon-red/40';
  const bgClass = tone === 'positive' ? 'bg-neon-green/10' : 'bg-neon-red/10';
  const Icon = tone === 'positive' ? TrendingUp : TrendingDown;

  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} p-5`}>
      <h4 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${toneClass}`}>
        <Icon className="h-4 w-4" /> {title}
      </h4>
      {counters.length === 0 ? (
        <p className="text-xs text-albion-gray-500">Insufficient matchup data yet.</p>
      ) : (
        <ul className="space-y-2 text-sm text-white">
          {counters.slice(0, 5).map((counter) => (
            <li key={counter} className="rounded-lg bg-albion-gray-900/70 px-3 py-2 text-xs">
              {counter}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
