# VPS Bootstrap: Supabase Self-Host (PoC) + Workers

This guide pairs with `scripts/infra/bootstrap-supabase-workers.sh` to set up a secure Ubuntu 22.04 VPS, install Docker/Caddy, and deploy the Supabase self-host stack, suitable for a cost-effective PoC.

## Prerequisites
- Ubuntu 22.04 LTS server with a public IPv4
- DNS `A` record pointing `DOMAIN` to your server IP
- SSH key-based access (recommended before enabling SSH hardening)

### Hetzner-specific notes
- Recommended: AX41-NVMe (dedicated) for best price/performance with NVMe; or CPX31/CPX41 in Hetzner Cloud for elastic scaling.
- Use Hetzner Cloud Firewall in addition to UFW. See `scripts/infra/hetzner-cloud-firewall.sh`.
- Ensure reverse DNS (rDNS) set for your `DOMAIN` on the public IP (helpful for email/SMTP features).

## One-time Setup
1) Copy the script to the server and run as root:
```
scp scripts/infra/bootstrap-supabase-workers.sh user@server:/tmp/
ssh user@server
sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com bash /tmp/bootstrap-supabase-workers.sh
```

2) Optional: enable stricter SSH security
- Rerun with `HARDEN_SSH=true` once you confirm key-based login works:
```
sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com HARDEN_SSH=true bash /tmp/bootstrap-supabase-workers.sh
```

## What the script does
- Firewall: UFW allowing `22,80,443`; default deny incoming
- Fail2ban: basic `sshd` jail
- Docker: Engine + Compose plugin
- Caddy: auto TLS, reverse proxy to Supabase Kong on `localhost:8000`
- Supabase: clones official self-host repo, generates secrets, starts services
- Backups: nightly `pg_dumpall` to `/var/backups/supabase`

## Hetzner Cloud Firewall (optional but recommended)
Run on any Linux host (can be the server) to configure provider-level firewall:
```
scp scripts/infra/hetzner-cloud-firewall.sh user@server:/tmp/
ssh user@server
sudo HCLOUD_TOKEN=your_hcloud_token SERVER_NAME=your-server-name bash /tmp/hetzner-cloud-firewall.sh
```
- Options:
  - `IP_ALLOWLIST_SSH="x.x.x.x/32,y.y.y.y/32"` to restrict SSH
  - `ALLOW_MINIO_CONSOLE=true` to allow `:9001` publicly (default: false)
  - `ALLOW_STUDIO=true` to allow `:3000` publicly (default: false)

## Variables
- `DOMAIN` (required): the public domain for TLS and proxy routing
- `EMAIL` (required): email for TLS notifications
- `HARDEN_SSH` (optional): `true|false` (default: `false`)
- `TZ` (optional): timezone, default `UTC`
- `POSTGRES_PASSWORD` (optional): random if omitted
- `EXPOSE_MINIO_CONSOLE` (optional): `true` to allow `:9001`

## Locations
- Supabase repo: `/opt/supabase/supabase`
- Supabase env: `/opt/supabase/supabase/docker/.env`
- Caddyfile: `/etc/caddy/Caddyfile`
- Backups: `/var/backups/supabase`

## After Setup
- Confirm TLS is active: `https://yourdomain.com/health`
- Test endpoints behind Kong, e.g. `https://yourdomain.com/rest/v1/` (requires JWT)
- Keep `SERVICE_ROLE_KEY` secret; use anon key with RLS for public reads

## Notes
- This is a PoC bootstrap intended to reduce cost quickly. For production:
  - Add offsite backups and restore rehearsals
  - Consider PGBouncer connection pooling
  - Implement observability (Loki/Prom, uptime checks)
  - Review Supabase version-specific env across updates