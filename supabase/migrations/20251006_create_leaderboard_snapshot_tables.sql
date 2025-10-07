-- Create minute-level snapshot tables for reliable fallbacks
-- Guild Leaderboards (attacks, defenses, kill_fame)
create table if not exists public.guild_leaderboard_snapshots (
  id bigserial primary key,
  type text not null check (type in ('attacks','defenses','kill_fame')),
  range text not null check (range in ('day','week','month','lastWeek','lastMonth')),
  server text not null default 'global',
  captured_at timestamptz not null default now(),
  top_count int not null,
  payload jsonb not null
);

-- Indexes for fast retrieval of latest snapshot
create index if not exists idx_guild_leaderboard_snapshots_type_range_time
  on public.guild_leaderboard_snapshots (type, range, captured_at desc);

create index if not exists idx_guild_leaderboard_snapshots_server_time
  on public.guild_leaderboard_snapshots (server, captured_at desc);

-- Optional: GIN index on payload if querying inside JSON
-- create index if not exists idx_guild_leaderboard_snapshots_payload_gin
--   on public.guild_leaderboard_snapshots using gin (payload);

-- RLS setup (allow service role to write; read via server-side only)
alter table public.guild_leaderboard_snapshots enable row level security;

-- Policies: allow only authenticated reads (if needed) and service role writes.
-- In practice, server-side uses service role; client reads go through API.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'guild_leaderboard_snapshots'
      and policyname = 'allow_authenticated_read_guild_leaderboard_snapshots'
  ) then
    create policy allow_authenticated_read_guild_leaderboard_snapshots
      on public.guild_leaderboard_snapshots
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- Player Leaderboards (optional future expansion)
-- create table public.player_leaderboard_snapshots (...);