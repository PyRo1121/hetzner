-- Snapshot tables for all major external APIs (minute-level)
-- Provides reliable fallbacks if upstream APIs fail

-- Market Prices Snapshots
create table if not exists public.market_price_snapshots (
  id bigserial primary key,
  server text not null default 'Americas',
  items text not null, -- comma-separated item IDs
  locations text not null, -- comma-separated city names
  qualities text not null, -- comma-separated quality numbers
  captured_at timestamptz not null default now(),
  count int not null,
  payload jsonb not null
);

create index if not exists idx_market_price_snapshots_server_time
  on public.market_price_snapshots (server, captured_at desc);

create index if not exists idx_market_price_snapshots_time
  on public.market_price_snapshots (captured_at desc);

alter table public.market_price_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'market_price_snapshots'
      and policyname = 'allow_service_role_write_market_price_snapshots'
  ) then
    create policy allow_service_role_write_market_price_snapshots
      on public.market_price_snapshots
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- Market History Snapshots
create table if not exists public.market_history_snapshots (
  id bigserial primary key,
  server text not null default 'Americas',
  items text not null, -- comma-separated item IDs
  locations text null, -- optional city names
  qualities text null, -- optional quality numbers
  time_scale int not null default 24, -- 1 (hourly) or 24 (daily)
  captured_at timestamptz not null default now(),
  count int not null,
  payload jsonb not null
);

create index if not exists idx_market_history_snapshots_server_time
  on public.market_history_snapshots (server, captured_at desc);

create index if not exists idx_market_history_snapshots_time
  on public.market_history_snapshots (captured_at desc);

alter table public.market_history_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'market_history_snapshots'
      and policyname = 'allow_service_role_write_market_history_snapshots'
  ) then
    create policy allow_service_role_write_market_history_snapshots
      on public.market_history_snapshots
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- PvP Kill Feed Snapshots
create table if not exists public.pvp_kill_snapshots (
  id bigserial primary key,
  server text not null default 'Americas',
  captured_at timestamptz not null default now(),
  count int not null,
  payload jsonb not null
);

create index if not exists idx_pvp_kill_snapshots_server_time
  on public.pvp_kill_snapshots (server, captured_at desc);

create index if not exists idx_pvp_kill_snapshots_time
  on public.pvp_kill_snapshots (captured_at desc);

alter table public.pvp_kill_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pvp_kill_snapshots'
      and policyname = 'allow_service_role_write_pvp_kill_snapshots'
  ) then
    create policy allow_service_role_write_pvp_kill_snapshots
      on public.pvp_kill_snapshots
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;
