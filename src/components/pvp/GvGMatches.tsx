'use client';

import { useEffect, useState } from 'react';

import { Shield, Clock, Trophy } from 'lucide-react';

import { gameinfoClient } from '@/lib/api/gameinfo/client';

interface GvGMatchesProps {
  type?: 'top' | 'next' | 'past';
}

export function GvGMatches({ type = 'next' }: GvGMatchesProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setError(null);
        setLoading(true);
        let data: any[] = [];
        if (type === 'top') {
          data = await gameinfoClient.getGuildMatchesTop();
        } else if (type === 'next') {
          data = await gameinfoClient.getGuildMatchesNext({ limit: 20, offset: 0 });
        } else {
          data = await gameinfoClient.getGuildMatchesPast({ limit: 20, offset: 0 });
        }
        setMatches(data);
      } catch (err) {
        setError('Failed to load GvG matches');
        console.error('GvG matches error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [type]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) {
      return `Started ${Math.abs(diffMins)}m ago`;
    }
    if (diffMins < 60) {return `Starts in ${diffMins}m`;}
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {return `Starts in ${diffHours}h`;}
    return date.toLocaleDateString();
  };

  const getMatchTypeLabel = () => {
    switch (type) {
      case 'top': return 'Top Matches';
      case 'next': return 'Upcoming Matches';
      case 'past': return 'Recent Matches';
      default: return 'Matches';
    }
  };

  if (loading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-albion-gray-800" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded bg-albion-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-float">
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-neon-gold" />
          <div>
            <h3 className="text-xl font-bold">GvG {getMatchTypeLabel()}</h3>
            <p className="text-sm text-albion-gray-500">
              Guild vs Guild battle schedule and results
            </p>
          </div>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-3">
        {matches.map((match, index) => (
          <div
            key={`${match.id || index}-${match.startTime}`}
            className="p-4 bg-albion-gray-800/50 rounded-lg border border-albion-gray-700 hover:bg-albion-gray-800 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold text-white">
                  {`GvG Battle #${match.id ?? ''}`}
                </div>
                {match.tier ? <span className={`px-2 py-1 rounded text-xs font-medium ${
                    match.tier === 8 ? 'bg-neon-gold text-black' :
                    match.tier === 7 ? 'bg-purple-500 text-white' :
                    match.tier === 6 ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    T{match.tier}
                  </span> : null}
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-albion-gray-500" />
                <span className="text-sm text-albion-gray-400">
                  {formatTime(match.startTime)}
                </span>
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="p-3 bg-albion-gray-900/50 rounded">
                <div className="text-sm font-medium text-neon-blue mb-2">Team A</div>
                <div className="space-y-1">
                  {match.teamA?.GuildName ? (
                    <div className="text-sm text-albion-gray-400">{match.teamA.GuildName}</div>
                  ) : null}
                </div>
              </div>

              <div className="p-3 bg-albion-gray-900/50 rounded">
                <div className="text-sm font-medium text-neon-red mb-2">Team B</div>
                <div className="space-y-1">
                  {match.teamB?.GuildName ? (
                    <div className="text-sm text-albion-gray-400">{match.teamB.GuildName}</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Match Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {match.totalFame ? <div className="flex items-center gap-1 text-albion-gray-500">
                    <Trophy className="h-4 w-4" />
                    <span>{(match.totalFame / 1000000).toFixed(1)}M fame</span>
                  </div> : null}
              </div>

              <div className="text-albion-gray-600">
                {match.matchType?.toUpperCase() || 'GvG'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-12 text-albion-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No {type} matches found</p>
        </div>
      )}

      {/* Match Type Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-albion-gray-500">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-neon-gold" />
          <span>Tier 8 (Legendary)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-purple-500" />
          <span>Tier 7 (Epic)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span>Tier 6 (Rare)</span>
        </div>
      </div>
    </div>
  );
}
