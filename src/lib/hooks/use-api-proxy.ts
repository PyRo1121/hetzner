/**
 * API Proxy Hook
 * Centralized hook for fetching data through our API proxies
 */

export async function fetchKills(limit: number = 51, offset: number = 0) {
  const response = await fetch(`/api/pvp/kills?limit=${limit}&offset=${offset}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch kills');
  }
  
  return result.data;
}

export async function fetchGuilds(type: 'attacks' | 'defenses' = 'attacks', range: string = 'week', limit: number = 50) {
  const response = await fetch(`/api/pvp/guilds?type=${type}&range=${range}&limit=${limit}&offset=0`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch guilds');
  }
  
  return result.data;
}

export async function searchPlayers(query: string) {
  const response = await fetch(`/api/pvp/search?q=${encodeURIComponent(query)}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to search');
  }
  
  return result.data;
}
