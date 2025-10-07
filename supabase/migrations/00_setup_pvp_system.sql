-- ============================================
-- Complete PvP System Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create all PvP tables
-- ============================================

-- Kill events from Gameinfo API
CREATE TABLE IF NOT EXISTS kill_events (
  id TEXT PRIMARY KEY,
  "eventId" INTEGER UNIQUE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,

  -- Killer info
  "killerId" TEXT NOT NULL,
  "killerName" TEXT NOT NULL,
  "killerGuildId" TEXT,
  "killerGuildName" TEXT,
  "killerAllianceId" TEXT,
  "killerAllianceName" TEXT,
  "killerItemPower" INTEGER,
  "killerDamageDone" INTEGER,
  "killerEquipment" JSONB,

  -- Victim info
  "victimId" TEXT NOT NULL,
  "victimName" TEXT NOT NULL,
  "victimGuildId" TEXT,
  "victimGuildName" TEXT,
  "victimAllianceId" TEXT,
  "victimAllianceName" TEXT,
  "victimItemPower" INTEGER,
  "victimEquipment" JSONB,
  "victimInventory" JSONB,

  -- Fight details
  "totalFame" INTEGER NOT NULL,
  location TEXT,
  "numberOfParticipants" INTEGER,
  "battleId" INTEGER,
  participants JSONB,

  server TEXT DEFAULT 'Americas' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for kill_events
CREATE INDEX IF NOT EXISTS idx_kill_events_timestamp ON kill_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_kill_events_killer_id ON kill_events("killerId");
CREATE INDEX IF NOT EXISTS idx_kill_events_victim_id ON kill_events("victimId");
CREATE INDEX IF NOT EXISTS idx_kill_events_killer_guild ON kill_events("killerGuildId");
CREATE INDEX IF NOT EXISTS idx_kill_events_victim_guild ON kill_events("victimGuildId");
CREATE INDEX IF NOT EXISTS idx_kill_events_total_fame ON kill_events("totalFame");
CREATE INDEX IF NOT EXISTS idx_kill_events_location ON kill_events(location);
CREATE INDEX IF NOT EXISTS idx_kill_events_server ON kill_events(server);

-- Meta build tracking and analysis
CREATE TABLE IF NOT EXISTS meta_builds (
  id SERIAL PRIMARY KEY,
  build_id TEXT UNIQUE NOT NULL,

  -- Equipment composition
  weapon_type TEXT NOT NULL,
  head_type TEXT NOT NULL,
  armor_type TEXT NOT NULL,
  shoes_type TEXT NOT NULL,
  cape_type TEXT,
  is_healer BOOLEAN DEFAULT FALSE NOT NULL,

  -- Stats
  kills INTEGER DEFAULT 0 NOT NULL,
  deaths INTEGER DEFAULT 0 NOT NULL,
  total_fame BIGINT DEFAULT 0 NOT NULL,
  sample_size INTEGER DEFAULT 0 NOT NULL,
  win_rate DOUBLE PRECISION DEFAULT 0 NOT NULL,
  popularity DOUBLE PRECISION DEFAULT 0 NOT NULL,
  avg_fame DOUBLE PRECISION DEFAULT 0 NOT NULL,

  -- Time-based tracking
  last_seen TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for meta_builds
CREATE INDEX IF NOT EXISTS idx_meta_builds_win_rate ON meta_builds(win_rate);
CREATE INDEX IF NOT EXISTS idx_meta_builds_popularity ON meta_builds(popularity);
CREATE INDEX IF NOT EXISTS idx_meta_builds_kills ON meta_builds(kills);
CREATE INDEX IF NOT EXISTS idx_meta_builds_sample_size ON meta_builds(sample_size);

-- Player PvP statistics
CREATE TABLE IF NOT EXISTS player_pvp_stats (
  id TEXT PRIMARY KEY,
  "playerId" TEXT UNIQUE NOT NULL,
  "playerName" TEXT NOT NULL,

  -- Current guild/alliance
  "guildId" TEXT,
  "guildName" TEXT,
  "allianceId" TEXT,
  "allianceName" TEXT,

  -- Lifetime stats
  "totalKills" INTEGER DEFAULT 0 NOT NULL,
  "totalDeaths" INTEGER DEFAULT 0 NOT NULL,
  "totalFame" INTEGER DEFAULT 0 NOT NULL,
  "killFame" INTEGER DEFAULT 0 NOT NULL,
  "deathFame" INTEGER DEFAULT 0 NOT NULL,

  -- ML-calculated ratings
  "eloRating" INTEGER DEFAULT 1500 NOT NULL,
  "eloConfidence" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  rank TEXT DEFAULT 'Bronze' NOT NULL,
  "gamesPlayed" INTEGER DEFAULT 0 NOT NULL,

  -- Favorite builds (JSON array of build IDs)
  "favoriteBuilds" JSONB,

  -- Activity tracking
  "lastSeenAt" TIMESTAMPTZ,
  "lastKillAt" TIMESTAMPTZ,
  "lastDeathAt" TIMESTAMPTZ,

  server TEXT DEFAULT 'Americas' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for player_pvp_stats
CREATE INDEX IF NOT EXISTS idx_player_pvp_stats_elo ON player_pvp_stats("eloRating");
CREATE INDEX IF NOT EXISTS idx_player_pvp_stats_rank ON player_pvp_stats(rank);
CREATE INDEX IF NOT EXISTS idx_player_pvp_stats_guild ON player_pvp_stats("guildId");
CREATE INDEX IF NOT EXISTS idx_player_pvp_stats_kills ON player_pvp_stats("totalKills");
CREATE INDEX IF NOT EXISTS idx_player_pvp_stats_server ON player_pvp_stats(server);

-- Guild PvP statistics
CREATE TABLE IF NOT EXISTS guild_pvp_stats (
  id TEXT PRIMARY KEY,
  "guildId" TEXT UNIQUE NOT NULL,
  "guildName" TEXT NOT NULL,

  "allianceId" TEXT,
  "allianceName" TEXT,
  "allianceTag" TEXT,

  -- Aggregate stats
  "totalKills" INTEGER DEFAULT 0 NOT NULL,
  "totalDeaths" INTEGER DEFAULT 0 NOT NULL,
  "totalFame" INTEGER DEFAULT 0 NOT NULL,
  "killFame" INTEGER DEFAULT 0 NOT NULL,
  "deathFame" INTEGER DEFAULT 0 NOT NULL,
  "memberCount" INTEGER DEFAULT 0 NOT NULL,

  -- GvG stats
  "attacksWon" INTEGER DEFAULT 0 NOT NULL,
  "defensesWon" INTEGER DEFAULT 0 NOT NULL,

  -- Time-based stats (for leaderboards)
  "weeklyKills" INTEGER DEFAULT 0 NOT NULL,
  "weeklyDeaths" INTEGER DEFAULT 0 NOT NULL,
  "monthlyKills" INTEGER DEFAULT 0 NOT NULL,
  "monthlyDeaths" INTEGER DEFAULT 0 NOT NULL,

  server TEXT DEFAULT 'Americas' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for guild_pvp_stats
CREATE INDEX IF NOT EXISTS idx_guild_pvp_stats_kill_fame ON guild_pvp_stats("killFame");
CREATE INDEX IF NOT EXISTS idx_guild_pvp_stats_attacks ON guild_pvp_stats("attacksWon");
CREATE INDEX IF NOT EXISTS idx_guild_pvp_stats_defenses ON guild_pvp_stats("defensesWon");
CREATE INDEX IF NOT EXISTS idx_guild_pvp_stats_server ON guild_pvp_stats(server);

-- Zone danger ratings
CREATE TABLE IF NOT EXISTS zone_danger (
  id TEXT PRIMARY KEY,
  "zoneName" TEXT NOT NULL,

  -- Danger metrics
  "totalKills" INTEGER DEFAULT 0 NOT NULL,
  "avgFame" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "dangerRating" INTEGER DEFAULT 0 NOT NULL,

  -- Time-based tracking
  "hourlyKills" INTEGER DEFAULT 0 NOT NULL,
  "dailyKills" INTEGER DEFAULT 0 NOT NULL,
  "weeklyKills" INTEGER DEFAULT 0 NOT NULL,

  -- Peak activity times (JSON array of hour:count)
  "peakHours" JSONB,

  server TEXT DEFAULT 'Americas' NOT NULL,
  "lastUpdated" TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE("zoneName", server)
);

-- Indexes for zone_danger
CREATE INDEX IF NOT EXISTS idx_zone_danger_rating ON zone_danger("dangerRating");
CREATE INDEX IF NOT EXISTS idx_zone_danger_kills ON zone_danger("totalKills");
CREATE INDEX IF NOT EXISTS idx_zone_danger_server ON zone_danger(server);

-- ML insights and anomalies cache
CREATE TABLE IF NOT EXISTS ml_insights (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,

  -- Related entity
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "entityName" TEXT NOT NULL,

  -- Insight data
  score DOUBLE PRECISION NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,

  -- Visibility
  "isActive" BOOLEAN DEFAULT TRUE NOT NULL,
  "expiresAt" TIMESTAMPTZ,

  server TEXT DEFAULT 'Americas' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for ml_insights
CREATE INDEX IF NOT EXISTS idx_ml_insights_type ON ml_insights(type, "isActive");
CREATE INDEX IF NOT EXISTS idx_ml_insights_entity ON ml_insights("entityType", "entityId");
CREATE INDEX IF NOT EXISTS idx_ml_insights_score ON ml_insights(score);
CREATE INDEX IF NOT EXISTS idx_ml_insights_created ON ml_insights("createdAt");
CREATE INDEX IF NOT EXISTS idx_ml_insights_server ON ml_insights(server);

-- Step 2: Create aggregation function
-- ============================================

CREATE OR REPLACE FUNCTION aggregate_meta_builds()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clear existing data
  TRUNCATE TABLE meta_builds;
  
  -- Aggregate builds from kill events (both killer and victim equipment)
  WITH all_builds AS (
    -- Killer builds
    SELECT
      "killerEquipment" AS equipment,
      1 AS is_kill,
      0 AS is_death,
      "totalFame",
      timestamp
    FROM kill_events
    WHERE "killerEquipment" IS NOT NULL
    
    UNION ALL
    
    -- Victim builds (deaths)
    SELECT
      "victimEquipment" AS equipment,
      0 AS is_kill,
      1 AS is_death,
      0 AS total_fame,
      timestamp
    FROM kill_events
    WHERE "victimEquipment" IS NOT NULL
  ),
  build_stats AS (
    SELECT
      CONCAT_WS('_',
        COALESCE((equipment->>'MainHand')::text, 'NONE'),
        COALESCE((equipment->>'Head')::text, 'NONE'),
        COALESCE((equipment->>'Armor')::text, 'NONE'),
        COALESCE((equipment->>'Shoes')::text, 'NONE'),
        COALESCE((equipment->>'Cape')::text, 'NONE')
      ) AS build_id,
      (equipment->>'MainHand')::text AS weapon_type,
      (equipment->>'Head')::text AS head_type,
      (equipment->>'Armor')::text AS armor_type,
      (equipment->>'Shoes')::text AS shoes_type,
      (equipment->>'Cape')::text AS cape_type,
      SUM(is_kill)::integer AS kills,
      SUM(is_death)::integer AS deaths,
      SUM("totalFame")::bigint AS total_fame,
      COUNT(*)::integer AS sample_size,
      MAX(timestamp) AS last_seen
    FROM all_builds
    GROUP BY build_id, weapon_type, head_type, armor_type, shoes_type, cape_type
    HAVING COUNT(*) >= 3
  )
  INSERT INTO meta_builds (
    build_id,
    weapon_type,
    head_type,
    armor_type,
    shoes_type,
    cape_type,
    kills,
    deaths,
    total_fame,
    sample_size,
    win_rate,
    popularity,
    avg_fame,
    last_seen
  )
  SELECT
    build_id,
    weapon_type,
    head_type,
    armor_type,
    shoes_type,
    cape_type,
    kills,
    deaths,
    total_fame,
    sample_size,
    CASE WHEN (kills + deaths) > 0 THEN (kills::float / (kills + deaths)::float) ELSE 0 END AS win_rate,
    CASE WHEN (SELECT COUNT(*) FROM kill_events) > 0 THEN (sample_size::float / (SELECT COUNT(*) FROM kill_events)::float) ELSE 0 END AS popularity,
    CASE WHEN kills > 0 THEN (total_fame::float / kills::float) ELSE 0 END AS avg_fame,
    last_seen
  FROM build_stats
  ORDER BY kills DESC;
END;
$$;

-- Step 3: Success message
-- ============================================
SELECT 'PvP system setup complete! Tables and functions created.' AS message;
SELECT 'Note: meta_builds table is empty. Run aggregate_meta_builds() after importing kill_events data.' AS note;
