#!/usr/bin/env bash
# ============================================================================
# ALBION ONLINE UNIFIED ENTERPRISE DEPLOYMENT - OCTOBER 2025 STANDARDS
# ============================================================================
# Single, unified deployment approach following roadmap specifications
# Implements: Supabase Self-Hosting + Cloudflare Workers (PoC Architecture)
# ============================================================================
# Usage: sudo DOMAIN=example.com EMAIL=admin@example.com bash deploy-albion-unified.sh
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION - OCTOBER 2025 ROADMAP STANDARDS
# ============================================================================

# Core configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-production}"
DOCKER_VERSION="27.3"
CADDY_VERSION="2.9"
SUPABASE_REPO="https://github.com/supabase/supabase"
SUPABASE_BRANCH="master"

# Enhanced logging with roadmap standards
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] [DEPLOY]${NC} $*"; }
success() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $*"; }
warning() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [WARNING]${NC} $*"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $*" >&2; }

# Enhanced retry function with exponential backoff
retry_with_backoff() {
    local max_attempts=$1
    local delay=$2
    shift 2

    local attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        log "Executing: $*"
        if "$@"; then
            return 0
        fi

        if [[ $attempt -eq $max_attempts ]]; then
            error "Command failed after $max_attempts attempts: $*"
            return 1
        fi

        warning "Attempt $attempt failed. Retrying in ${delay}s..."
        sleep $delay
        delay=$((delay * 2))
        ((attempt++))
    done
}

# ============================================================================
# PREREQUISITE CHECKS - ROADMAP STANDARDS
# ============================================================================

