import { Users, Trophy, TrendingUp, Search } from 'lucide-react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guilds | Albion Online Dashboard',
  description: 'Guild rankings, profiles, and statistics',
};

export default function GuildsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-neon-blue" />
          <div>
            <h1 className="text-3xl font-bold text-white">Guild Hub</h1>
            <p className="text-sm text-albion-gray-500">
              Explore guild rankings, profiles, and statistics
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <a
          href="/guilds/rankings"
          className="panel-float group transition-all hover:scale-105 hover:border-neon-blue"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neon-gold/20 transition-colors group-hover:bg-neon-gold/30">
              <Trophy className="h-8 w-8 text-neon-gold" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Guild Rankings</h3>
              <p className="text-sm text-albion-gray-500">
                Top guilds by performance
              </p>
            </div>
          </div>
        </a>

        <a
          href="/guilds/search"
          className="panel-float group transition-all hover:scale-105 hover:border-neon-green"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neon-green/20 transition-colors group-hover:bg-neon-green/30">
              <Search className="h-8 w-8 text-neon-green" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Guild Search</h3>
              <p className="text-sm text-albion-gray-500">
                Find and explore guilds
              </p>
            </div>
          </div>
        </a>

        <a
          href="/guilds/comparison"
          className="panel-float group transition-all hover:scale-105 hover:border-neon-blue"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neon-blue/20 transition-colors group-hover:bg-neon-blue/30">
              <TrendingUp className="h-8 w-8 text-neon-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Guild Comparison</h3>
              <p className="text-sm text-albion-gray-500">
                Compare guild statistics
              </p>
            </div>
          </div>
        </a>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="panel-float">
          <h3 className="mb-3 text-lg font-semibold text-white">Guild Features</h3>
          <ul className="space-y-2 text-sm text-albion-gray-400">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-neon-blue" />
              Comprehensive guild profiles with statistics
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-neon-blue" />
              Real-time activity timelines from PvP events
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-neon-blue" />
              Guild vs guild battle history
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-neon-blue" />
              Member rankings and performance tracking
            </li>
          </ul>
        </div>

        <div className="panel-float">
          <h3 className="mb-3 text-lg font-semibold text-white">How to Use</h3>
          <ol className="space-y-2 text-sm text-albion-gray-400">
            <li className="flex gap-2">
              <span className="font-bold text-neon-blue">1.</span>
              <span>Search for guilds by name or browse rankings</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-neon-blue">2.</span>
              <span>View detailed guild profiles and statistics</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-neon-blue">3.</span>
              <span>Compare guilds side-by-side</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-neon-blue">4.</span>
              <span>Track guild activity and recent battles</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
