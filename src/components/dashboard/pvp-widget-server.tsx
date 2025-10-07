import Link from 'next/link';

import { Swords, Skull, Trophy } from 'lucide-react';

import { supabase } from '@/backend/supabase/clients';

async function getRecentKills() {
  const { data } = await supabase
    .from('pvp_kills')
    .select('id, killer_name, victim_name, total_fame, timestamp')
    .order('timestamp', { ascending: false })
    .limit(5);

  if (!data) {
    return [];
  }

  return data.map(kill => ({
    id: kill.id,
    killer: kill.killer_name || 'Unknown',
    victim: kill.victim_name || 'Unknown',
    fame: kill.total_fame || 0,
    timestamp: kill.timestamp,
  }));
}

function formatFame(fame: number) {
  if (fame >= 1000000) {
    return `${(fame / 1000000).toFixed(1)}M`;
  }
  if (fame >= 1000) {
    return `${(fame / 1000).toFixed(0)}K`;
  }
  return fame.toString();
}

export async function PvPWidgetServer() {
  const recentKills = await getRecentKills();

  return (
    <div className="panel-float">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-white">Recent Kills</h3>
        </div>
        <Link
          href="/dashboard/pvp/kills"
          className="text-sm text-neon-blue hover:underline"
        >
          View All
        </Link>
      </div>

      {recentKills.length === 0 ? (
        <div className="py-8 text-center">
          <Skull className="mx-auto mb-2 h-8 w-8 text-albion-gray-700" />
          <p className="text-sm text-albion-gray-500">No recent kills</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentKills.map((kill) => (
            <div
              key={kill.id}
              className="flex items-center justify-between rounded-lg bg-albion-gray-800 p-3 transition-colors hover:bg-albion-gray-700"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-neon-green">{kill.killer}</span>
                  <Swords className="h-3 w-3 text-albion-gray-500" />
                  <span className="text-red-500">{kill.victim}</span>
                </div>
                <div className="text-xs text-albion-gray-500">
                  {new Date(kill.timestamp).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-neon-gold" />
                <span className="text-sm font-bold text-neon-gold">
                  {formatFame(kill.fame)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
