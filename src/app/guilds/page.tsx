'use client';

import { useState } from 'react';

import Link from 'next/link';

import { LineChart, Search, Trophy, Users } from 'lucide-react';

import { GuildLeaderboards } from '@/components/pvp/guild-leaderboards';
import { RecentBattles } from '@/components/pvp/recent-battles';

export default function GuildHubPage() {
  const [_, setHover] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="panel-float">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-neon-purple" />
            <div>
              <h1 className="text-2xl font-bold text-white">Guild Hub</h1>
              <p className="text-sm text-albion-gray-500">
                Explore guild rankings, profiles, activity, and battles
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/guilds/rankings" className="group">
            <div
              onMouseEnter={() => setHover('rankings')}
              onMouseLeave={() => setHover(null)}
              className="panel-float flex items-center gap-3 transition-colors hover:border-neon-gold hover:bg-albion-gray-800/60"
            >
              <div className="rounded-lg bg-neon-gold/20 p-2">
                <Trophy className="h-5 w-5 text-neon-gold" />
              </div>
              <div>
                <p className="font-semibold text-white">Guild Rankings</p>
                <p className="text-sm text-albion-gray-500">Top guilds by performance</p>
              </div>
            </div>
          </Link>

          <Link href="/guilds/search" className="group">
            <div
              onMouseEnter={() => setHover('search')}
              onMouseLeave={() => setHover(null)}
              className="panel-float flex items-center gap-3 transition-colors hover:border-neon-blue hover:bg-albion-gray-800/60"
            >
              <div className="rounded-lg bg-neon-blue/20 p-2">
                <Search className="h-5 w-5 text-neon-blue" />
              </div>
              <div>
                <p className="font-semibold text-white">Guild Search</p>
                <p className="text-sm text-albion-gray-500">Find and explore guilds</p>
              </div>
            </div>
          </Link>

          <Link href="/guilds/comparison" className="group">
            <div
              onMouseEnter={() => setHover('comparison')}
              onMouseLeave={() => setHover(null)}
              className="panel-float flex items-center gap-3 transition-colors hover:border-neon-purple hover:bg-albion-gray-800/60"
            >
              <div className="rounded-lg bg-neon-purple/20 p-2">
                <LineChart className="h-5 w-5 text-neon-purple" />
              </div>
              <div>
                <p className="font-semibold text-white">Guild Comparison</p>
                <p className="text-sm text-albion-gray-500">Compare guild statistics</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Leaderboards */}
      <GuildLeaderboards />

      {/* Recent Battles */}
      <RecentBattles />
    </div>
  );
}