-- Create RPC functions to compute guild leaderboards from kill_events and guild_snapshots

-- Computes guild kill fame leaderboard over a given range
-- range: 'day' | 'week' | 'month' | 'lastWeek' | 'lastMonth'
-- offset: for pagination; max_results: number of rows to return
CREATE OR REPLACE FUNCTION get_guild_kill_fame_leaderboard(
  range TEXT DEFAULT 'week',
  max_results INT DEFAULT 50,
  offset INT DEFAULT 0
)
RETURNS TABLE (
  "guildId" TEXT,
  "guildName" TEXT,
  "totalFame" BIGINT,
  "totalKills" BIGINT
) AS $$
DECLARE
  start_ts TIMESTAMPTZ;
  end_ts TIMESTAMPTZ := NOW();
BEGIN
  -- Determine time window
  IF range = 'day' THEN
    start_ts := NOW() - INTERVAL '1 day';
  ELSIF range = 'week' THEN
    start_ts := NOW() - INTERVAL '7 days';
  ELSIF range = 'month' THEN
    start_ts := NOW() - INTERVAL '30 days';
  ELSIF range = 'lastWeek' THEN
    start_ts := date_trunc('week', NOW()) - INTERVAL '7 days';
    end_ts := date_trunc('week', NOW());
  ELSIF range = 'lastMonth' THEN
    start_ts := date_trunc('month', NOW()) - INTERVAL '1 month';
    end_ts := date_trunc('month', NOW());
  ELSE
    start_ts := NOW() - INTERVAL '7 days';
  END IF;

  RETURN QUERY
  SELECT 
    ke."killerGuildId" AS "guildId",
    COALESCE(ke."killerGuildName", 'Unknown') AS "guildName",
    SUM(ke."totalFame")::BIGINT AS "totalFame",
    COUNT(*)::BIGINT AS "totalKills"
  FROM kill_events ke
  WHERE ke."killerGuildId" IS NOT NULL
    AND ke.timestamp >= start_ts
    AND ke.timestamp < end_ts
  GROUP BY ke."killerGuildId", ke."killerGuildName"
  ORDER BY SUM(ke."totalFame") DESC
  OFFSET offset
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Computes guild attacks/defenses leaderboard from latest guild_snapshots per guild
-- type: 'attacks' or 'defenses'
CREATE OR REPLACE FUNCTION get_guild_attack_defense_leaderboard(
  type TEXT DEFAULT 'attacks',
  max_results INT DEFAULT 50,
  offset INT DEFAULT 0
)
RETURNS TABLE (
  "guildId" TEXT,
  "guildName" TEXT,
  "attacksWon" BIGINT,
  "defensesWon" BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest AS (
    SELECT DISTINCT ON (gs.guild_id)
      gs.guild_id,
      gs.guild_name,
      gs.attacks_won,
      gs.defenses_won,
      gs.snapshot_at
    FROM guild_snapshots gs
    ORDER BY gs.guild_id, gs.snapshot_at DESC
  )
  SELECT 
    latest.guild_id AS "guildId",
    latest.guild_name AS "guildName",
    COALESCE(latest.attacks_won, 0)::BIGINT AS "attacksWon",
    COALESCE(latest.defenses_won, 0)::BIGINT AS "defensesWon"
  FROM latest
  ORDER BY 
    CASE WHEN type = 'defenses' THEN latest.defenses_won ELSE latest.attacks_won END DESC
  OFFSET offset
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;