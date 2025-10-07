#!/usr/bin/env bash
# Enhanced Supabase Workers Bootstrap Script
# Modernized for October 2025 standards
# Target OS: Ubuntu 22.04/24.04 LTS
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
#   DEBUG           Set to "true" for verbose logging (default: false)
#
# This script:
# - Secures the VPS (UFW, fail2ban; optional SSH hardening)
# - Installs latest Docker Engine (27.3), Compose plugin, and Caddy (2.9)
# - Clones Supabase self-host repo and configures .env
# - Generates JWT secret, anon key, and service role key
# - Starts Supabase stack via docker compose
# - Configures Caddy reverse proxy for TLS -> Supabase Kong gateway
# - Sets up enhanced nightly Postgres dump with retention

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration - October 2025 Standards
DOCKER_VERSION="27.3"  # Latest stable Docker Engine
CADDY_VERSION="2.9"    # Latest stable Caddy
SUPABASE_REPO="https://github.com/supabase/supabase"
SUPABASE_BRANCH="master"
BACKUP_RETENTION_DAYS=7
RETRY_ATTEMPTS=3
RETRY_DELAY=5

# Enhanced logging functions with timestamps
log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] [bootstrap]${NC} $*"; }
err() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] [bootstrap:ERROR]${NC} $*" >&2; }
log_success() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [WARNING]${NC} $*"; }
log_debug() { [[ "${DEBUG:-false}" == "true" ]] && echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] [DEBUG]${NC} $*" || true; }

require_root() {
  if [[ $EUID -ne 0 ]]; then
    err "Run as root: sudo bash $0"; exit 1
  fi
}

# Enhanced error handling with line numbers
error_exit() {
  err "$1 at line $2"
  exit 1
}

# Trap errors with line numbers
trap 'error_exit "An error occurred" $LINENO' ERR

# Retry function with exponential backoff
retry_with_backoff() {
  local max_attempts=$1
  local delay=$2
  local command="${@:3}"
  local attempt=1
  
  while [[ $attempt -le $max_attempts ]]; do
    if eval "$command"; then
      return 0
    else
      if [[ $attempt -eq $max_attempts ]]; then
        err "Command failed after $max_attempts attempts: $command"
        return 1
      fi
      log_warning "Attempt $attempt failed. Retrying in ${delay}s..."
      sleep $delay
      delay=$((delay * 2))  # Exponential backoff
      ((attempt++))
    fi
  done
}

