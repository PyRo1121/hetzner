-- Guild Intelligence Tables
-- Generated on 2025-10-04

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Guild snapshots capture aggregated guild statistics over time
CREATE TABLE IF NOT EXISTS guild_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id TEXT NOT NULL,
  guild_name TEXT NOT NULL,
  alliance_id TEXT,
  alliance_name TEXT,
  alliance_tag TEXT,
  member_count INTEGER,
  kill_fame BIGINT,
  death_fame BIGINT,
  attacks_won INTEGER,
  defenses_won INTEGER,
  fame_ratio NUMERIC,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  server TEXT NOT NULL DEFAULT 'Americas',
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_guild_snapshots_guild_id ON guild_snapshots(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_snapshots_snapshot_at ON guild_snapshots(snapshot_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uid_guild_snapshots_unique ON guild_snapshots(guild_id, snapshot_at);

ALTER TABLE guild_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to guild_snapshots" ON guild_snapshots
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow service role write to guild_snapshots" ON guild_snapshots
  FOR INSERT WITH CHECK (current_setting('request.jwt.claim.role', TRUE) = 'service_role');

CREATE POLICY "Allow service role update guild_snapshots" ON guild_snapshots
  FOR UPDATE USING (current_setting('request.jwt.claim.role', TRUE) = 'service_role');

-- Guild membership snapshots
CREATE TABLE IF NOT EXISTS guild_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id TEXT NOT NULL,
  guild_name TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  alliance_id TEXT,
  alliance_name TEXT,
  role TEXT,
  join_date TIMESTAMPTZ,
  kill_fame BIGINT,
  death_fame BIGINT,
  fame_ratio NUMERIC,
  average_item_power NUMERIC,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  server TEXT NOT NULL DEFAULT 'Americas'
);

CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_player_id ON guild_members(player_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_captured_at ON guild_members(captured_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uid_guild_members_unique ON guild_members(guild_id, player_id, captured_at);

ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to guild_members" ON guild_members
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow service role write to guild_members" ON guild_members
  FOR INSERT WITH CHECK (current_setting('request.jwt.claim.role', TRUE) = 'service_role');

CREATE POLICY "Allow service role update guild_members" ON guild_members
  FOR UPDATE USING (current_setting('request.jwt.claim.role', TRUE) = 'service_role');

-- Guild battle records
CREATE TABLE IF NOT EXISTS guild_battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id TEXT NOT NULL,
  guild_name TEXT NOT NULL,
  alliance_id TEXT,
  alliance_name TEXT,
  battle_id BIGINT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  result TEXT,
  zone TEXT,
  total_kills INTEGER,
  total_deaths INTEGER,
  total_fame BIGINT,
  enemy_guilds JSONB,
  participants JSONB,
  server TEXT NOT NULL DEFAULT 'Americas',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_guild_battles_guild_id ON guild_battles(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_battles_battle_id ON guild_battles(battle_id);
CREATE INDEX IF NOT EXISTS idx_guild_battles_captured_at ON guild_battles(captured_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uid_guild_battles_unique ON guild_battles(guild_id, battle_id);

ALTER TABLE guild_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to guild_battles" ON guild_battles
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow service role write to guild_battles" ON guild_battles
  FOR INSERT WITH CHECK (current_setting('request.jwt.claim.role', TRUE) = 'service_role');

CREATE POLICY "Allow service role update guild_battles" ON guild_battles
  FOR UPDATE USING (current_setting('request.jwt.claim.role', TRUE) = 'service_role');

-- Guild leaderboard cache
CREATE TABLE IF NOT EXISTS guild_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id TEXT NOT NULL,
  guild_name TEXT NOT NULL,
  alliance_id TEXT,
  alliance_name TEXT,
  metric TEXT NOT NULL,
  range TEXT NOT NULL,
  rank INTEGER,
  value NUMERIC,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  server TEXT NOT NULL DEFAULT 'Americas'
);

CREATE INDEX IF NOT EXISTS idx_guild_rankings_metric ON guild_rankings(metric);
CREATE INDEX IF NOT EXISTS idx_guild_rankings_range ON guild_rankings(range);
CREATE INDEX IF NOT EXISTS idx_guild_rankings_guild_id ON guild_rankings(guild_id);
CREATE UNIQUE INDEX IF NOT EXISTS uid_guild_rankings_unique ON guild_rankings(guild_id, metric, range, captured_at);

ALTER TABLE guild_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to guild_rankings" ON guild_rankings
  FOR SELECT USING (TRUE);

CREATE POLICY "Allow service role write to guild_rankings" ON guild_rankings
  FOR INSERT WITH CHECK (current_setting('request.jwt.claim.role', TRUE) = 'service_role');

CREATE POLICY "Allow service role update guild_rankings" ON guild_rankings
  FOR UPDATE USING (current_setting('request.jwt.claim.role', TRUE) = 'service_role');

-- Helper function to maintain updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guild_snapshots_updated
  BEFORE UPDATE ON guild_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