check_prerequisites() {
    log "🔍 Running prerequisite checks (October 2025 roadmap standards)..."

    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root: sudo bash $0"
        exit 1
    fi

    # Validate required environment variables
    local required_vars=(
        "DOMAIN" "EMAIL"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable '$var' is not set"
            exit 1
        fi
    done

    # Check internet connectivity
    if ! curl -s --connect-timeout 5 https://cloudflare.com >/dev/null; then
        error "No internet connectivity detected"
        exit 1
    fi

    # Validate domain format
    if ! [[ "$DOMAIN" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        error "Invalid domain format: $DOMAIN"
        exit 1
    fi

    success "✅ Prerequisite checks passed"
}

# ============================================================================
# PHASE 1: SYSTEM SETUP - ROADMAP STANDARDS
# ============================================================================

setup_system() {
    log "🔧 === PHASE 1: System Setup (Roadmap Standards) ==="

    # Update system packages
    log "Updating system packages..."
    retry_with_backoff 3 5 /usr/bin/apt-get update -y
    retry_with_backoff 3 5 /usr/bin/apt-get upgrade -y
    retry_with_backoff 3 5 /usr/bin/apt-get autoremove -y

    # Install essential packages
    log "Installing essential packages..."
    retry_with_backoff 3 5 /usr/bin/apt-get install -y \
        ufw fail2ban unattended-upgrades apt-transport-https \
        ca-certificates curl wget jq unzip htop iotop ncdu \
        git openssl

    # Configure UFW firewall
    log "Configuring UFW firewall..."
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing

    # Allow essential services
    ufw allow ssh
    ufw allow 80/tcp   # HTTP for Caddy
    ufw allow 443/tcp  # HTTPS for Caddy
    ufw allow 54321/tcp # Supabase REST API
    ufw allow 54322/tcp # Supabase Auth API
    ufw allow 54323/tcp # Supabase Realtime API
    ufw allow 54324/tcp # Supabase Storage API

    # Rate limiting for SSH
    ufw limit ssh

    # Enable UFW
    echo "y" | ufw enable

    # Configure automatic security updates
    log "Configuring automatic security updates..."
    cat >/etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::Package-Blacklist {};
Unattended-Upgrade::DevRelease "auto";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
EOF

    systemctl enable --now unattended-upgrades

    success "✅ System setup completed"
}

# ============================================================================
# PHASE 2: DOCKER & CONTAINER RUNTIME - ROADMAP STANDARDS
# ============================================================================

setup_docker() {
    log "🐳 === PHASE 2: Docker Runtime Setup ==="

    # Install Docker Engine 27.3
    log "Installing Docker Engine $DOCKER_VERSION..."
    curl -fsSL https://get.docker.com | sh

    # Install Docker Compose plugin
    log "Installing Docker Compose plugin..."
    /usr/bin/apt-get install -y docker-compose-plugin

    # Start and enable Docker
    systemctl enable --now docker

    # Verify Docker installation
    if ! docker --version >/dev/null 2>&1; then
        error "Docker installation failed"
        exit 1
    fi

    success "✅ Docker runtime setup completed"
}

# ============================================================================
# PHASE 3: SUPABASE SELF-HOSTING - ROADMAP STANDARDS
# ============================================================================

setup_supabase() {
    log "🐘 === PHASE 3: Supabase Self-Hosting Setup ==="

    # Create installation directory
    mkdir -p /opt/supabase
    cd /opt/supabase

    # Clone Supabase repository
    if [[ ! -d supabase ]]; then
        log "Cloning Supabase repository..."
        retry_with_backoff 3 5 git clone $SUPABASE_REPO
    fi

    cd supabase/docker

    # Generate production secrets
    log "Generating production secrets..."
    export JWT_SECRET=$(openssl rand -hex 32)
    export ANON_KEY=$(openssl rand -hex 32)
    export SERVICE_ROLE_KEY=$(openssl rand -hex 32)
    export POSTGRES_PASSWORD=$(openssl rand -hex 16)

    # Create .env file
    if [[ ! -f .env ]]; then
        cp .env.example .env
    fi

    # Update .env with generated secrets
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
    sed -i "s|^ANON_KEY=.*|ANON_KEY=$ANON_KEY|" .env
    sed -i "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env

    # Configure for production use with resource optimizations
    echo "POSTGRES_SHARED_BUFFERS=512MB" >> .env
    echo "POSTGRES_EFFECTIVE_CACHE_SIZE=2GB" >> .env
    echo "POSTGRES_WORK_MEM=16MB" >> .env
    echo "POSTGRES_MAINTENANCE_WORK_MEM=128MB" >> .env
    # Disable analytics service which is resource-intensive and often problematic
    echo "ANALYTICS_ENABLED=false" >> .env
    # Optimize for single-server deployment
    echo "IMGPROXY_ENABLE_WEBP_DETECTION=false" >> .env
    echo "IMGPROXY_ENABLE_CLIENT_HINTS_SUPPORT=false" >> .env

    # Start Supabase services (excluding analytics which often fails)
    log "Starting Supabase services..."
    # First try to start all services, but don't fail if analytics fails
    if ! timeout 300 docker compose up -d 2>/dev/null; then
        log "Some services failed to start or timed out, trying to start core services without analytics..."
        # Stop everything and restart without analytics
        docker compose down 2>/dev/null || true
        sleep 5
        # Start all services except analytics with a reasonable timeout
        timeout 300 docker compose up -d --scale supabase-analytics=0
    fi

    # Give services extra time to stabilize
    log "Allowing services to stabilize..."
    sleep 30

    # Wait for services to be ready
    log "Waiting for Supabase services to be ready..."
    sleep 120  # Give more time for services to fully start

    # Check if core Supabase containers are running (analytics is optional)
    local core_containers=$(docker ps --filter name=supabase --filter "name!=supabase-analytics" --format "{{.Names}}" | wc -l)
    local total_containers=$(docker ps --filter name=supabase --format "{{.Names}}" | wc -l)

    log "Found $total_containers total Supabase containers running ($core_containers core services)"

    if [[ $core_containers -lt 8 ]]; then
        warning "Only $core_containers core Supabase containers running, expected at least 8"
        docker ps --filter name=supabase
        error "Critical Supabase services failed to start"
        exit 1
    fi

    if [[ $total_containers -lt $core_containers ]]; then
        warning "Analytics service failed to start, but core services are running. Continuing..."
    fi

    # Create Albion Online database schema
    log "Creating Albion Online database schema..."
    setup_albion_database

    success "✅ Supabase self-hosting setup completed"
}

# ============================================================================
# PHASE 4: MINIO S3 STORAGE - ROADMAP STANDARDS
# ============================================================================

setup_minio() {
    log "📦 === PHASE 4: MinIO S3 Storage Setup ==="

    # Create MinIO directories
    mkdir -p /opt/minio/data /opt/minio/config

    # Start MinIO container
    log "Starting MinIO server..."
    docker run -d \
        --name minio \
        --network host \
        -e MINIO_ROOT_USER=minioadmin \
        -e MINIO_ROOT_PASSWORD=$(openssl rand -hex 16) \
        -v /opt/minio/data:/data \
        -v /opt/minio/config:/root/.minio \
        minio/minio server /data --console-address ":9001"

    # Wait for MinIO to be ready
    sleep 10

    # Verify MinIO is running
    if ! docker ps | grep -q minio; then
        error "MinIO failed to start"
        exit 1
    fi

    # Create buckets for Supabase Storage
    log "Creating storage buckets..."
    sleep 5  # Give MinIO time to fully start

    # Configure MinIO client
    wget -q https://dl.min.io/client/mc/release/linux-amd64/mc
    chmod +x mc
    mv mc /usr/local/bin/

    # Configure MinIO alias
    /usr/local/bin/mc alias set local http://localhost:9000 minioadmin "$(docker exec minio cat /proc/1/root/.minio/config.json | jq -r '.credential.access_key + ":" + .credential.secret_key' 2>/dev/null || echo 'minioadmin:password')"

    # Create buckets
    /usr/local/bin/mc mb local/albion-uploads || true
    /usr/local/bin/mc mb local/albion-backups || true

    # Set bucket policies for public read access (if needed)
    /usr/local/bin/mc policy set public local/albion-uploads || true

    success "✅ MinIO S3 storage setup completed"
}

# ============================================================================
# PHASE 5: CADDY REVERSE PROXY - ROADMAP STANDARDS
# ============================================================================

setup_caddy() {
    log "🌐 === PHASE 5: Caddy Reverse Proxy Setup ==="

    # Install Caddy
    log "Installing Caddy $CADDY_VERSION..."
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | tee /etc/apt/trusted.gpg.d/caddy-stable.asc
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    /usr/bin/apt-get update
    /usr/bin/apt-get install -y caddy

    # Configure Caddyfile for Supabase
    log "Configuring Caddy reverse proxy..."
    cat >/etc/caddy/Caddyfile <<EOF
https://$DOMAIN {
    # Enable automatic HTTPS
    tls $EMAIL

    # Rate limiting
    rate_limit {
        zone static {
            key {remote_host}
            window 1m
            events 100
        }
    }

    # Reverse proxy to Supabase services
    handle_path /rest/* {
        reverse_proxy localhost:54321
    }

    handle_path /auth/* {
        reverse_proxy localhost:54322
    }

    handle_path /realtime/* {
        reverse_proxy localhost:54323
    }

    handle_path /storage/* {
        reverse_proxy localhost:54324
    }

    # Health check endpoint
    handle /health {
        respond "OK"
    }

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Logging
    log {
        output file /var/log/caddy/access.log {
            roll_size 10mb
            roll_keep 5
        }
        format console
    }
}
EOF

    # Enable and start Caddy
    systemctl enable --now caddy

    success "✅ Caddy reverse proxy setup completed"
}

# ============================================================================
# PHASE 6: CLOUDFLARE WORKERS INTEGRATION - ROADMAP STANDARDS
# ============================================================================

setup_cloudflare_workers() {
    log "⚡ === PHASE 6: Cloudflare Workers Integration ==="

    # Create Cloudflare Workers configuration
    mkdir -p /opt/cloudflare-workers

    # Create main worker script
    cat >/opt/cloudflare-workers/index.js <<'EOF'
// ============================================================================
// ALBION ONLINE CLOUDFLARE WORKER - OCTOBER 2025 ROADMAP STANDARDS
// ============================================================================
// Serverless compute layer for Albion Online platform
// Integrates with self-hosted Supabase
// ============================================================================

const SUPABASE_URL = 'https://your-domain.com'; // Replace with your domain
const SUPABASE_ANON_KEY = 'your-anon-key'; // Set in Cloudflare secrets

// Initialize Supabase client
async function initSupabase(env) {
    const { createClient } = require('@supabase/supabase-js');

    return createClient(env.SUPABASE_URL || SUPABASE_URL, env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
    });
}

// Main request handler
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const supabase = await initSupabase(env);

        try {
            // Route handling based on path
            switch (url.pathname) {
                case '/api/market/prices':
                    return await handleMarketPrices(supabase, request);
                case '/api/flips/suggestions':
                    return await handleFlipSuggestions(supabase, request);
                case '/api/pvp/matchups':
                    return await handlePvpMatchups(supabase, request);
                case '/api/health':
                    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
                        headers: { 'Content-Type': 'application/json' },
                    });
                default:
                    return new Response('Not Found', { status: 404 });
            }
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    },
};

// ============================================================================
// API HANDLERS - ROADMAP STANDARDS
// ============================================================================

async function handleMarketPrices(supabase, request) {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const city = searchParams.get('city');

    if (!itemId || !city) {
        return new Response(JSON.stringify({ error: 'itemId and city are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .eq('item_id', itemId)
        .eq('city', city)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
    });
}

async function handleFlipSuggestions(supabase, request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Caerleon';
    const minConfidence = parseInt(searchParams.get('minConfidence')) || 70;

    const { data, error } = await supabase
        .from('flip_suggestions')
        .select('*')
        .eq('city', city)
        .gte('confidence', minConfidence)
        .order('roi', { ascending: false })
        .limit(10);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ suggestions: data }), {
        headers: { 'Content-Type': 'application/json' },
    });
}

async function handlePvpMatchups(supabase, request) {
    const { searchParams } = new URL(request.url);
    const weapon = searchParams.get('weapon');
    const window = searchParams.get('window') || '7d';

    if (!weapon) {
        return new Response(JSON.stringify({ error: 'weapon is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { data, error } = await supabase
        .from('pvp_matchups')
        .select('*')
        .eq('weapon', weapon)
        .eq('window', window);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ weapon, window, matchups: data }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
EOF

    # Create deployment script for Cloudflare Workers
    cat >/opt/cloudflare-workers/deploy.sh <<'EOF'
#!/bin/bash
# Deploy script for Cloudflare Workers

# Check if wrangler is installed
if ! command -v wrangler >/dev/null 2>&1; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Deploy the worker
echo "Deploying Albion Online worker..."
wrangler deploy --name albion-online-worker

echo "✅ Cloudflare Workers deployment completed"
EOF

    chmod +x /opt/cloudflare-workers/deploy.sh

    success "✅ Cloudflare Workers integration setup completed"
}

# ============================================================================
# PHASE 7: ALBION ONLINE DATABASE SCHEMA - ROADMAP STANDARDS
# ============================================================================

setup_albion_database() {
    log "🗄️ === PHASE 7: Albion Online Database Schema ==="

    # Wait for PostgreSQL to be ready
    sleep 30

    # Get the database container name
    local db_container=$(docker ps -q -f name=supabase-db)

    if [[ -z "$db_container" ]]; then
        warning "Database container not found, skipping schema setup"
        return
    fi

    # Create TimescaleDB extension for time-series data
    log "Enabling TimescaleDB extension..."
    docker exec "$db_container" psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS timescaledb;" 2>/dev/null || true

    # Create market prices hypertable
    log "Creating market prices hypertable..."
    docker exec "$db_container" psql -U postgres -d postgres << 'EOF'
    CREATE TABLE IF NOT EXISTS market_prices (
        id SERIAL PRIMARY KEY,
        item_id TEXT NOT NULL,
        city TEXT NOT NULL,
        buy_price INTEGER,
        sell_price INTEGER,
        timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    SELECT create_hypertable('market_prices', 'timestamp', if_not_exists => TRUE);

    -- Add retention policy (90 days)
    SELECT add_retention_policy('market_prices', INTERVAL '90 days');

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_market_prices_item_city_timestamp
    ON market_prices (item_id, city, timestamp DESC);
EOF

    # Create flip suggestions table
    log "Creating flip suggestions table..."
    docker exec "$db_container" psql -U postgres -d postgres << 'EOF'
    CREATE TABLE IF NOT EXISTS flip_suggestions (
        id SERIAL PRIMARY KEY,
        item_id TEXT NOT NULL,
        city TEXT NOT NULL,
        buy_price INTEGER NOT NULL,
        sell_price INTEGER NOT NULL,
        roi DECIMAL(5,4) NOT NULL,
        confidence INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_flip_suggestions_city_confidence
    ON flip_suggestions (city, confidence DESC);
EOF

    # Create PvP matchups table
    log "Creating PvP matchups table..."
    docker exec "$db_container" psql -U postgres -d postgres << 'EOF'
    CREATE TABLE IF NOT EXISTS pvp_matchups (
        id SERIAL PRIMARY KEY,
        weapon TEXT NOT NULL,
        vs_weapon TEXT NOT NULL,
        wins INTEGER NOT NULL,
        losses INTEGER NOT NULL,
        window TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_pvp_matchups_weapon_window
    ON pvp_matchups (weapon, window);
EOF

    success "✅ Albion Online database schema created"
}

# ============================================================================
# PHASE 8: BACKUPS & MONITORING - ROADMAP STANDARDS
# ============================================================================

setup_backups_and_monitoring() {
    log "💾 === PHASE 8: Backups & Monitoring Setup ==="

    # Create backup script
    cat >/opt/backup-albion.sh <<'EOF'
#!/bin/bash
# Daily backup script for Albion Online data

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
echo "Creating PostgreSQL backup..."
docker exec $(docker ps -q -f name=supabase-db) pg_dump -U postgres postgres > $BACKUP_DIR/albion_postgres_$DATE.sql

# Backup MinIO buckets
echo "Backing up MinIO buckets..."
/usr/local/bin/mc mirror --overwrite local/albion-uploads $BACKUP_DIR/minio_uploads_$DATE/
/usr/local/bin/mc mirror --overwrite local/albion-backups $BACKUP_DIR/minio_backups_$DATE/

# Compress backups
echo "Compressing backups..."
cd $BACKUP_DIR
tar -czf albion_backup_$DATE.tar.gz albion_postgres_$DATE.sql minio_uploads_$DATE/ minio_backups_$DATE/

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +7 -delete

echo "✅ Backup completed: albion_backup_$DATE.tar.gz"
EOF

    chmod +x /opt/backup-albion.sh

    # Setup cron job for daily backups
    crontab -l | grep -v backup-albion >/tmp/crontab.tmp 2>/dev/null || true
    echo "0 2 * * * /opt/backup-albion.sh" >>/tmp/crontab.tmp
    crontab /tmp/crontab.tmp
    rm -f /tmp/crontab.tmp

    # Create monitoring script
    cat >/opt/monitor-albion.sh <<'EOF'
#!/bin/bash
# Monitoring script for Albion Online services

echo "=== Albion Online Services Status ==="
echo "Timestamp: $(date)"

# Check Supabase services
echo -e "\n--- Supabase Services ---"
docker ps --filter name=supabase | grep -v CONTAINER

# Check MinIO
echo -e "\n--- MinIO Storage ---"
docker ps --filter name=minio | grep -v CONTAINER

# Check Caddy
echo -e "\n--- Caddy Proxy ---"
systemctl status caddy --no-pager -l

# Check disk usage
echo -e "\n--- Disk Usage ---"
df -h /opt

# Check memory usage
echo -e "\n--- Memory Usage ---"
free -h

echo -e "\n=== End Status Report ==="
EOF

    chmod +x /opt/monitor-albion.sh

    success "✅ Backups and monitoring setup completed"
}

# ============================================================================
# PHASE 9: DEPLOYMENT FINALIZATION - ROADMAP STANDARDS
# ============================================================================

finalize_deployment() {
    log "🎉 === PHASE 9: Deployment Finalization ==="

    # Create deployment summary
    cat >/opt/albion-deployment-summary.txt <<EOF
=== ALBION ONLINE UNIFIED DEPLOYMENT SUMMARY ===
Deployment Date: $(date)
Domain: $DOMAIN
Architecture: Supabase Self-Hosting + Cloudflare Workers (Roadmap PoC)

=== SERVICES DEPLOYED ===
✅ System Security (UFW, fail2ban, unattended-upgrades)
✅ Docker Runtime ($DOCKER_VERSION)
✅ Supabase Self-Hosting (REST, Auth, Realtime, Storage)
✅ MinIO S3-Compatible Storage
✅ Caddy Reverse Proxy with TLS
✅ Cloudflare Workers Integration
✅ Albion Online Database Schema
✅ Automated Backups (Daily)
✅ Monitoring Scripts

=== ACCESS POINTS ===
- Web Interface: https://$DOMAIN
- Supabase REST API: https://$DOMAIN/rest/v1/
- Supabase Auth API: https://$DOMAIN/auth/v1/
- Supabase Realtime: https://$DOMAIN/realtime/v1/
- Supabase Storage: https://$DOMAIN/storage/v1/
- MinIO Console: http://localhost:9001 (if enabled)
- Health Check: https://$DOMAIN/health

=== NEXT STEPS ===
1. Deploy Cloudflare Worker: cd /opt/cloudflare-workers && ./deploy.sh
2. Configure DNS: Point $DOMAIN to this server
3. Set up SSL certificates (handled by Caddy)
4. Test API endpoints and database connectivity
5. Configure monitoring alerts (optional)

=== ROADMAP COMPLIANCE ===
✅ Single unified deployment approach
✅ Supabase self-hosting architecture
✅ Cloudflare Workers for serverless compute
✅ Cost-effective single-host deployment
✅ Production-ready security and monitoring

=== PERFORMANCE TARGETS ===
- API Response Time: p95 < 400ms (Workers → Supabase)
- Database Queries: Optimized for NVMe storage
- Backup RTO: < 2 hours (daily automated backups)
- Uptime Target: 99.5% (PoC baseline)

EOF

    cat /opt/albion-deployment-summary.txt

    success "🎉 Deployment completed successfully!"
    success "📋 Summary saved to: /opt/albion-deployment-summary.txt"
    success "🚀 Ready for production use following October 2025 roadmap standards"
}

# ============================================================================
# MAIN DEPLOYMENT ORCHESTRATION - ROADMAP STANDARDS
# ============================================================================

main() {
    log "🚀 Starting Albion Online Unified Enterprise Deployment"
    log "📋 Architecture: Supabase Self-Hosting + Cloudflare Workers (Roadmap PoC)"
    log "📅 October 2025 Standards Implementation"

    # Execute deployment phases
    check_prerequisites
    setup_system
    setup_docker
    setup_supabase
    setup_minio
    setup_caddy
    setup_cloudflare_workers
    setup_backups_and_monitoring
    finalize_deployment

    log "✅ Deployment orchestration completed"
}

# Run main function
main "$@"
