# API Usage Guide

This document provides comprehensive usage examples for all Market, PvP, Guild, and Player Search APIs.

## ✅ All APIs Tested and Working

All endpoints have been tested and are functioning correctly. See test results in `scripts/test-apis.ts`.

---

## 📊 Market APIs

### 1. Market Prices API

**Endpoint:** `/api/market/prices`

**Description:** Fetches current market prices from AODP (Albion Online Data Project)

**Parameters:**
- `items` (required): Comma-separated item IDs (e.g., `T4_BAG` or `T4_BAG,T5_BAG`)
- `locations` (optional): Comma-separated city names (e.g., `Caerleon,Thetford`)
- `qualities` (optional): Comma-separated quality levels 1-5 (e.g., `1,2,3`)
- `server` (optional): Server region (`Americas`, `Europe`, `Asia`) - defaults to `Americas`

**Example Request:**
```typescript
const response = await fetch('/api/market/prices?items=T4_BAG&locations=Caerleon&qualities=1');
const result = await response.json();

if (result.success) {
  console.log(result.data); // Array of price data
}
```

**Using the Hook:**
```typescript
import { useMarketApi } from '@/hooks/use-market-api';

function MyComponent() {
  const { data, isLoading, error } = useMarketApi({
    itemIds: 'T4_BAG',
    locations: 'Caerleon',
    qualities: [1],
    server: 'Americas',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map(price => (
        <div key={`${price.item_id}-${price.city}`}>
          {price.item_id} in {price.city}: {price.sell_price_min}
        </div>
      ))}
    </div>
  );
}
```

### 2. Market History API

**Endpoint:** `/api/market/history`

**Description:** Fetches historical price data

**Parameters:**
- `items` (required): Comma-separated item IDs
- `locations` (optional): Comma-separated city names
- `qualities` (optional): Comma-separated quality levels
- `date` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `timeScale` (optional): `1` for hourly, `24` for daily
- `server` (optional): Server region

**Example Request:**
```typescript
const response = await fetch('/api/market/history?items=T4_BAG&locations=Caerleon&timeScale=24');
const result = await response.json();

if (result.success) {
  console.log(result.data); // Array of historical data
}
```

**Using the Hook:**
```typescript
import { useMarketHistory } from '@/hooks/use-market-api';

function HistoryChart() {
  const { data, isLoading } = useMarketHistory({
    itemIds: 'T4_BAG',
    locations: 'Caerleon',
    timeScale: 24,
  });

  // Render chart with data
}
```

---

## ⚔️ PvP APIs

### 3. Recent Kills API

**Endpoint:** `/api/pvp/kills`

**Description:** Fetches recent PvP kill events

**Parameters:**
- `limit` (optional): Number of kills to fetch (default: 51, max: 51)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```typescript
const response = await fetch('/api/pvp/kills?limit=10&offset=0');
const result = await response.json();

if (result.success) {
  console.log(result.data); // Array of kill events
}
```

**Using the Hook:**
```typescript
import { useRecentKills } from '@/hooks/use-pvp-api';

function KillFeed() {
  const { data: kills, isLoading } = useRecentKills({ limit: 20 });

  if (isLoading) return <div>Loading kills...</div>;

  return (
    <div>
      {kills?.map(kill => (
        <div key={kill.EventId}>
          {kill.Killer.Name} killed {kill.Victim.Name}
        </div>
      ))}
    </div>
  );
}
```

### 4. Player Details API

**Endpoint:** `/api/pvp/player/[playerId]`

**Description:** Fetches detailed player information including kills, deaths, and stats

**Parameters:**
- `playerId` (required): Player ID (in URL path)

**Example Request:**
```typescript
const playerId = 'abc123';
const response = await fetch(`/api/pvp/player/${playerId}`);
const result = await response.json();

if (result.success) {
  console.log(result.data.player); // Player info
  console.log(result.data.kills);  // Recent kills
  console.log(result.data.deaths); // Recent deaths
  console.log(result.data.stats);  // K/D stats
}
```

**Using the Hook:**
```typescript
import { usePlayerDetails } from '@/hooks/use-pvp-api';

function PlayerProfile({ playerId }: { playerId: string }) {
  const { data, isLoading } = usePlayerDetails({ playerId });

  if (isLoading) return <div>Loading player...</div>;

  return (
    <div>
      <h2>{data?.player.Name}</h2>
      <p>Guild: {data?.player.GuildName}</p>
      <p>K/D Ratio: {data?.stats.kdRatio.toFixed(2)}</p>
      <p>Total Kills: {data?.stats.totalKills}</p>
      <p>Total Deaths: {data?.stats.totalDeaths}</p>
    </div>
  );
}
```

