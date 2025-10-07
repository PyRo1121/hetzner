'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Swords, Activity } from 'lucide-react';

interface StatsOverviewProps {
  marketVolume?: number;
  activePlayers?: number;
  recentKills?: number;
  topOpportunities?: number;
  isLoading?: boolean;
}

export function StatsOverview({
  marketVolume = 0,
  activePlayers = 0,
  recentKills = 0,
  topOpportunities = 0,
  isLoading = false,
}: StatsOverviewProps) {
  const stats = [
    {
      label: 'Market Volume (24h)',
      value: marketVolume >= 1000000 ? `${(marketVolume / 1000000).toFixed(1)}M` : `${(marketVolume / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      color: 'text-neon-blue',
      bgColor: 'bg-neon-blue/20',
    },
    {
      label: 'Active Players',
      value: activePlayers.toLocaleString(),
      icon: Users,
      color: 'text-neon-green',
      bgColor: 'bg-neon-green/20',
    },
    {
      label: 'Recent Kills (1h)',
      value: recentKills.toLocaleString(),
      icon: Swords,
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
    },
    {
      label: 'Trade Opportunities',
      value: topOpportunities.toLocaleString(),
      icon: Activity,
      color: 'text-neon-gold',
      bgColor: 'bg-neon-gold/20',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="panel-float"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-albion-gray-500">{stat.label}</p>
              {isLoading ? (
                <div className="mt-2 h-8 w-20 animate-pulse rounded bg-albion-gray-700" />
              ) : (
                <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              )}
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
