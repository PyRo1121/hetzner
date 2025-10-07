-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists vault;

-- NOTE: Store your Supabase project URL and CRON secret in Vault:
-- select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
-- select vault.create_secret('YOUR_CRON_SECRET_VALUE', 'cron_secret');

-- Snapshot Market Prices every 5 minutes
select cron.schedule(
  'snapshot-market-prices',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/snapshot-market-prices',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'), 'Content-Type', 'application/json'),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);

-- Sync Gold Prices every 5 minutes
select cron.schedule(
  'sync-gold-prices',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync-gold-prices',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'), 'Content-Type', 'application/json'),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);

-- Snapshot Market History every 15 minutes
select cron.schedule(
  'snapshot-market-history',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/snapshot-market-history',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'), 'Content-Type', 'application/json'),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);

-- Snapshot PvP kills every minute
select cron.schedule(
  'snapshot-pvp-kills',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/snapshot-pvp-kills',
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'), 'Content-Type', 'application/json'),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);
