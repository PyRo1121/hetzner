'use client';

import { useState } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Swords, Users, Trophy, Clock, MapPin } from 'lucide-react';

interface BattleParticipant {
  id: string;
  name: string;
  guildName?: string;
  kills: number;
  deaths: number;
  killFame: number;
  equipment: {
    mainHand?: string;
    offHand?: string;
    head?: string;
    armor?: string;
    shoes?: string;
  };
}

interface Battle {
  id: number;
  startTime: string;
  endTime: string;
  totalKills: number;
  totalFame: number;
  players: number;
  guilds: number;
  alliances: number;
  participants: BattleParticipant[];
}

interface BattleAnalysisProps {
  battle: Battle;
}

export function BattleAnalysis({ battle }: BattleAnalysisProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'participants' | 'guilds'>('overview');

  // Calculate battle duration
  const duration = new Date(battle.endTime).getTime() - new Date(battle.startTime).getTime();
  const durationMinutes = Math.floor(duration / 60000);

  // Sort participants by kill fame
  const topParticipants = [...battle.participants]
    .sort((a, b) => b.killFame - a.killFame)
    .slice(0, 10);

  // Group by guild
  const guildStats = battle.participants.reduce((acc, p) => {
    if (!p.guildName) {return acc;}
    
    if (!acc[p.guildName]) {
      acc[p.guildName] = {
        name: p.guildName,
        players: 0,
        kills: 0,
        deaths: 0,
        fame: 0,
      };
    }
    
    acc[p.guildName].players++;
    acc[p.guildName].kills += p.kills;
    acc[p.guildName].deaths += p.deaths;
    acc[p.guildName].fame += p.killFame;
    
    return acc;
  }, {} as Record<string, { name: string; players: number; kills: number; deaths: number; fame: number }>);

  const topGuilds = Object.values(guildStats)
    .sort((a, b) => b.fame - a.fame)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Battle Analysis</h2>
            <p className="text-sm text-albion-gray-500">
              {formatDistanceToNow(new Date(battle.startTime), { addSuffix: true })}
            </p>
          </div>
          <div className="rounded-full bg-red-500/20 px-4 py-2">
            <span className="text-sm font-bold text-red-500">Battle #{battle.id}</span>
          </div>
        </div>

        {/* Battle Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-albion-gray-800 p-4">
            <div className="flex items-center gap-2 text-albion-gray-500">
              <Swords className="h-4 w-4" />
              <span className="text-xs">Total Kills</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{battle.totalKills}</div>
          </div>

          <div className="rounded-lg bg-albion-gray-800 p-4">
            <div className="flex items-center gap-2 text-albion-gray-500">
              <Users className="h-4 w-4" />
              <span className="text-xs">Players</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{battle.players}</div>
          </div>

          <div className="rounded-lg bg-albion-gray-800 p-4">
            <div className="flex items-center gap-2 text-albion-gray-500">
              <Trophy className="h-4 w-4" />
              <span className="text-xs">Total Fame</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-neon-gold">
              {(battle.totalFame / 1000000).toFixed(1)}M
            </div>
          </div>

          <div className="rounded-lg bg-albion-gray-800 p-4">
            <div className="flex items-center gap-2 text-albion-gray-500">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Duration</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{durationMinutes}m</div>
          </div>

          <div className="rounded-lg bg-albion-gray-800 p-4">
            <div className="flex items-center gap-2 text-albion-gray-500">
              <MapPin className="h-4 w-4" />
              <span className="text-xs">Guilds</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{battle.guilds}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-float">
        <div className="flex gap-2 border-b border-albion-gray-700">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'overview'
                ? 'border-b-2 border-neon-blue text-neon-blue'
                : 'text-albion-gray-500 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('participants')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'participants'
                ? 'border-b-2 border-neon-blue text-neon-blue'
                : 'text-albion-gray-500 hover:text-white'
            }`}
          >
            Top Players
          </button>
          <button
            onClick={() => setSelectedTab('guilds')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'guilds'
                ? 'border-b-2 border-neon-blue text-neon-blue'
                : 'text-albion-gray-500 hover:text-white'
            }`}
          >
            Guilds
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {selectedTab === 'overview' ? <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-white">Battle Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-albion-gray-500">Started:</span>
                      <span className="text-white">
                        {new Date(battle.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-albion-gray-500">Ended:</span>
                      <span className="text-white">
                        {new Date(battle.endTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-albion-gray-500">Duration:</span>
                      <span className="text-white">{durationMinutes} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-albion-gray-800 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-white">Participation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-albion-gray-500">Total Players:</span>
                      <span className="text-white">{battle.players}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-albion-gray-500">Guilds Involved:</span>
                      <span className="text-white">{battle.guilds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-albion-gray-500">Alliances:</span>
                      <span className="text-white">{battle.alliances}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div> : null}

          {selectedTab === 'participants' ? <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {topParticipants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-lg bg-albion-gray-800 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-albion-gray-900 text-sm font-bold text-neon-gold">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{participant.name}</div>
                      {participant.guildName ? <div className="text-xs text-albion-gray-500">{participant.guildName}</div> : null}
                    </div>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-albion-gray-500">Kills</div>
                      <div className="font-bold text-neon-green">{participant.kills}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-albion-gray-500">Deaths</div>
                      <div className="font-bold text-red-500">{participant.deaths}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-albion-gray-500">Fame</div>
                      <div className="font-bold text-neon-gold">
                        {(participant.killFame / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-albion-gray-500">K/D</div>
                      <div className="font-bold text-white">
                        {participant.deaths > 0
                          ? (participant.kills / participant.deaths).toFixed(2)
                          : participant.kills.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div> : null}

          {selectedTab === 'guilds' ? <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {topGuilds.map((guild, index) => (
                <div
                  key={guild.name}
                  className="flex items-center justify-between rounded-lg bg-albion-gray-800 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-albion-gray-900 text-sm font-bold text-neon-gold">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{guild.name}</div>
                      <div className="text-xs text-albion-gray-500">{guild.players} players</div>
                    </div>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-albion-gray-500">Kills</div>
                      <div className="font-bold text-neon-green">{guild.kills}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-albion-gray-500">Deaths</div>
                      <div className="font-bold text-red-500">{guild.deaths}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-albion-gray-500">Fame</div>
                      <div className="font-bold text-neon-gold">
                        {(guild.fame / 1000000).toFixed(2)}M
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-albion-gray-500">K/D</div>
                      <div className="font-bold text-white">
                        {guild.deaths > 0
                          ? (guild.kills / guild.deaths).toFixed(2)
                          : guild.kills.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div> : null}
        </div>
      </div>
    </div>
  );
}
