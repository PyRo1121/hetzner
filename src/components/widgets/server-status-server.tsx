import { Server, Users, Activity } from 'lucide-react';

// Simulated server status - in production, fetch from actual API
async function getServerStatus() {
  // In production, you'd fetch from Albion API or your monitoring service
  return {
    online: true,
    playerCount: 8432,
    maxPlayers: 10000,
    ping: 45,
    region: 'Americas',
  };
}

export async function ServerStatusServer() {
  const status = await getServerStatus();
  const playerPercentage = (status.playerCount / status.maxPlayers) * 100;

  return (
    <div className="panel-float">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Server Status</h3>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${status.online ? 'bg-neon-green animate-pulse' : 'bg-red-500'}`}
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
              <div
                style={{ width: `${playerPercentage}%` }}
                className="h-full rounded-full bg-neon-blue transition-all duration-500"
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
            <div className="text-sm font-medium text-white">{status.region}</div>
            <div className="text-xs text-albion-gray-500">Region</div>
          </div>
        </div>
      </div>
    </div>
  );
}
