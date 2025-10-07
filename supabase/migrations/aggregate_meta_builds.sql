-- Function to aggregate meta builds from all kill events
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
  normalized_builds AS (
    SELECT
      REGEXP_REPLACE(REGEXP_REPLACE(COALESCE((equipment->'MainHand'->>'Type')::text, 'NONE'), '^T\\d+_', ''), '@\\d+$', '') AS weapon_type,
      REGEXP_REPLACE(REGEXP_REPLACE(COALESCE((equipment->'Head'->>'Type')::text, 'NONE'), '^T\\d+_', ''), '@\\d+$', '') AS head_type,
      REGEXP_REPLACE(REGEXP_REPLACE(COALESCE((equipment->'Armor'->>'Type')::text, 'NONE'), '^T\\d+_', ''), '@\\d+$', '') AS armor_type,
      REGEXP_REPLACE(REGEXP_REPLACE(COALESCE((equipment->'Shoes'->>'Type')::text, 'NONE'), '^T\\d+_', ''), '@\\d+$', '') AS shoes_type,
      REGEXP_REPLACE(REGEXP_REPLACE(COALESCE((equipment->'Cape'->>'Type')::text, 'NONE'), '^T\\d+_', ''), '@\\d+$', '') AS cape_type,
      is_kill,
      is_death,
      "totalFame",
      timestamp
    FROM all_builds
  ),
  build_stats AS (
    SELECT
      CONCAT_WS('_', weapon_type, head_type, armor_type, shoes_type, cape_type) AS build_id,
      weapon_type,
      head_type,
      armor_type,
      shoes_type,
      cape_type,
      SUM(is_kill)::integer AS kills,
      SUM(is_death)::integer AS deaths,
      SUM("totalFame")::bigint AS total_fame,
      COUNT(*)::integer AS sample_size,
      MAX(timestamp) AS last_seen,
      bool_or(
        weapon_type ~ 'HOLYSTAFF'
        OR weapon_type ~ 'DIVINESTAFF'
        OR weapon_type ~ 'SMITESTAFF'
        OR weapon_type ~ 'FALLENSTAFF'
        OR weapon_type ~ 'LIFETOUCHSTAFF'
        OR weapon_type ~ 'REDEMPTIONSTAFF'
        OR weapon_type ~ 'GREATHOLYSTAFF'
        OR weapon_type ~ 'NATURESTAFF'
        OR weapon_type ~ 'DRUIDSTAFF'
        OR weapon_type ~ 'WILDSTAFF'
        OR weapon_type ~ 'REJUVENATIONSTAFF'
        OR weapon_type ~ 'IRONROOTSTAFF'
        OR weapon_type ~ 'FRAIVESTAFF'
      ) AS is_healer
    FROM normalized_builds
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
    last_seen,
    is_healer
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
    (sample_size::float / (SELECT COUNT(*) FROM kill_events)::float) AS popularity,
    CASE WHEN kills > 0 THEN (total_fame::float / kills::float) ELSE 0 END AS avg_fame,
    last_seen,
    is_healer
  FROM build_stats
  ORDER BY kills DESC;
END;
$$;

-- Run the aggregation to populate meta_builds from all kill events
SELECT aggregate_meta_builds();
