import { Swords, Trophy, Activity, Target, Shield } from 'lucide-react';
import { type Metadata } from 'next';

import { AdvancedSearch } from '@/components/pvp/AdvancedSearch';
import { BattleFeed } from '@/components/pvp/BattleFeed';
import { BuildCounterAnalysis } from '@/components/pvp/BuildCounterAnalysis';
import { GvGMatches } from '@/components/pvp/GvGMatches';
import { KillFeed } from '@/components/pvp/KillFeed';
import { PvPMLAnalytics } from '@/components/pvp/PvPMLAnalytics';
import { SearchResults } from '@/components/pvp/SearchResults';
import { TopKills } from '@/components/pvp/TopKills';
import { WeaponRankings } from '@/components/pvp/WeaponRankings';

export const metadata: Metadata = {
  title: 'PvP Hub | Albion Online Dashboard',
  description: 'PvP statistics, leaderboards, and battle analysis',
};

export default function PvPPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-center gap-3">
          <Swords className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold text-white">PvP Hub</h1>
            <p className="text-sm text-albion-gray-500">
              Comprehensive PvP analytics, real-time feeds, and battle intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="panel-float">
        <div className="flex flex-wrap gap-2 p-1 bg-albion-gray-800 rounded-lg">
          <button className="flex-1 px-4 py-3 text-sm font-medium text-white bg-neon-red rounded-md">
            <Activity className="inline h-4 w-4 mr-2" />
            Live Feed
          </button>
          <button className="flex-1 px-4 py-3 text-sm font-medium text-albion-gray-400 hover:text-white hover:bg-albion-gray-700 rounded-md transition-colors">
            <Trophy className="inline h-4 w-4 mr-2" />
            Leaderboards
          </button>
          <button className="flex-1 px-4 py-3 text-sm font-medium text-albion-gray-400 hover:text-white hover:bg-albion-gray-700 rounded-md transition-colors">
            <Target className="inline h-4 w-4 mr-2" />
            Weapons
          </button>
          <button className="flex-1 px-4 py-3 text-sm font-medium text-albion-gray-400 hover:text-white hover:bg-albion-gray-700 rounded-md transition-colors">
            <Shield className="inline h-4 w-4 mr-2" />
            GvG
          </button>
        </div>
      </div>

      {/* Live Feed Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <KillFeed autoRefresh refreshInterval={30000} />
        <SearchResults />
      </div>

      <AdvancedSearch />

      <BattleFeed range="day" />

      {/* ML Analytics Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PvPMLAnalytics features={{
          killerAvgIP: 1800,
          victimAvgIP: 1600,
          killerGuildSize: 45,
          victimGuildSize: 32,
          timeOfDay: 19,
          location: 'Bridgewatch',
          killerWeaponType: 'sword',
          victimWeaponType: 'staff',
          qualityDifference: 2,
        }} />
        <BuildCounterAnalysis buildId="sword_axe" buildName="Sword & Axe Hybrid" />
      </div>

      {/* Weapon Rankings */}
      <WeaponRankings range="week" />

      {/* Top Kills */}
      <TopKills range="week" />

      {/* GvG Matches */}
      <GvGMatches type="next" />

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="panel-float">
          <h3 className="mb-2 font-semibold text-neon-blue">Real-Time Updates</h3>
          <p className="text-sm text-albion-gray-500">
            Kill feed updates every 30 seconds with the latest PvP action from Gameinfo API
          </p>
        </div>

        <div className="panel-float">
          <h3 className="mb-2 font-semibold text-neon-gold">Comprehensive Stats</h3>
          <p className="text-sm text-albion-gray-500">
            Track K/D ratios, kill fame, weapon performance, and guild warfare across all servers
          </p>
        </div>
      </div>
    </div>
  );
}