---

## 🔍 Search APIs

### 5. Player/Guild Search API

**Endpoint:** `/api/pvp/search`

**Description:** Searches for players and guilds

**Parameters:**
- `q` (required): Search query

**Example Request:**
```typescript
const response = await fetch('/api/pvp/search?q=playerName');
const result = await response.json();

if (result.success) {
  console.log(result.data.players); // Array of matching players
  console.log(result.data.guilds);  // Array of matching guilds
}
```

**Using the Hook:**
```typescript
import { useSearch } from '@/hooks/use-pvp-api';

function SearchBar() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearch({ query });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search players or guilds..."
      />
      
      {isLoading && <div>Searching...</div>}
      
      {data?.players && (
        <div>
          <h3>Players</h3>
          {data.players.map(player => (
            <div key={player.Id}>{player.Name}</div>
          ))}
        </div>
      )}
      
      {data?.guilds && (
        <div>
          <h3>Guilds</h3>
          {data.guilds.map(guild => (
            <div key={guild.Id}>{guild.Name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🛡️ Guild APIs

### 6. Guild Leaderboards API

**Endpoint:** `/api/pvp/guilds`

**Description:** Fetches guild leaderboards

**Parameters:**
- `type` (optional): `attacks` or `defenses` (default: `attacks`)
- `range` (optional): `week`, `month`, `lastWeek`, `lastMonth` (default: `week`)
- `limit` (optional): Number of guilds (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example Request:**
```typescript
const response = await fetch('/api/pvp/guilds?type=attacks&range=week&limit=10');
const result = await response.json();

if (result.success) {
  console.log(result.data); // Array of guild stats
}
```

**Using the Hook:**
```typescript
import { useGuildLeaderboard } from '@/hooks/use-pvp-api';

function GuildLeaderboard() {
  const { data: guilds, isLoading } = useGuildLeaderboard({
    type: 'attacks',
    range: 'week',
    limit: 20,
  });

  if (isLoading) return <div>Loading leaderboard...</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Guild</th>
          <th>Kill Fame</th>
          <th>Attacks Won</th>
        </tr>
      </thead>
      <tbody>
        {guilds?.map((guild, index) => (
          <tr key={guild.Id}>
            <td>{index + 1}</td>
            <td>{guild.Name}</td>
            <td>{guild.KillFame.toLocaleString()}</td>
            <td>{guild.AttacksWon || 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 🧪 Testing

All APIs have been tested and verified. Run the test script:

```bash
bun run scripts/test-apis.ts
```

**Test Results:**
- ✅ Market Prices API - Single Item
- ✅ Market Prices API - Multiple Items
- ✅ Market History API
- ✅ Recent Kills API
- ✅ Recent Kills API - Pagination
- ✅ Guild Leaderboard - Attacks
- ✅ Guild Leaderboard - Defenses
- ✅ Player Search API
- ✅ Guild Search API
- ✅ Player Details API

**Success Rate: 100%**

---

## 🔧 Error Handling

All APIs return a consistent response format:

**Success Response:**
```json
{
  "success": true,
  "data": [...],
  "timestamp": "2025-09-30T18:15:58.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Example Error Handling:**
```typescript
try {
  const response = await fetch('/api/pvp/kills?limit=10');
  const result = await response.json();
  
  if (!result.success) {
    console.error('API Error:', result.error);
    return;
  }
  
  // Use result.data
} catch (error) {
  console.error('Network Error:', error);
}
```

---

## 📝 Notes

1. **Rate Limiting**: AODP has rate limits (180 requests/minute). The APIs implement caching to minimize requests.

2. **Caching**: 
   - Market prices: 60 seconds
   - Market history: 5 minutes
   - PvP kills: 30 seconds
   - Guild leaderboards: 5 minutes
   - Search results: 1 minute
   - Player details: 5 minutes

3. **Server Selection**: Market APIs support server selection (`Americas`, `Europe`, `Asia`). PvP APIs are global.

4. **Data Freshness**: Market data updates every few minutes. PvP data updates in near real-time.

---

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Start dev server:**
   ```bash
   bun run dev
   ```

3. **Test APIs:**
   ```bash
   bun run scripts/test-apis.ts
   ```

4. **Use in components:**
   ```typescript
   import { useMarketApi, useRecentKills, useSearch } from '@/hooks';
   ```

All APIs are ready to use! 🎉
