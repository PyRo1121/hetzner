'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import { Users, Trophy, Swords, Shield, TrendingUp, ArrowRight } from 'lucide-react';

import { compareGuilds, type Guild } from '@/lib/api/gameinfo/guilds';

import { GuildSearch } from './guild-search';

export function GuildComparison() {
  const [guild1, setGuild1] = useState<Guild | null>(null);
  const [guild2, setGuild2] = useState<Guild | null>(null);
  const [stats1, setStats1] = useState<any>(null);
  const [stats2, setStats2] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleCompare = async () => {
    if (!guild1 || !guild2) {return;}

    setIsComparing(true);
    try {
      const comparison = await compareGuilds(guild1.Id, guild2.Id);
      setStats1(comparison.stats1);
      setStats2(comparison.stats2);
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setIsComparing(false);
    }
  };

  const ComparisonStat = ({ 
    label, 
    value1, 
    value2, 
    icon: Icon,
    formatter = (v: number) => v.toLocaleString()
  }: any) => {
    const winner = value1 > value2 ? 1 : value1 < value2 ? 2 : 0;

    return (
      <div className="flex items-center gap-4 rounded-lg bg-albion-gray-800 p-4">
        <div className={`flex-1 text-right ${winner === 1 ? 'text-neon-green' : 'text-white'}`}>
          <div className="text-2xl font-bold">{formatter(value1)}</div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Icon className="h-5 w-5 text-albion-gray-500" />
          <div className="text-xs text-albion-gray-500">{label}</div>
        </div>

        <div className={`flex-1 text-left ${winner === 2 ? 'text-neon-green' : 'text-white'}`}>
          <div className="text-2xl font-bold">{formatter(value2)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <h2 className="mb-4 text-2xl font-bold text-white">Guild Comparison</h2>
        <p className="text-sm text-albion-gray-500">
          Compare two guilds side-by-side to see their stats and performance
        </p>
      </div>

      {/* Guild Selection */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-albion-gray-400">Guild 1</h3>
          <GuildSearch onSelectGuild={setGuild1} />
          {guild1 ? <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="panel-float"
            >
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-neon-blue" />
                <div>
                  <div className="font-bold text-white">{guild1.Name}</div>
                  <div className="text-xs text-albion-gray-500">
                    {guild1.MemberCount} members
                  </div>
                </div>
              </div>
            </motion.div> : null}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-albion-gray-400">Guild 2</h3>
          <GuildSearch onSelectGuild={setGuild2} />
          {guild2 ? <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="panel-float"
            >
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-neon-blue" />
                <div>
                  <div className="font-bold text-white">{guild2.Name}</div>
                  <div className="text-xs text-albion-gray-500">
                    {guild2.MemberCount} members
                  </div>
                </div>
              </div>
            </motion.div> : null}
        </div>
      </div>

      {/* Compare Button */}
      {guild1 && guild2 ? <div className="flex justify-center">
          <button
            onClick={handleCompare}
            disabled={isComparing}
            className="btn-forge flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            {isComparing ? 'Comparing...' : 'Compare Guilds'}
          </button>
        </div> : null}

      {/* Comparison Results */}
      {stats1 && stats2 ? <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="panel-float">
            <h3 className="mb-4 text-lg font-bold text-white">Comparison Results</h3>
            
            <div className="space-y-3">
              <ComparisonStat
                label="Total Kills"
                value1={stats1.totalKills}
                value2={stats2.totalKills}
                icon={Swords}
              />

              <ComparisonStat
                label="Kill Fame"
                value1={stats1.killFame}
                value2={stats2.killFame}
                icon={Trophy}
                formatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
              />

              <ComparisonStat
                label="K/D Ratio"
                value1={stats1.kdRatio}
                value2={stats2.kdRatio}
                icon={TrendingUp}
                formatter={(v: number) => v.toFixed(2)}
              />

              <ComparisonStat
                label="Total Deaths"
                value1={stats1.totalDeaths}
                value2={stats2.totalDeaths}
                icon={Shield}
              />
            </div>
          </div>

          {/* Winner Declaration */}
          <div className="panel-float text-center">
            <div className="text-sm text-albion-gray-500">Overall Winner</div>
            <div className="mt-2 text-3xl font-bold text-neon-gold">
              {stats1.killFame > stats2.killFame ? guild1?.Name : guild2?.Name}
            </div>
            <div className="mt-1 text-xs text-albion-gray-500">
              Based on total kill fame
            </div>
          </div>
        </motion.div> : null}
    </div>
  );
}
