-- PvP Meta Analysis System Tables
-- Run this in Supabase SQL Editor to create the tables

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

-- Player PvP statistics and ELO ratings
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

-- Meta build tracking and analysis
CREATE TABLE IF NOT EXISTS meta_builds (
  id TEXT PRIMARY KEY,
  "buildId" TEXT UNIQUE NOT NULL,

  -- Equipment composition
  "mainHand" TEXT NOT NULL,
  "offHand" TEXT,
  head TEXT NOT NULL,
  armor TEXT NOT NULL,
  shoes TEXT NOT NULL,
  cape TEXT,
  is_healer BOOLEAN DEFAULT FALSE NOT NULL,

  -- Stats
  "totalKills" INTEGER DEFAULT 0 NOT NULL,
  "totalDeaths" INTEGER DEFAULT 0 NOT NULL,
  "winRate" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  popularity DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "avgFame" DOUBLE PRECISION DEFAULT 0 NOT NULL,

  -- Tier info
  "avgTier" INTEGER NOT NULL,

  -- Trend analysis
  trend TEXT DEFAULT 'stable' NOT NULL,
  "trendScore" DOUBLE PRECISION DEFAULT 0 NOT NULL,

  -- Counter relationships (JSON arrays of build IDs)
  counters JSONB,
  "counteredBy" JSONB,

  -- Time-based tracking
  "weeklyKills" INTEGER DEFAULT 0 NOT NULL,
  "weeklyDeaths" INTEGER DEFAULT 0 NOT NULL,
  "lastSeenAt" TIMESTAMPTZ,

  server TEXT DEFAULT 'Americas' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for meta_builds
CREATE INDEX IF NOT EXISTS idx_meta_builds_win_rate ON meta_builds("winRate");
CREATE INDEX IF NOT EXISTS idx_meta_builds_popularity ON meta_builds(popularity);
CREATE INDEX IF NOT EXISTS idx_meta_builds_trend ON meta_builds(trend);
CREATE INDEX IF NOT EXISTS idx_meta_builds_tier ON meta_builds("avgTier");
CREATE INDEX IF NOT EXISTS idx_meta_builds_server ON meta_builds(server);

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

-- Success message
SELECT 'PvP tables created successfully!' AS message;
