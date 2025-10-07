'use client';

import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { Server, Users, Activity } from 'lucide-react';

interface ServerStatus {
  online: boolean;
  playerCount: number;
  maxPlayers: number;
  ping: number;
}

export function ServerStatusWidget() {
  const [status, setStatus] = useState<ServerStatus>({
    online: true,
    playerCount: 8432,
    maxPlayers: 10000,
    ping: 45,
  });

  // Simulate status updates - reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        playerCount: Math.floor(prev.playerCount + (Math.random() - 0.5) * 100),
        ping: Math.floor(prev.ping + (Math.random() - 0.5) * 10),
      }));
    }, 30000); // Changed from 10s to 30s

    return () => clearInterval(interval);
  }, []);

  const playerPercentage = (status.playerCount / status.maxPlayers) * 100;

  return (
    <div className="panel-float">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Server Status</h3>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`h-2 w-2 rounded-full ${status.online ? 'bg-neon-green' : 'bg-red-500'}`}
          />
          <span className={`text-xs font-medium ${status.online ? 'text-neon-green' : 'text-red-500'}`}>
            {status.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Player Count */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-blue/20">
            <Users className="h-5 w-5 text-neon-blue" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">
                {status.playerCount.toLocaleString()}
              </span>
              <span className="text-xs text-albion-gray-500">
                / {status.maxPlayers.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-albion-gray-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${playerPercentage}%` }}
                className="h-full rounded-full bg-neon-blue"
              />
            </div>
          </div>
        </div>

        {/* Ping */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-green/20">
            <Activity className="h-5 w-5 text-neon-green" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{status.ping}ms</div>
            <div className="text-xs text-albion-gray-500">Latency</div>
          </div>
        </div>

        {/* Server Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-gold/20">
            <Server className="h-5 w-5 text-neon-gold" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">Americas</div>
            <div className="text-xs text-albion-gray-500">Region</div>
          </div>
        </div>
      </div>
    </div>
  );
}
