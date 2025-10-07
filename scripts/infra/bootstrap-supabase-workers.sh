#!/usr/bin/env bash
# Bootstrap a Linux VPS for Supabase (self-host PoC) + Cloudflare Workers
# Target OS: Ubuntu 22.04 LTS (Jammy)
# Usage:
#   sudo DOMAIN=example.com EMAIL=admin@example.com HARDEN_SSH=false bash bootstrap-supabase-workers.sh
#
# Required env vars:
#   DOMAIN          Public domain for TLS (Caddy will proxy to Supabase/Kong)
#   EMAIL           Email for TLS notices (Caddy)
# Optional env vars:
#   HARDEN_SSH      Set to "true" to disable password auth and root login (default: false)
#   TZ              Timezone (default: UTC)
#   POSTGRES_PASSWORD  Password for Postgres (random if omitted)
#   EXPOSE_MINIO_CONSOLE  Set to "true" to expose MinIO console on 9001 (default: false)
#
# This script:
# - Secures the VPS (UFW, fail2ban; optional SSH hardening)
# - Installs Docker, Compose plugin, and Caddy
# - Clones Supabase self-host repo and configures .env
# - Generates JWT secret, anon key, and service role key
# - Starts Supabase stack via docker compose
# - Configures Caddy reverse proxy for TLS -> Supabase Kong gateway
# - Sets up a lightweight nightly Postgres dump (PoC)

set -euo pipefail

log() { echo "[bootstrap] $*"; }
err() { echo "[bootstrap:ERROR] $*" >&2; }

require_root() {
  if [[ $EUID -ne 0 ]]; then
    err "Run as root: sudo bash $0"; exit 1
  fi
}

require_var() {
  local name="$1"; local val
  val=$(printenv "$name" || true)
  if [[ -z "$val" ]]; then
    err "Missing required env var: $name"; exit 1
  fi
}

# base64url encode helper
b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

generate_jwt() {
  local role="$1"; local secret="$2"; local iat exp header payload sig
  iat=$(date +%s)
  exp=$(( iat + 31536000 )) # 1 year
  header='{"alg":"HS256","typ":"JWT"}'
  payload=$(jq -nc --arg role "$role" --arg iss "supabase" --argjson iat "$iat" --argjson exp "$exp" '{role:$role, iss:$iss, iat:$iat, exp:$exp}')
  local h b s
  h=$(printf '%s' "$header" | b64url)
  b=$(printf '%s' "$payload" | b64url)
  s=$(printf '%s' "$h.$b" | openssl dgst -sha256 -hmac "$secret" -binary | b64url)
  printf '%s.%s.%s' "$h" "$b" "$s"
}

main() {
  require_root
  require_var DOMAIN
  require_var EMAIL

  export TZ=${TZ:-UTC}
  export HARDEN_SSH=${HARDEN_SSH:-false}
  export EXPOSE_MINIO_CONSOLE=${EXPOSE_MINIO_CONSOLE:-false}

  log "Updating system and installing base packages"
  timedatectl set-timezone "$TZ" || true
  apt-get update -y && apt-get upgrade -y
  apt-get install -y ca-certificates curl gnupg lsb-release jq ufw fail2ban tmux git

  log "Configuring UFW firewall"
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  if [[ "$EXPOSE_MINIO_CONSOLE" == "true" ]]; then
    ufw allow 9001/tcp
  fi
  yes | ufw enable || true

  log "Configuring fail2ban (sshd jail)"
  cat >/etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 10m
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
backend = systemd
EOF
  systemctl enable --now fail2ban

  if [[ "$HARDEN_SSH" == "true" ]]; then
    log "Hardening SSH: disabling password auth and root login"
    sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
    systemctl restart ssh || systemctl restart sshd || true
  else
    log "SSH hardening skipped (HARDEN_SSH=false). Ensure keys are configured before enabling."
  fi

  log "Installing Docker Engine and Compose plugin"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker

  log "Installing Caddy for automatic TLS"
  apt-get install -y caddy
  systemctl enable --now caddy

  mkdir -p /opt/supabase
  cd /opt/supabase

  log "Cloning Supabase self-host repository"
  if [[ ! -d /opt/supabase/supabase ]]; then
    git clone https://github.com/supabase/supabase
  fi
  cd /opt/supabase/supabase/docker

  log "Preparing Supabase .env"
  if [[ ! -f .env ]]; then
    cp .env.example .env
  fi

  # Generate secrets
  export JWT_SECRET=$(openssl rand -hex 32)
  export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(openssl rand -hex 16)}
  export ANON_KEY=$(generate_jwt anon "$JWT_SECRET")
  export SERVICE_ROLE_KEY=$(generate_jwt service_role "$JWT_SECRET")

  # Update .env entries (best-effort sed; keys may differ across versions)
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env || true
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env || true
  sed -i "s|^ANON_KEY=.*|ANON_KEY=$ANON_KEY|" .env || true
  sed -i "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env || true

  # Optional: ensure MinIO endpoints (on docker network) if keys exist in example
  sed -i "s|^STORAGE_BACKEND=.*|STORAGE_BACKEND=s3|" .env || true
  sed -i "s|^STORAGE_S3_ENDPOINT=.*|STORAGE_S3_ENDPOINT=http://storage-minio:9000|" .env || true

  log "Starting Supabase stack with Docker Compose"
  docker compose up -d

  log "Configuring Caddy reverse proxy to Supabase Kong"
  # Kong typically listens on 8000 in the compose stack
  cat >/etc/caddy/Caddyfile <<EOF
{$DOMAIN} {
  encode zstd gzip
  tls {$EMAIL}
  @api path /auth/* /rest/* /realtime/* /storage/* /functions/* /pg/*
  handle @api {
    reverse_proxy 127.0.0.1:8000
  }
  # Optional: Studio UI if exposed (remove if not needed)
  handle_path /studio/* {
    reverse_proxy 127.0.0.1:3000
  }
  respond /health 200
}
EOF
  systemctl reload caddy

  log "Setting up nightly Postgres dump (PoC)"
  mkdir -p /var/backups/supabase
  cat >/etc/cron.d/supabase-pgdump <<'EOF'
# Nightly at 02:10, dump all databases to /var/backups/supabase
10 2 * * * root CONTAINER=$(docker ps --format '{{.Names}} {{.Image}}' | awk '/postgres/ {print $1; exit}') && \
  [ -n "$CONTAINER" ] && docker exec "$CONTAINER" bash -lc "pg_dumpall -U postgres" > \
  "/var/backups/supabase/pg_dumpall-$(date +\%F).sql" 2>>/var/backups/supabase/backup.log
EOF

  log "Bootstrap complete"
  echo "Domain: $DOMAIN"
  echo "Supabase JWT_SECRET stored in /opt/supabase/supabase/docker/.env"
  echo "Anon key and Service Role key generated. Keep SERVICE_ROLE_KEY secret."
  echo "Caddy proxies /auth, /rest, /realtime, /storage, /functions to Supabase Kong on localhost:8000"
}

main "$@"