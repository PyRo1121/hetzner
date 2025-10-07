# Albion Online Ultimate Resource Hub - Comprehensive API Documentation

## Executive Summary

This document provides comprehensive documentation for all APIs and data sources analyzed for the ultimate Albion Online resource hub. The platform aggregates data from multiple sources to create the most comprehensive, free Albion Online dashboard available. All APIs have been thoroughly analyzed, including competitors, to ensure our platform provides superior coverage and functionality.

## Core API Sources

### 1. OpenAlbion API

**Website:** https://openalbion.com/
**Base URL:** https://api.openalbion.com/api/v3/
**Type:** Static game metadata API

#### Key Endpoints:

- `GET /categories?type={weapon|armor|accessory|consumable}`
  - Parameters: `type` (required) - Filter by category type
  - Response: `{data: [{id, name, type, subcategories: [...] }]}`

- `GET /weapons?category_id={}&subcategory_id={}&tier={}`
  - Parameters: `category_id`, `subcategory_id`, `tier` (optional filters)
  - Response: `{data: [{id, name, tier, item_power, icon}]}`

- `GET /armors?category_id={}&subcategory_id={}&tier={}`
- `GET /accessories?category_id={}&subcategory_id={}&tier={}`
- `GET /consumables?category_id={}&subcategory_id={}&tier={}`

**Notes:** Free, no authentication required. Provides comprehensive item metadata with categories and subcategories.

### 2. Albion Online Data Project (AODP)

**Website:** https://www.albion-online-data.com/
**Base URLs:**

- Americas: `https://west.albion-online-data.com`
- Europe: `https://east.albion-online-data.com`
- Asia: `https://east.albion-online-data.com`

**Rate Limits:** 180 requests/minute, 300 requests/5 minutes

#### Key Endpoints:

- `GET /api/v2/stats/prices/{item_list}?locations={}&qualities={}`
  - Parameters: `locations` (comma-separated), `qualities` (1-5)
  - Response: Current market prices with buy/sell orders

- `GET /api/v2/stats/history/{item_list}?date={}&end_date={}&locations={}&qualities={}&time-scale={}`
  - Parameters: `date`, `end_date`, `locations`, `qualities`, `time-scale` (1=hourly, 24=daily)
  - Response: Historical price data and charts

- `GET /api/v2/stats/gold?date={}&end_date={}&count={}`
  - Parameters: `date`, `end_date`, `count` (number of prices)
  - Response: Gold price history

**Notes:** Community-driven market data. Items in URL path format. Default JSON response, XML available. Swagger docs available.

### 3. Official Gameinfo API (Tools4Albion)

**Website:** https://www.tools4albion.com/api_info.php
**Base URLs:**

- Americas: `https://gameinfo.albiononline.com/api/gameinfo/`
- Europe: `https://gameinfo-ams.albiononline.com/api/gameinfo/`
- Asia: `https://gameinfo-sgp.albiononline.com/api/gameinfo/`

**Rate Limits:** No official rate limits documented, but recommended to cache responses for 30-60 seconds

**Refresh Strategy:** 
- Kill feed (`/events`): Poll every 30-60 seconds for real-time updates
- Player/Guild data: Cache for 5 minutes
- Battle data: Cache for 10 minutes
- Leaderboards: Cache for 15 minutes

**Important Notes:**
- Most endpoints have `offset + limit <= 10000` constraint
- `/events` endpoint is the MAIN kill feed (limit 1-51, offset 1-1000)
- Can filter by `guildId` parameter for guild-specific kills
- All timestamps are in ISO 8601 format

#### Complete Endpoint List:

- `GET /search?q={search_term}` - Search players/guilds
- `GET /players/{ID}` - Player details
- `GET /players/{ID}/deaths` - Last 10 deaths (supports limit/offset)
- `GET /players/{ID}/kills` - Last 10 kills (supports limit/offset)
- `GET /players/statistics?range={week|month}&limit={}&offset={}&type={PvE|Gathering}&subtype={}&region={}&guildId={}&allianceId={}` - Top fame gainers
- `GET /guilds/{ID}` - Guild details
- `GET /guilds/{ID}/members` - Guild members list
- `GET /guilds/{ID}/data` - Guild stats with top 5 players
- `GET /guilds/{ID}/top?range={}&limit={}&offset={}&region={}` - Guild top kills
- `GET /alliances/{ID}` - Alliance details
- `GET /battles?range={}&limit={}&offset={}&sort={}` - List battles
- `GET /battles/{ID}` - Battle details
- `GET /events/battle/{ID}?offset={}&limit={}` - Battle kills/deaths
- `GET /items/{ID}` - Item icon (217x217)
- `GET /items/{ID}/data` - Item details
- `GET /items/{ID}/_itemCategoryTree` - Item categories
- `GET /matches/crystal?limit={}&offset={}` - Crystal realm matches
- `GET /matches/crystal/{ID}` - Crystal match details
- `GET /guildmatches/top` - Top 3 upcoming GvG
- `GET /guildmatches/next?limit={}&offset={}` - Upcoming GvG matches
- `GET /guildmatches/past?limit={}&offset={}` - Past GvG matches
- `GET /guildmatches/{ID}` - GvG match details
- `GET /events/playerfame?range={}&limit={}&offset={}` - Top players by kill fame
- `GET /events/guildfame?range={}&limit={}&offset={}` - Top guilds by kill fame
- `GET /guilds/topguildsbyattacks?range={}&limit={}&offset={}` - Top guilds by attacks won
- `GET /guilds/topguildsbydefenses?range={}&limit={}&offset={}` - Top guilds by defenses won
- `GET /events/playerweaponfame?range={}&limit={}&offset={}&weaponCategory={}` - Top players by weapon
- `GET /items/_weaponCategories` - Available weapon categories
- `GET /events/killfame?range={}&limit={}&offset={}` - Top PvP kills by fame
- `GET /events?limit={}&offset={}&guildId={}` - **Recent PvP kills (MAIN KILL FEED)**
- `GET /events/{ID}` - Specific event details

