-- Create function to get player leaderboard
CREATE OR REPLACE FUNCTION get_player_leaderboard(
  sort_by TEXT DEFAULT 'kills',
  max_results INT DEFAULT 50
)
RETURNS TABLE (
  "playerId" TEXT,
  "playerName" TEXT,
  "totalKills" BIGINT,
  "totalDeaths" BIGINT,
  "totalFame" BIGINT,
  "killDeathRatio" NUMERIC,
  "avgFamePerKill" NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH player_kills AS (
    SELECT 
      ke."killerId" as player_id,
      ke."killerName" as player_name,
      COUNT(*) as kills,
      SUM(ke."totalFame") as fame
    FROM kill_events ke
    WHERE ke."timestamp" > NOW() - INTERVAL '7 days'
    GROUP BY ke."killerId", ke."killerName"
  ),
  player_deaths AS (
    SELECT 
      kd."victimId" as player_id,
      COUNT(*) as deaths
    FROM kill_events kd
    WHERE kd."timestamp" > NOW() - INTERVAL '7 days'
    GROUP BY kd."victimId"
  ),
  combined AS (
    SELECT 
      pk.player_id,
      pk.player_name,
      pk.kills,
      COALESCE(pd.deaths, 0) as deaths,
      pk.fame,
      CASE 
        WHEN COALESCE(pd.deaths, 0) = 0 THEN pk.kills::NUMERIC
        ELSE pk.kills::NUMERIC / NULLIF(pd.deaths, 0)
      END as kd_ratio,
      CASE 
        WHEN pk.kills = 0 THEN 0
        ELSE pk.fame::NUMERIC / pk.kills
      END as avg_fame
    FROM player_kills pk
    LEFT JOIN player_deaths pd ON pk.player_id = pd.player_id
    WHERE pk.kills >= 5  -- Minimum 5 kills to appear
  )
  SELECT 
    player_id as "playerId",
    player_name as "playerName",
    kills as "totalKills",
    deaths as "totalDeaths",
    fame as "totalFame",
    kd_ratio as "killDeathRatio",
    avg_fame as "avgFamePerKill"
  FROM combined
  ORDER BY 
    CASE 
      WHEN sort_by = 'kills' THEN kills
      WHEN sort_by = 'fame' THEN fame
      WHEN sort_by = 'kd' THEN kd_ratio::BIGINT
      ELSE kills
    END DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;
