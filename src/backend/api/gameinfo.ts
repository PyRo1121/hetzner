/**
 * Backend Gameinfo Client Factory
 * Avoids global mutation by providing per-server instances.
 */
import { GameinfoClient, type Server } from '@/lib/api/gameinfo/client';

const clients = new Map<Server, GameinfoClient>();

export function getGameinfoClient(server: Server = 'Americas'): GameinfoClient {
  const existing = clients.get(server);
  if (existing) return existing;
  const client = new GameinfoClient(server);
  clients.set(server, client);
  return client;
}

export type {
  Server,
} from '@/lib/api/gameinfo/client';