**Notes:** Undocumented official API. Parameters include range (week/month/lastWeek/lastMonth), limit/offset for pagination. Some endpoints have offset+limit ≤ 10000 constraint.

### 4. Render Service API

**Base URL:** https://render.albiononline.com/v1/
**Documentation:** https://wiki.albiononline.com/wiki/API:Render_service

#### Key Endpoints:

- `GET /item/{item_id}.png?quality={1-5}&enchantment={0-4}&size={pixels}`
- `GET /spell/{spell_id}.png`
- `GET /guild/{guild_id}.png?size={}&format={svg|png}`
- `GET /destinyboard/{node_id}.png`

**Notes:** Official CDN for game icons. Fast, no rate limits documented.

### 5. Server Status API

**Base URL:** https://serverstatus.albiononline.com/
**Endpoint:** `GET /`
**Response:** JSON with server status, player counts

## Competitor Analysis & Web Scraping Sources

### AlbionOnlineGrind.com

**URL:** https://albiononlinegrind.com/
**Data Provided:**

- Profit calculators: Farming, Animals, Laborers, Item Enchanting, Cooking, Alchemy
- Craft Planner and Price Checker
- Avalon Mapper and Island Management tools
- Meta builds and group builds system
- Patreon-integrated premium features

**Integration Strategy:** Respectful web scraping for calculator data and build information.

### AlbionOnline2D.com

**URL:** https://albiononline2d.com/en/item/cat/resources
**Data Provided:**

- Item resource databases
- Crafting guides (currently blocked - 403 error)

**Integration Strategy:** Requires direct partnership due to access restrictions.

### AlbionOnlineTools.com

**URL:** https://albiononlinetools.com/
**Data Provided:**

- Market prices with quality/location filtering
- Player/guild profiles with detailed statistics
- Killboard with PvP and ZvZ battle tracking
- Refining, Cooking, Butcher calculators
- Discord bot integration (17,918 servers supported)
- Multi-language support (15 languages)
- Favorite battle saving and sharing features

**Integration Strategy:** Web scraping for public tools and data.

### Killboard-1.com

**URL:** https://killboard-1.com/
**Data Provided:**

- Real-time kill statistics by category (Depths, ZvZ, Stalkers, Ganking)
- Cross-server kill tracking
- Discord bot integration
- Twitch panel extension
- Hourly aggregated kill data

**Integration Strategy:** Web scraping for kill statistics and tracking data.

## Additional Data Sources

### Albion Online Wiki API

**Base URL:** https://wiki.albiononline.com/api.php

- `GET ?action=query&prop=revisions&rvprop=content&format=json&titles={page_title}`
- `GET ?action=parse&text={wikitext}`

**Notes:** MediaWiki API for structured wiki content. Rate limit: 200 req/min for bots.

### Reddit API

**Base URL:** https://www.reddit.com/dev/api

- `/r/albiononline/new.json` for recent discussions
- Community sentiment and discussions

## Implementation Architecture

### Client Libraries (To Be Updated)

- **OpenAlbion Client:** Fix to use v3 API with correct parameters
- **AODP Client:** Correct parameter handling and base URLs
- **Gameinfo Client:** Expand with missing endpoints
- **Web Scraping Clients:** New clients for competitor sites

### Data Layer

- **Caching Strategy:** Redis for API responses (15-30 min TTL)
- **Rate Limiting:** Token bucket algorithm for AODP compliance
- **Normalization:** Unified data format across all sources
- **Conflict Resolution:** Priority-based data merging

### Error Handling & Reliability

- Exponential backoff retry logic
- Fallback mechanisms for API failures
- Circuit breaker pattern for unstable endpoints
- Comprehensive logging and monitoring

## Development Guidelines