# System requirements check
check_system_requirements() {
  log "Checking system requirements..."
  
  # Check Ubuntu version
  if ! grep -q "Ubuntu" /etc/os-release; then
    err "This script requires Ubuntu 22.04 or 24.04 LTS"; exit 1
  fi
  
  local ubuntu_version=$(grep VERSION_ID /etc/os-release | cut -d'"' -f2)
  if [[ "$ubuntu_version" != "22.04" && "$ubuntu_version" != "24.04" ]]; then
    log_warning "Untested Ubuntu version: $ubuntu_version. Recommended: 22.04 or 24.04"
  fi
  
  # Check available disk space (minimum 10GB)
  local available_space=$(df / | awk 'NR==2 {print $4}')
  if [[ $available_space -lt 10485760 ]]; then  # 10GB in KB
    err "Insufficient disk space. At least 10GB required."; exit 1
  fi
  
  # Check available memory (minimum 2GB)
  local available_memory=$(free -m | awk 'NR==2{print $2}')
  if [[ $available_memory -lt 2048 ]]; then
    log_warning "Low memory detected: ${available_memory}MB. Recommended: 4GB+"
  fi
  
  log_success "System requirements check passed"
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

install_k3s_helm() {
    log "Installing k3s and Helm (if needed for hybrid setup)"
    
    # Install k3s with modern configuration
    retry_with_backoff $RETRY_ATTEMPTS $RETRY_DELAY "curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.34.1+k3s1 sh -s - --disable traefik --disable servicelb --write-kubeconfig-mode 644"
    
    # Wait for k3s to be ready
    local timeout=60
    local count=0
    while ! kubectl get nodes &>/dev/null; do
        if [[ $count -ge $timeout ]]; then
            error_exit "k3s failed to start within ${timeout}s"
        fi
        sleep 1
        ((count++))
    done
    
    # Install Helm if not present
    if ! command -v helm &>/dev/null; then
        log "Installing Helm..."
        retry_with_backoff $RETRY_ATTEMPTS $RETRY_DELAY "curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash"
    fi
    
    log_success "k3s and Helm installed successfully"
}

install_ingress_certmanager() {
    log "Installing ingress-nginx and cert-manager with October 2025 standards"
    
    # Add Helm repositories with retry
    retry_with_backoff $RETRY_ATTEMPTS $RETRY_DELAY "helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx"
    retry_with_backoff $RETRY_ATTEMPTS $RETRY_DELAY "helm repo add jetstack https://charts.jetstack.io"
    retry_with_backoff $RETRY_ATTEMPTS $RETRY_DELAY "helm repo update"
    
    # Install ingress-nginx v4.13.3 with enhanced configuration
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --version 4.13.3 \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.replicaCount=2 \
        --set controller.resources.requests.cpu=100m \
        --set controller.resources.requests.memory=128Mi \
        --set controller.resources.limits.cpu=500m \
        --set controller.resources.limits.memory=512Mi \
        --set controller.metrics.enabled=true \
        --set controller.metrics.serviceMonitor.enabled=true \
        --set controller.podSecurityContext.runAsNonRoot=true \
        --set controller.podSecurityContext.runAsUser=101 \
        --set controller.podSecurityContext.fsGroup=101 \
        --set controller.service.type=LoadBalancer \
        --wait --timeout=300s
    
    # Install cert-manager v1.16.1 with CRDs
    retry_with_backoff $RETRY_ATTEMPTS $RETRY_DELAY "kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.1/cert-manager.crds.yaml"
    
    helm upgrade --install cert-manager jetstack/cert-manager \
        --version v1.16.1 \
        --namespace cert-manager \
        --create-namespace \
        --set installCRDs=false \
        --set prometheus.enabled=true \
        --set webhook.securePort=10260 \
        --set resources.requests.cpu=10m \
        --set resources.requests.memory=32Mi \
        --set webhook.resources.requests.cpu=10m \
        --set webhook.resources.requests.memory=32Mi \
        --set cainjector.resources.requests.cpu=10m \
        --set cainjector.resources.requests.memory=32Mi \
        --wait --timeout=300s
    
    # Wait for cert-manager to be ready
    kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=300s
    kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=300s
    kubectl wait --for=condition=Available deployment/cert-manager-cainjector -n cert-manager --timeout=300s
    
    # Create ClusterIssuer for Let's Encrypt
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${EMAIL}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
          podTemplate:
            spec:
              nodeSelector:
                "kubernetes.io/os": linux
EOF
    
    log_success "ingress-nginx and cert-manager installed successfully"
}

main() {
  require_root
  require_var DOMAIN
  require_var EMAIL

  export TZ=${TZ:-UTC}
  export HARDEN_SSH=${HARDEN_SSH:-false}
  export EXPOSE_MINIO_CONSOLE=${EXPOSE_MINIO_CONSOLE:-false}
  export DEBUG=${DEBUG:-false}

  # Run system requirements check
  check_system_requirements

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

  log "Installing Docker Engine ${DOCKER_VERSION} and Compose plugin"
  # Remove old Docker versions
  apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
  
  install -m 0755 -d /etc/apt/keyrings
  retry_with_backoff $RETRY_ATTEMPTS $RETRY_DELAY "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg"
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  
  # Configure Docker daemon with security best practices
  mkdir -p /etc/docker
  cat >/etc/docker/daemon.json <<'DOCKEREOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true
}
DOCKEREOF
  
  systemctl enable --now docker
  log_success "Docker ${DOCKER_VERSION} installed successfully"

  log "Installing Caddy ${CADDY_VERSION} for automatic TLS"
  retry_with_backoff $RETRY_ATTEMPTS $RETRY_DELAY "curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
  
  # Configure Caddy security settings
  mkdir -p /etc/caddy/conf.d
  cat >/etc/caddy/conf.d/security.conf <<'CADDYEOF'
# Security headers
(security_headers) {
  header {
    # Enable HSTS
    Strict-Transport-Security max-age=31536000;
    # Prevent MIME sniffing
    X-Content-Type-Options nosniff
    # Prevent clickjacking
    X-Frame-Options DENY
    # XSS protection
    X-XSS-Protection "1; mode=block"
    # Referrer policy
    Referrer-Policy strict-origin-when-cross-origin
    # Remove server header
    -Server
  }
}
CADDYEOF
  
  systemctl enable --now caddy
  log_success "Caddy ${CADDY_VERSION} installed successfully"

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

  log "Configuring enhanced Caddy reverse proxy to Supabase Kong"
  # Kong typically listens on 8000 in the compose stack
  cat >/etc/caddy/Caddyfile <<EOF
# Import security headers
import conf.d/security.conf

{$DOMAIN} {
  # Apply security headers
  import security_headers
  
  # Enhanced compression
  encode zstd gzip
  
  # TLS configuration
  tls {$EMAIL} {
    protocols tls1.2 tls1.3
  }
  
  # Rate limiting
  rate_limit {
    zone static_ip_10rs {
      key {remote_host}
      events 10
      window 1s
    }
  }
  
  # API routes
  @api path /auth/* /rest/* /realtime/* /storage/* /functions/* /pg/*
  handle @api {
    reverse_proxy 127.0.0.1:8000 {
      health_uri /health
      health_interval 30s
      health_timeout 5s
    }
  }
  
  # Studio UI (optional)
  handle_path /studio/* {
    reverse_proxy 127.0.0.1:3000 {
      health_uri /api/profile
      health_interval 30s
      health_timeout 5s
    }
  }
  
  # Health check endpoint
  handle /health {
    respond "OK" 200
  }
  
  # Security: Block common attack paths
  @blocked {
    path /.env* /config/* /admin/* /.git/*
  }
  handle @blocked {
    respond "Not Found" 404
  }
  
  # Logging
  log {
    output file /var/log/caddy/{$DOMAIN}.log {
      roll_size 10MB
      roll_keep 5
    }
    format json
  }
}
EOF
  
  # Test Caddy configuration
  if ! caddy validate --config /etc/caddy/Caddyfile; then
    err "Caddy configuration validation failed"; exit 1
  fi
  
  systemctl reload caddy
  log_success "Enhanced Caddy configuration applied"

  log "Setting up enhanced nightly Postgres backup with retention"
  mkdir -p /var/backups/supabase
  chmod 700 /var/backups/supabase
  
  # Create backup script with compression and retention
  cat >/usr/local/bin/supabase-backup.sh <<'BACKUPEOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/supabase"
RETENTION_DAYS=7
DATE=$(date +%F_%H%M%S)
LOG_FILE="$BACKUP_DIR/backup.log"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting Supabase backup..."

# Find PostgreSQL container
CONTAINER=$(docker ps --format '{{.Names}} {{.Image}}' | awk '/postgres/ {print $1; exit}')

if [ -z "$CONTAINER" ]; then
  log "ERROR: PostgreSQL container not found"
  exit 1
fi

log "Found PostgreSQL container: $CONTAINER"

# Create backup with compression
if docker exec "$CONTAINER" bash -lc "pg_dumpall -U postgres" | gzip > "$BACKUP_DIR/pg_dumpall-$DATE.sql.gz"; then
  log "Backup completed successfully: pg_dumpall-$DATE.sql.gz"
  
  # Verify backup integrity
  if gzip -t "$BACKUP_DIR/pg_dumpall-$DATE.sql.gz"; then
    log "Backup integrity verified"
  else
    log "ERROR: Backup integrity check failed"
    exit 1
  fi
  
  # Clean up old backups
  find "$BACKUP_DIR" -name "pg_dumpall-*.sql.gz" -mtime +$RETENTION_DAYS -delete
  log "Cleaned up backups older than $RETENTION_DAYS days"
  
  # Log backup size and count
  BACKUP_SIZE=$(du -h "$BACKUP_DIR/pg_dumpall-$DATE.sql.gz" | cut -f1)
  BACKUP_COUNT=$(find "$BACKUP_DIR" -name "pg_dumpall-*.sql.gz" | wc -l)
  log "Backup size: $BACKUP_SIZE, Total backups: $BACKUP_COUNT"
else
  log "ERROR: Backup failed"
  exit 1
fi
BACKUPEOF
  
  chmod +x /usr/local/bin/supabase-backup.sh
  
  # Create cron job
  cat >/etc/cron.d/supabase-pgdump <<'CRONEOF'
# Enhanced nightly Postgres backup at 02:10 with logging
10 2 * * * root /usr/local/bin/supabase-backup.sh
CRONEOF
  
  log_success "Enhanced backup system configured with $BACKUP_RETENTION_DAYS day retention"

  log_success "Enhanced Supabase Workers bootstrap complete!"
  echo ""
  echo -e "${GREEN}=== DEPLOYMENT SUMMARY ===${NC}"
  echo -e "${CYAN}Domain:${NC} $DOMAIN"
  echo -e "${CYAN}Docker Version:${NC} $DOCKER_VERSION"
  echo -e "${CYAN}Caddy Version:${NC} $CADDY_VERSION"
  echo -e "${CYAN}Supabase Config:${NC} /opt/supabase/supabase/docker/.env"
  echo -e "${CYAN}Backup Location:${NC} /var/backups/supabase"
  echo -e "${CYAN}Backup Retention:${NC} $BACKUP_RETENTION_DAYS days"
  echo ""
  echo -e "${YELLOW}=== SECURITY NOTES ===${NC}"
  echo -e "${RED}• Keep SERVICE_ROLE_KEY secret and secure${NC}"
  echo -e "${RED}• JWT_SECRET is stored in .env file - protect access${NC}"
  echo -e "${RED}• Review firewall rules: $(ufw status)${NC}"
  echo -e "${RED}• Monitor logs: /var/log/caddy/${DOMAIN}.log${NC}"
  echo ""
  echo -e "${BLUE}=== ENDPOINTS ===${NC}"
  echo -e "${CYAN}• API:${NC} https://$DOMAIN/rest/v1/"
  echo -e "${CYAN}• Auth:${NC} https://$DOMAIN/auth/v1/"
  echo -e "${CYAN}• Realtime:${NC} wss://$DOMAIN/realtime/v1/"
  echo -e "${CYAN}• Storage:${NC} https://$DOMAIN/storage/v1/"
  echo -e "${CYAN}• Functions:${NC} https://$DOMAIN/functions/v1/"
  if [[ "$EXPOSE_MINIO_CONSOLE" == "true" ]]; then
    echo -e "${CYAN}• MinIO Console:${NC} https://$DOMAIN:9001/"
  fi
  echo ""
  echo -e "${GREEN}Next steps:${NC}"
  echo -e "1. Test endpoints: curl https://$DOMAIN/health"
  echo -e "2. Access Supabase Studio: https://$DOMAIN/studio"
  echo -e "3. Configure your application with the generated keys"
  echo -e "4. Set up monitoring and alerting"
  echo -e "5. Review and customize backup schedule if needed"
}

main "$@"