'use client';

import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { Clock, Swords, Trophy, Skull, MapPin, Users } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: 'kill' | 'death' | 'battle';
  timestamp: string;
  killer?: string;
  victim?: string;
  location?: string;
  fame?: number;
  participants?: number;
}

interface GuildActivityTimelineProps {
  guildId: string;
  guildName: string;
}

export function GuildActivityTimeline({ guildId, guildName }: GuildActivityTimelineProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    loadActivity();
  }, [guildId, timeRange]);

  const loadActivity = async () => {
    setIsLoading(true);
    try {
      // Fetch recent events from Gameinfo API
      const response = await fetch(
        `https://gameinfo.albiononline.com/api/gameinfo/events?guildId=${guildId}&limit=50`
      );

      if (!response.ok) {throw new Error('Failed to fetch events');}

      const data = await response.json();
      
      // Transform events into timeline format
      const timeline: ActivityEvent[] = data.map((event: any) => ({
        id: event.EventId.toString(),
        type: event.Killer?.GuildId === guildId ? 'kill' : 'death',
        timestamp: event.TimeStamp,
        killer: event.Killer?.Name,
        victim: event.Victim?.Name,
        location: event.Location || 'Unknown',
        fame: event.TotalVictimKillFame,
        participants: event.Participants || 1,
      }));

      setEvents(timeline);
    } catch (error) {
      console.error('Failed to load guild activity:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'kill':
        return <Swords className="h-5 w-5 text-neon-green" />;
      case 'death':
        return <Skull className="h-5 w-5 text-red-500" />;
      case 'battle':
        return <Trophy className="h-5 w-5 text-neon-gold" />;
      default:
        return <Clock className="h-5 w-5 text-albion-gray-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'kill':
        return 'border-neon-green bg-neon-green/10';
      case 'death':
        return 'border-red-500 bg-red-500/10';
      case 'battle':
        return 'border-neon-gold bg-neon-gold/10';
      default:
        return 'border-albion-gray-700 bg-albion-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {return `${diffMins}m ago`;}
    if (diffHours < 24) {return `${diffHours}h ago`;}
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-float">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-neon-blue" />
            <div>
              <h2 className="text-2xl font-bold text-white">Activity Timeline</h2>
              <p className="text-sm text-albion-gray-500">
                Recent events for {guildName}
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 rounded-lg bg-albion-gray-800 p-1">
            <button
              onClick={() => setTimeRange('1h')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === '1h'
                  ? 'bg-neon-blue text-white'
                  : 'text-albion-gray-400 hover:text-white'
              }`}
            >
              1 Hour
            </button>
            <button
              onClick={() => setTimeRange('24h')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === '24h'
                  ? 'bg-neon-blue text-white'
                  : 'text-albion-gray-400 hover:text-white'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === '7d'
                  ? 'bg-neon-blue text-white'
                  : 'text-albion-gray-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="panel-float">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-albion-gray-800" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="mx-auto mb-4 h-16 w-16 text-albion-gray-700" />
            <h3 className="mb-2 text-lg font-semibold text-white">No Recent Activity</h3>
            <p className="text-sm text-albion-gray-500">
              No events found for this guild in the selected time range
            </p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-albion-gray-700" />

            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-16"
              >
                {/* Timeline Dot */}
                <div className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-albion-gray-900 bg-albion-gray-800">
                  {getEventIcon(event.type)}
                </div>

                {/* Event Card */}
                <div className={`rounded-lg border p-4 ${getEventColor(event.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {event.type === 'kill' ? 'Kill' : event.type === 'death' ? 'Death' : 'Battle'}
                        </span>
                        <span className="text-xs text-albion-gray-500">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm">
                        {event.killer && event.victim ? <div className="text-albion-gray-300">
                            <span className={event.type === 'kill' ? 'text-neon-green' : 'text-white'}>
                              {event.killer}
                            </span>
                            {' killed '}
                            <span className={event.type === 'death' ? 'text-red-500' : 'text-white'}>
                              {event.victim}
                            </span>
                          </div> : null}

                        {event.location ? <div className="flex items-center gap-1 text-albion-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div> : null}

                        {event.participants && event.participants > 1 ? <div className="flex items-center gap-1 text-albion-gray-500">
                            <Users className="h-3 w-3" />
                            <span>{event.participants} participants</span>
                          </div> : null}
                      </div>
                    </div>

                    {event.fame ? <div className="text-right">
                        <div className="text-xs text-albion-gray-500">Fame</div>
                        <div className="font-bold text-neon-gold">
                          {event.fame >= 1000
                            ? `${(event.fame / 1000).toFixed(1)}K`
                            : event.fame}
                        </div>
                      </div> : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel-float">
            <div className="flex items-center gap-3">
              <Swords className="h-8 w-8 text-neon-green" />
              <div>
                <div className="text-xs text-albion-gray-500">Total Kills</div>
                <div className="text-xl font-bold text-white">
                  {events.filter(e => e.type === 'kill').length}
                </div>
              </div>
            </div>
          </div>

          <div className="panel-float">
            <div className="flex items-center gap-3">
              <Skull className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-xs text-albion-gray-500">Total Deaths</div>
                <div className="text-xl font-bold text-white">
                  {events.filter(e => e.type === 'death').length}
                </div>
              </div>
            </div>
          </div>

          <div className="panel-float">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-neon-gold" />
              <div>
                <div className="text-xs text-albion-gray-500">Total Fame</div>
                <div className="text-xl font-bold text-white">
                  {((events.reduce((sum, e) => sum + (e.fame || 0), 0)) / 1000).toFixed(1)}K
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