### Bun-Only Approach

- **Strict Policy:** No npm or yarn usage
- All package management through bun
- Optimized for performance and developer experience

### API Client Standards

- TypeScript interfaces for all response schemas
- JSDoc comments for all endpoints and parameters
- Consistent error handling patterns
- Comprehensive test coverage

This comprehensive API documentation provides the foundation for building the most complete Albion Online resource platform available, aggregating data from official APIs, community sources, and competitor analysis to deliver superior functionality to players.

## Platform API Endpoints (Planned/Current)

The following endpoints represent the platform’s unified API, normalizing upstream sources and adding derived analytics. Schemas include new fields `confidence`, `freshnessSeconds`, and `anomalies` to support verifiability and data quality.

### Market Prices

- `GET /api/market/prices?itemIds={comma_separated_ids}&locations={comma_separated}&qualities={1-5}`
  - Purpose: Unified price surface for selected items across cities with quality filters.
  - Response:
    - `items`: Array of `{ itemId, location, quality, sellPriceMin, buyPriceMax, updatedAt, freshnessSeconds, confidence, anomalies }`
    - `meta`: `{ source: "AODP|Cache|Derived", windowSeconds, queriedAt }`
  - Field notes:
    - `freshnessSeconds`: Seconds since upstream observation; used for UI freshness badge.
    - `confidence`: 0.0–1.0 composite score based on sample size, variance, and source trust.
    - `anomalies`: `{ outlier: boolean, message?: string, zScore?: number }`

Example:

```
GET /api/market/prices?itemIds=T4_BAG,T4_CAPE&locations=Caerleon,Bridgewatch&qualities=1
{
  "items": [
    {
      "itemId": "T4_BAG",
      "location": "Caerleon",
      "quality": 1,
      "sellPriceMin": 12999,
      "buyPriceMax": 12000,
      "updatedAt": "2025-10-06T12:00:00Z",
      "freshnessSeconds": 45,
      "confidence": 0.92,
      "anomalies": { "outlier": false }
    }
  ],
  "meta": { "source": "AODP", "windowSeconds": 300, "queriedAt": "2025-10-06T12:00:45Z" }
}
```

### Trading: Flip Suggestions

- `GET /api/trading/flips?cities={from,to}&minProfit={integer}&tier={T4..T8}&limit={n}`
  - Purpose: Identify profitable flips and routes, normalized from market plus derived logistics.
  - Response item: `{ itemId, fromCity, toCity, buyPrice, sellPrice, profit, roi, volumeEstimate, confidence, route: { riskLevel, steps } }`
  - Notes:
    - `roi`: `(sellPrice - buyPrice) / buyPrice`, adjusted for fees if available.
    - `route.riskLevel`: `low|medium|high` based on player activity density and transport distance.

### PvP: Matchups

- `GET /api/pvp/matchups?weapon={id}&build={optional_id}&timeWindowHours={1..168}`
  - Response: `{ weaponId, counters: [{ againstWeaponId, winRate, sampleSize, confidence }], meta: { windowHours } }`
  - Notes:
    - `confidence` reflects sample size and variance; avoid overfitting low-count data.

### Guilds: Regear Requests

- `POST /api/guilds/regear`
  - Body: `{ guildId, playerId, itemId, quantity, reason, eventId?, notes? }`
  - Response: `{ requestId, status: "accepted|pending|rejected", createdAt }`
  - Errors:
    - `400 BAD_REQUEST`: Validation error `{ code: "VALIDATION_ERROR", message, fields }`
    - `401 UNAUTHORIZED`: `{ code: "AUTH_REQUIRED", message }`
    - `403 FORBIDDEN`: `{ code: "RBAC_DENIED", message }`
    - `429 TOO_MANY_REQUESTS`: `{ code: "RATE_LIMIT", retryAfterSeconds }`
    - `503 SERVICE_UNAVAILABLE`: `{ code: "UPSTREAM_UNAVAILABLE", message }`

### Error Codes

- `VALIDATION_ERROR`: Payload invalid; includes per-field messages
- `AUTH_REQUIRED`: Missing or invalid token
- `RBAC_DENIED`: Actor lacks role/permission
- `RATE_LIMIT`: Caller exceeded tier limits; include `retryAfterSeconds`
- `UPSTREAM_UNAVAILABLE`: Dependent service unhealthy; retry with backoff

### Rate Limits by Tier (Draft)

- `Free`: 60 req/min, burst 100; per-IP; cache required
- `Pro`: 240 req/min, burst 400; per-key; SLA 99.5%
- `Enterprise`: Custom; per-contract; SLA 99.9%; dedicated cache lanes

### Versioning & Deprecation

- Header `X-API-Version`: Semantic versions (e.g., `2025-10-06`)
- Deprecation via `Sunset` header and `Link: rel="deprecation"`
- Non-breaking field additions allowed; breaking changes gated by version bump
