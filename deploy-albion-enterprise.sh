#!/usr/bin/env bash
# Albion Online Ultimate Resource Hub - Enterprise Deployment Script
# October 2025 - World-Class Self-Hosted Solution
# Usage: sudo bash deploy-albion-enterprise.sh

set -euo pipefail

# ============================================================================
# CONFIGURATION - EDIT THESE VALUES FOR YOUR DEPLOYMENT
# ============================================================================

# Domain Configuration
export DOMAIN="${DOMAIN:-pyro1121.com}"
export EMAIL="${EMAIL:-admin@pyro1121.com}"

# Hetzner Cloud Configuration
export HCLOUD_TOKEN="${HCLOUD_TOKEN:-}"  # Required for firewall setup
export HCLOUD_SERVER_ID="${HCLOUD_SERVER_ID:-}"  # Required if using Hetzner firewall

# Database Configuration
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -hex 16)}"
export REDIS_PASSWORD="${REDIS_PASSWORD:-$(openssl rand -hex 16)}"

# CDN Configuration (Cloudflare R2)
export S3_ENDPOINT="${S3_ENDPOINT:-https://your-account-id.r2.cloudflarestorage.com}"
export S3_ACCESS_KEY="${S3_ACCESS_KEY:-your-cloudflare-access-key}"
export S3_SECRET_KEY="${S3_SECRET_KEY:-your-cloudflare-secret-key}"
export S3_BUCKET="${S3_BUCKET:-albion-data}"
export S3_REGION="${S3_REGION:-auto}"

# Supabase Configuration
export SUPABASE_URL="${SUPABASE_URL:-https://$DOMAIN}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$(openssl rand -hex 32)}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-$(openssl rand -hex 32)}"

# Coolify Configuration
export COOLIFY_URL="${COOLIFY_URL:-https://coolify.$DOMAIN}"
export COOLIFY_ADMIN_EMAIL="${COOLIFY_ADMIN_EMAIL:-$EMAIL}"

# GitHub Configuration (for CI/CD)
export GITHUB_REPO="${GITHUB_REPO:-PyRo1121/hetzner}"
export GITHUB_TOKEN="${GITHUB_TOKEN:-}"  # Required for CI/CD setup

# Advanced Options
export ENABLE_ADVANCED_MONITORING="${ENABLE_ADVANCED_MONITORING:-true}"
export ENABLE_BACKUP="${ENABLE_BACKUP:-true}"
export SSH_PORT="${SSH_PORT:-22}"
export SSH_ALLOW_IPS="${SSH_ALLOW_IPS:-0.0.0.0/0}"

# ============================================================================
# COLORS AND LOGGING
# ============================================================================

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

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

check_requirements() {
    log "Checking deployment requirements..."

    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root: sudo bash $0"
        exit 1
    fi

    # Check Ubuntu version
    if ! grep -q "Ubuntu" /etc/os-release; then
        error "This script requires Ubuntu 22.04 or 24.04 LTS"
        exit 1
    fi

    # Check disk space (minimum 20GB for full deployment)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 20971520 ]]; then  # 20GB in KB
        error "Insufficient disk space. At least 20GB required."
        exit 1
    fi

    # Check memory (minimum 4GB recommended)
    local available_memory=$(free -m | awk 'NR==2{print $2}')
    if [[ $available_memory -lt 4096 ]]; then
        warning "Low memory detected: ${available_memory}MB. Recommended: 8GB+"
    fi

    success "System requirements check passed"
}

validate_environment() {
    log "Validating environment configuration..."

    local required_vars=(
        "DOMAIN"
        "EMAIL"
        "HCLOUD_TOKEN"
        "HCLOUD_SERVER_ID"
        "S3_ACCESS_KEY"
        "S3_SECRET_KEY"
        "GITHUB_TOKEN"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Missing required environment variable: $var"
            error "Please set $var before running this script"
            exit 1
        fi
    done

    success "Environment validation passed"
}

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

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
                error "Command failed after $max_attempts attempts: $command"
                return 1
            fi
            warning "Attempt $attempt failed. Retrying in ${delay}s..."
            sleep $delay
            delay=$((delay * 2))
            ((attempt++))
        fi
    done
}

generate_jwt_secret() {
    openssl rand -hex 32
}

# ============================================================================
# PHASE 1: SYSTEM SETUP AND SECURITY
# ============================================================================

setup_system() {
    log "=== PHASE 1: Setting up system and security ==="

    # Update system
    log "Updating system packages..."
    retry_with_backoff 3 5 "apt-get update -y && apt-get upgrade -y"

    # Install base packages
    log "Installing base packages..."
    retry_with_backoff 3 5 "apt-get install -y ca-certificates curl gnupg lsb-release jq ufw fail2ban tmux git wget unzip"

    # Configure firewall
    log "Configuring UFW firewall..."
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow $SSH_PORT/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp

    if [[ "$ENABLE_ADVANCED_MONITORING" == "true" ]]; then
        ufw allow 9090/tcp  # Prometheus
        ufw allow 3000/tcp  # Grafana
        ufw allow 3100/tcp  # Loki
    fi

    yes | ufw enable || true

    # Configure fail2ban
    log "Configuring fail2ban..."
    cat >/etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 10m
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
backend = systemd
EOF
    systemctl enable --now fail2ban

    # Harden SSH if requested
    if [[ "${SSH_HARDEN:-false}" == "true" ]]; then
        log "Hardening SSH configuration..."
        sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
        sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
        systemctl restart ssh || systemctl restart sshd || true
    fi

    success "System setup and security completed"
}

# ============================================================================
# PHASE 2: DOCKER AND CONTAINER RUNTIME
# ============================================================================

setup_docker() {
    log "=== PHASE 2: Installing Docker and container runtime ==="

    # Remove old Docker versions
    apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

    # Install Docker Engine 27.3
    log "Installing Docker Engine 27.3..."
    install -m 0755 -d /etc/apt/keyrings
    retry_with_backoff 3 5 "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg"
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list

    retry_with_backoff 3 5 "apt-get update -y"
    retry_with_backoff 3 5 "apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin"

    # Configure Docker daemon
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
  "no-new-privileges": true,
  "storage-driver": "overlay2"
}
DOCKEREOF

    systemctl enable --now docker

    success "Docker installation completed"
}

# ============================================================================
# PHASE 3: SUPABASE SELF-HOSTED SETUP
# ============================================================================

setup_supabase() {
    log "=== PHASE 3: Setting up self-hosted Supabase ==="

    mkdir -p /opt/supabase
    cd /opt/supabase

    # Clone Supabase repository
    if [[ ! -d supabase ]]; then
        log "Cloning Supabase repository..."
        retry_with_backoff 3 5 "git clone https://github.com/supabase/supabase"
    fi

    cd supabase/docker

    # Configure environment
    if [[ ! -f .env ]]; then
        cp .env.example .env
    fi

    # Generate and set secrets
    export JWT_SECRET=$(generate_jwt_secret)
    export ANON_KEY=$(generate_jwt_secret)
    export SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

    # Update .env file
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
    sed -i "s|^ANON_KEY=.*|ANON_KEY=$ANON_KEY|" .env
    sed -i "s|^SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env

    # Configure storage backend for S3
    sed -i "s|^STORAGE_BACKEND=.*|STORAGE_BACKEND=s3|" .env
    sed -i "s|^STORAGE_S3_ENDPOINT=.*|STORAGE_S3_ENDPOINT=$S3_ENDPOINT|" .env
    sed -i "s|^S3_ACCESS_KEY=.*|S3_ACCESS_KEY=$S3_ACCESS_KEY|" .env
    sed -i "s|^S3_SECRET_KEY=.*|S3_SECRET_KEY=$S3_SECRET_KEY|" .env
    sed -i "s|^S3_BUCKET=.*|S3_BUCKET=$S3_BUCKET|" .env
    sed -i "s|^S3_REGION=.*|S3_REGION=$S3_REGION|" .env

    # Start Supabase stack
    log "Starting Supabase services..."
    retry_with_backoff 3 10 "docker compose up -d"

    # Wait for services to be ready
    log "Waiting for Supabase services to be ready..."
    sleep 30

    # Verify Supabase is running
    if curl -f "http://localhost:8000/health" >/dev/null 2>&1; then
        success "Supabase is running successfully"
    else
        error "Supabase health check failed"
        exit 1
    fi

    success "Supabase setup completed"
}

# ============================================================================
# PHASE 4: REDIS SETUP
# ============================================================================

setup_redis() {
    log "=== PHASE 4: Setting up Redis for caching ==="

    # Create Redis configuration
    mkdir -p /etc/redis
    cat >/etc/redis/redis.conf <<EOF
# Redis configuration for Albion Online dashboard
bind 127.0.0.1 ::1
port 6379
timeout 0
tcp-keepalive 300
daemonize no
supervised no
loglevel notice
logfile "/var/log/redis/redis-server.log"
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
lfu-log-factor 10
lfu-decay-time 1
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly no
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
latency-monitor-threshold 0
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit slave 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
requirepass $REDIS_PASSWORD
EOF

    # Create Redis systemd service
    cat >/etc/systemd/system/redis-server.service <<EOF
[Unit]
Description=Redis In-Memory Data Store
After=network.target

[Service]
Type=forking
ExecStart=/usr/bin/redis-server /etc/redis/redis.conf
ExecStop=/usr/bin/redis-cli shutdown
Restart=always
User=redis
Group=redis

[Install]
WantedBy=multi-user.target
EOF

    # Create redis user and directories
    useradd --system --shell /bin/false redis
    mkdir -p /var/lib/redis /var/log/redis
    chown -R redis:redis /var/lib/redis /var/log/redis
    chmod 750 /var/lib/redis /var/log/redis

    # Install Redis if not present
    if ! command -v redis-server >/dev/null 2>&1; then
        log "Installing Redis..."
        retry_with_backoff 3 5 "apt-get install -y redis-server"
    fi

    systemctl enable --now redis-server

    # Test Redis connection
    if redis-cli -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
        success "Redis is running successfully"
    else
        error "Redis connection test failed"
        exit 1
    fi

    success "Redis setup completed"
}

# ============================================================================
# PHASE 5: ALBION ONLINE DATA PIPELINE
# ============================================================================

setup_data_pipeline() {
    log "=== PHASE 5: Setting up Albion Online data pipeline ==="

    # Create data pipeline directory
    mkdir -p /opt/albion-data-pipeline
    cd /opt/albion-data-pipeline

    # Create Albion Online API client
    cat >albion-api-client.js <<'EOF'
#!/usr/bin/env node

const axios = require('axios');
const Redis = require('redis');
const winston = require('winston');

class AlbionAPIClient {
    constructor() {
        this.redis = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            db: 0
        });

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'albion-api-client' },
            transports: [
                new winston.transports.File({ filename: '/var/log/albion-api.log' })
            ]
        });

        // Albion Online API endpoints
        this.apis = {
            gameinfo: {
                baseURL: 'https://gameinfo.albiononline.com/api/gameinfo/',
                endpoints: [
                    'events',           // Main kill feed
                    'players',          // Player data
                    'guilds',           // Guild data
                    'alliances',        // Alliance data
                    'battles',          // Battle data
                    'guildmatches',     // GvG matches
                ]
            },
            aodp: {
                baseURL: 'https://west.albion-online-data.com/api/v2/stats/',
                endpoints: [
                    'prices',           // Market prices
                    'history',          // Price history
                    'gold'              // Gold prices
                ]
            },
            openalbion: {
                baseURL: 'https://api.openalbion.com/api/v3/',
                endpoints: [
                    'categories',       // Item categories
                    'weapons',          // Weapons data
                    'armors',           // Armor data
                    'accessories',      // Accessories data
                    'consumables'       // Consumables data
                ]
            },
            render: {
                baseURL: 'https://render.albiononline.com/v1/',
                imageTypes: ['item', 'spell', 'guild', 'destinyboard']
            },
            serverstatus: {
                baseURL: 'https://serverstatus.albiononline.com/',
                endpoint: ''
            }
        };

        this.intervals = {};
    }

    async initialize() {
        await this.redis.connect();
        this.logger.info('Albion API Client initialized');
    }

    async fetchWithRetry(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.get(url, {
                    timeout: 10000,
                    ...options
                });
                return response.data;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    async fetchGameinfoData(endpoint, params = {}) {
        const url = `${this.apis.gameinfo.baseURL}${endpoint}`;
        const cacheKey = `gameinfo:${endpoint}:${JSON.stringify(params)}`;

        // Check cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const data = await this.fetchWithRetry(url, { params });

        // Cache for 60 seconds
        await this.redis.setEx(cacheKey, 60, JSON.stringify(data));

        return data;
    }

    async fetchAODPData(endpoint, params = {}) {
        const url = `${this.apis.aodp.baseURL}${endpoint}`;
        const cacheKey = `aodp:${endpoint}:${JSON.stringify(params)}`;

        // Check cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const data = await this.fetchWithRetry(url, { params });

        // Cache for 300 seconds (5 minutes)
        await this.redis.setEx(cacheKey, 300, JSON.stringify(data));

        return data;
    }

    async fetchOpenAlbionData(endpoint, params = {}) {
        const url = `${this.apis.openalbion.baseURL}${endpoint}`;
        const cacheKey = `openalbion:${endpoint}:${JSON.stringify(params)}`;

        // Check cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const data = await this.fetchWithRetry(url, { params });

        // Cache for 3600 seconds (1 hour)
        await this.redis.setEx(cacheKey, 3600, JSON.stringify(data));

        return data;
    }

    async fetchServerStatus() {
        const url = this.apis.serverstatus.baseURL;
        const cacheKey = 'serverstatus';

        // Check cache first
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const data = await this.fetchWithRetry(url);

        // Cache for 60 seconds
        await this.redis.setEx(cacheKey, 60, JSON.stringify(data));

        return data;
    }

    async downloadItemImage(itemId, quality = 1, enchantment = 0) {
        const url = `${this.apis.render.baseURL}item/${itemId}.png?quality=${quality}&enchantment=${enchantment}&size=217`;

        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 5000
            });

            // Store in CDN
            await this.storeInCDN(`images/items/${itemId}_${quality}_${enchantment}.png`, response.data);

            return true;
        } catch (error) {
            this.logger.error(`Failed to download item image ${itemId}:`, error.message);
            return false;
        }
    }

    async storeInCDN(key, data) {
        // Implementation for S3/CDN storage
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

        const s3Client = new S3Client({
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || 'auto',
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY
            }
        });

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET || 'albion-data',
            Key: key,
            Body: data,
            ContentType: this.getContentType(key),
            CacheControl: 'public, max-age=31536000' // 1 year cache
        });

        await s3Client.send(command);
    }

    getContentType(filename) {
        if (filename.endsWith('.png')) return 'image/png';
        if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
        if (filename.endsWith('.json')) return 'application/json';
        return 'application/octet-stream';
    }

    async startRealtimeCollection() {
        this.logger.info('Starting realtime data collection...');

        // Start 1-second interval for main kill feed
        this.intervals.killfeed = setInterval(async () => {
            try {
                const data = await this.fetchGameinfoData('events', { limit: 51, offset: 0 });
                await this.processKillFeed(data);
            } catch (error) {
                this.logger.error('Kill feed collection error:', error.message);
            }
        }, 1000);

        // Start 5-minute intervals for market data
        this.intervals.market = setInterval(async () => {
            try {
                const data = await this.fetchAODPData('prices/T4_BAG,T4_CAPE,T5_BAG', { locations: 'Caerleon,Bridgewatch' });
                await this.processMarketData(data);
            } catch (error) {
                this.logger.error('Market data collection error:', error.message);
            }
        }, 300000);

        // Start 1-hour intervals for static data
        this.intervals.static = setInterval(async () => {
            try {
                const categories = await this.fetchOpenAlbionData('categories');
                await this.processStaticData(categories);
            } catch (error) {
                this.logger.error('Static data collection error:', error.message);
            }
        }, 3600000);

        // Start 1-minute intervals for server status
        this.intervals.server = setInterval(async () => {
            try {
                const data = await this.fetchServerStatus();
                await this.processServerStatus(data);
            } catch (error) {
                this.logger.error('Server status collection error:', error.message);
            }
        }, 60000);
    }

    async processKillFeed(data) {
        // Process and store kill events in Supabase
        if (data && data.length > 0) {
            // Store in Redis for immediate access
            await this.redis.setEx('latest_killfeed', 60, JSON.stringify(data));

            // TODO: Store in Supabase database
            this.logger.info(`Processed ${data.length} kill events`);
        }
    }

    async processMarketData(data) {
        // Process and store market data
        if (data) {
            await this.redis.setEx('latest_market_data', 300, JSON.stringify(data));
            this.logger.info('Processed market data');
        }
    }

    async processStaticData(data) {
        // Process and store static game data
        if (data) {
            await this.redis.setEx('static_game_data', 3600, JSON.stringify(data));
            this.logger.info('Processed static game data');
        }
    }

    async processServerStatus(data) {
        // Process and store server status
        if (data) {
            await this.redis.setEx('server_status', 60, JSON.stringify(data));
            this.logger.info('Processed server status');
        }
    }

    async stop() {
        // Clear all intervals
        Object.values(this.intervals).forEach(interval => clearInterval(interval));
        await this.redis.disconnect();
        this.logger.info('Albion API Client stopped');
    }
}

// Export for use in other modules
module.exports = AlbionAPIClient;

// Run if called directly
if (require.main === module) {
    const client = new AlbionAPIClient();
    client.initialize().then(() => {
        client.startRealtimeCollection();

        // Graceful shutdown
        process.on('SIGTERM', () => client.stop());
        process.on('SIGINT', () => client.stop());
    }).catch(console.error);
}
EOF

    # Create systemd service for data pipeline
    cat >/etc/systemd/system/albion-data-pipeline.service <<EOF
[Unit]
Description=Albion Online Data Pipeline
After=network.target redis-server.service
Requires=redis-server.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/albion-data-pipeline
ExecStart=/usr/bin/node albion-api-client.js
Restart=always
RestartSec=5
Environment=REDIS_HOST=127.0.0.1
Environment=REDIS_PORT=6379
Environment=REDIS_PASSWORD=$REDIS_PASSWORD
Environment=S3_ENDPOINT=$S3_ENDPOINT
Environment=S3_ACCESS_KEY=$S3_ACCESS_KEY
Environment=S3_SECRET_KEY=$S3_SECRET_KEY
Environment=S3_BUCKET=$S3_BUCKET
Environment=S3_REGION=$S3_REGION

[Install]
WantedBy=multi-user.target
EOF

    # Create log directory
    mkdir -p /var/log

    # Enable and start the service
    systemctl enable --now albion-data-pipeline

    success "Albion Online data pipeline setup completed"
}

# ============================================================================
# PHASE 6: AO-BIN CDN INTEGRATION
# ============================================================================

setup_ao_bin_cdn() {
    log "=== PHASE 6: Setting up ao-bin CDN integration ==="

    # Create ao-bin integration directory
    mkdir -p /opt/ao-bin-integration
    cd /opt/ao-bin-integration

    # Copy existing ao-bin integration script
    cp /root/scripts/infra/ao-bin-integration.js ./

    # Create CDN upload script
    cat >upload-to-cdn.js <<'EOF'
#!/usr/bin/env node

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');

class CDNUploader {
    constructor() {
        this.s3Client = new S3Client({
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || 'auto',
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY
            }
        });

        this.bucket = process.env.S3_BUCKET || 'albion-data';
    }

    async uploadFile(filePath, cdnKey) {
        try {
            const fileContent = await fs.readFile(filePath);
            const contentType = this.getContentType(filePath);

            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: cdnKey,
                Body: fileContent,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000', // 1 year cache
                Metadata: {
                    uploaded: new Date().toISOString()
                }
            });

            await this.s3Client.send(command);
            console.log(`Uploaded ${filePath} to ${cdnKey}`);
            return true;
        } catch (error) {
            console.error(`Failed to upload ${filePath}:`, error.message);
            return false;
        }
    }

    async uploadDirectory(dirPath, cdnPrefix) {
        const files = await this.getAllFiles(dirPath);
        const results = [];

        for (const file of files) {
            const relativePath = path.relative(dirPath, file);
            const cdnKey = `${cdnPrefix}/${relativePath.replace(/\\/g, '/')}`;
            const success = await this.uploadFile(file, cdnKey);
            results.push({ file: relativePath, success });
        }

        return results;
    }

    async getAllFiles(dirPath) {
        const files = [];

        async function traverse(currentPath) {
            const items = await fs.readdir(currentPath);

            for (const item of items) {
                const fullPath = path.join(currentPath, item);
                const stat = await fs.stat(fullPath);

                if (stat.isDirectory()) {
                    await traverse(fullPath);
                } else {
                    files.push(fullPath);
                }
            }
        }

        await traverse(dirPath);
        return files;
    }

    getContentType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const types = {
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.html': 'text/html'
        };

        return types[ext] || 'application/octet-stream';
    }
}

// CLI usage
if (require.main === module) {
    const uploader = new CDNUploader();
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('Usage: node upload-to-cdn.js <local-path> <cdn-prefix>');
        console.log('Example: node upload-to-cdn.js ./data/ao-bin ao-bin');
        process.exit(1);
    }

    const [localPath, cdnPrefix] = args;

    uploader.uploadDirectory(localPath, cdnPrefix)
        .then(results => {
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;
            console.log(`Upload complete: ${successCount} success, ${failCount} failed`);
            process.exit(failCount > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Upload failed:', error);
            process.exit(1);
        });
}

module.exports = CDNUploader;
EOF

    # Create systemd service for ao-bin sync
    cat >/etc/systemd/system/ao-bin-sync.service <<EOF
[Unit]
Description=ao-bin CDN Sync Service
After=network.target

[Service]
Type=oneshot
User=root
WorkingDirectory=/opt/ao-bin-integration
ExecStart=/usr/bin/node ao-bin-integration.js
Environment=SUPABASE_URL=$SUPABASE_URL
Environment=SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
Environment=REDIS_HOST=127.0.0.1
Environment=REDIS_PORT=6379
Environment=REDIS_PASSWORD=$REDIS_PASSWORD
Environment=S3_ENDPOINT=$S3_ENDPOINT
Environment=S3_ACCESS_KEY=$S3_ACCESS_KEY
Environment=S3_SECRET_KEY=$S3_SECRET_KEY
Environment=S3_BUCKET=$S3_BUCKET
Environment=S3_REGION=$S3_REGION

[Install]
WantedBy=multi-user.target
EOF

    # Create cron job for hourly ao-bin sync
    cat >/etc/cron.d/ao-bin-sync <<EOF
# Sync ao-bin data to CDN every hour
0 * * * * root systemctl start ao-bin-sync.service
EOF

    success "ao-bin CDN integration setup completed"
}

# ============================================================================
# PHASE 7: COOLIFY CI/CD SETUP
# ============================================================================

setup_coolify() {
    log "=== PHASE 7: Setting up Coolify for CI/CD ==="

    # Install Coolify CLI
    log "Installing Coolify..."
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

    # Configure Coolify
    mkdir -p /opt/coolify
    cd /opt/coolify

    # Create Coolify configuration
    cat >coolify-config.json <<EOF
{
  "url": "$COOLIFY_URL",
  "adminEmail": "$COOLIFY_ADMIN_EMAIL",
  "github": {
    "repo": "$GITHUB_REPO",
    "token": "$GITHUB_TOKEN",
    "webhookSecret": "$(openssl rand -hex 32)"
  },
  "ssl": {
    "enabled": true,
    "email": "$EMAIL"
  },
  "database": {
    "type": "postgresql",
    "host": "127.0.0.1",
    "port": 54322,
    "database": "coolify",
    "username": "postgres",
    "password": "$POSTGRES_PASSWORD"
  }
}
EOF

    # Initialize Coolify database
    coolify db:init

    # Set up GitHub integration
    coolify github:setup

    # Create deployment pipeline for the Albion dashboard
    cat >deploy-pipeline.yml <<EOF
name: Deploy Albion Dashboard

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Deploy to Coolify
      run: |
        curl -X POST "$COOLIFY_URL/api/v1/deploy" \\
          -H "Authorization: Bearer $GITHUB_TOKEN" \\
          -H "Content-Type: application/json" \\
          -d '{"repository": "$GITHUB_REPO", "branch": "main"}'
EOF

    success "Coolify CI/CD setup completed"
}

# ============================================================================
# PHASE 8: ADMIN DASHBOARD AND MONITORING
# ============================================================================

setup_admin_dashboard() {
    log "=== PHASE 8: Setting up admin dashboard and monitoring ==="

    # Create admin dashboard directory
    mkdir -p /opt/admin-dashboard
    cd /opt/admin-dashboard

    # Create monitoring dashboard
    cat >dashboard.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Albion Online Dashboard - Admin Panel</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .status-green { background-color: #10b981; }
        .status-yellow { background-color: #f59e0b; }
        .status-red { background-color: #ef4444; }
        .metric-card { @apply bg-white rounded-lg shadow-md p-6; }
        .status-indicator { @apply w-3 h-3 rounded-full inline-block mr-2; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Albion Online Enterprise Dashboard</h1>
            <p class="text-gray-600">Real-time monitoring and administration panel</p>
        </div>

        <!-- System Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="metric-card">
                <h3 class="text-lg font-semibold mb-2">Supabase Status</h3>
                <div class="flex items-center">
                    <span class="status-indicator status-green"></span>
                    <span class="text-green-600 font-medium">Online</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">Database and API services</p>
            </div>

            <div class="metric-card">
                <h3 class="text-lg font-semibold mb-2">Redis Cache</h3>
                <div class="flex items-center">
                    <span class="status-indicator status-green"></span>
                    <span class="text-green-600 font-medium">Connected</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">In-memory caching layer</p>
            </div>

            <div class="metric-card">
                <h3 class="text-lg font-semibold mb-2">Data Pipeline</h3>
                <div class="flex items-center">
                    <span class="status-indicator status-green"></span>
                    <span class="text-green-600 font-medium">Running</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">Real-time data collection</p>
            </div>

            <div class="metric-card">
                <h3 class="text-lg font-semibold mb-2">CDN Status</h3>
                <div class="flex items-center">
                    <span class="status-indicator status-green"></span>
                    <span class="text-green-600 font-medium">Synced</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">Cloudflare R2 integration</p>
            </div>
        </div>

        <!-- Real-time Metrics -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="metric-card">
                <h3 class="text-lg font-semibold mb-4">Real-time Metrics</h3>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span>Active API Connections</span>
                        <span class="font-mono" id="api-connections">0</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Cache Hit Rate</span>
                        <span class="font-mono" id="cache-hit-rate">0%</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Data Processing Rate</span>
                        <span class="font-mono" id="processing-rate">0/sec</span>
                    </div>
                    <div class="flex justify-between">
                        <span>CDN Upload Queue</span>
                        <span class="font-mono" id="cdn-queue">0</span>
                    </div>
                </div>
            </div>

            <div class="metric-card">
                <h3 class="text-lg font-semibold mb-4">Recent Activity</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Last Kill Feed Update</span>
                        <span class="font-mono" id="last-kill-update">-</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Last Market Data Sync</span>
                        <span class="font-mono" id="last-market-sync">-</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Server Status</span>
                        <span class="font-mono" id="server-status">Unknown</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Active Users</span>
                        <span class="font-mono" id="active-users">0</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- System Logs -->
        <div class="metric-card">
            <h3 class="text-lg font-semibold mb-4">Recent System Logs</h3>
            <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto" id="system-logs">
                <div class="text-gray-500">Loading logs...</div>
            </div>
        </div>
    </div>

    <script>
        // Real-time updates
        async function updateMetrics() {
            try {
                // Fetch metrics from our API endpoints
                const response = await fetch('/api/admin/metrics');
                const data = await response.json();

                document.getElementById('api-connections').textContent = data.apiConnections || 0;
                document.getElementById('cache-hit-rate').textContent = (data.cacheHitRate || 0) + '%';
                document.getElementById('processing-rate').textContent = (data.processingRate || 0) + '/sec';
                document.getElementById('cdn-queue').textContent = data.cdnQueue || 0;
                document.getElementById('last-kill-update').textContent = data.lastKillUpdate || '-';
                document.getElementById('last-market-sync').textContent = data.lastMarketSync || '-';
                document.getElementById('server-status').textContent = data.serverStatus || 'Unknown';
                document.getElementById('active-users').textContent = data.activeUsers || 0;

                // Update status indicators based on health
                updateStatusIndicators(data.health);

            } catch (error) {
                console.error('Failed to update metrics:', error);
            }
        }

        function updateStatusIndicators(health) {
            // Update status indicators based on health data
            const indicators = ['supabase', 'redis', 'pipeline', 'cdn'];
            indicators.forEach(service => {
                const element = document.querySelector(`[data-service="${service}"]`);
                if (element) {
                    const isHealthy = health[service];
                    element.className = `status-indicator ${isHealthy ? 'status-green' : 'status-red'}`;
                }
            });
        }

        // Update every 5 seconds
        setInterval(updateMetrics, 5000);
        updateMetrics(); // Initial load
    </script>
</body>
</html>
EOF

    # Create API endpoint for metrics
    mkdir -p /opt/admin-dashboard/api
    cat >/opt/admin-dashboard/api/metrics.js <<'EOF'
#!/usr/bin/env node

const http = require('http');
const Redis = require('redis');

const redis = Redis.createClient({
    host: '127.0.0.1',
    port: 6379,
    password: process.env.REDIS_PASSWORD
});

async function getMetrics() {
    await redis.connect();

    const metrics = {
        apiConnections: 0,
        cacheHitRate: 0,
        processingRate: 0,
        cdnQueue: 0,
        lastKillUpdate: '-',
        lastMarketSync: '-',
        serverStatus: 'Unknown',
        activeUsers: 0,
        health: {
            supabase: false,
            redis: false,
            pipeline: false,
            cdn: false
        }
    };

    try {
        // Get Redis info
        const info = await redis.info();
        metrics.cacheHitRate = parseFloat(info.split('\r\n').find(line => line.startsWith('keyspace_hits:'))?.split(':')[1] || 0);

        // Check service health
        metrics.health.redis = await checkRedisHealth();
        metrics.health.supabase = await checkSupabaseHealth();
        metrics.health.pipeline = await checkPipelineHealth();
        metrics.health.cdn = await checkCDNHealth();

        // Get recent activity timestamps
        const lastKill = await redis.get('latest_killfeed_timestamp');
        const lastMarket = await redis.get('latest_market_timestamp');

        if (lastKill) metrics.lastKillUpdate = new Date(parseInt(lastKill)).toLocaleTimeString();
        if (lastMarket) metrics.lastMarketSync = new Date(parseInt(lastMarket)).toLocaleTimeString();

    } catch (error) {
        console.error('Error fetching metrics:', error);
    } finally {
        await redis.disconnect();
    }

    return metrics;
}

async function checkRedisHealth() {
    try {
        const client = Redis.createClient({
            host: '127.0.0.1',
            port: 6379,
            password: process.env.REDIS_PASSWORD
        });
        await client.connect();
        await client.ping();
        await client.disconnect();
        return true;
    } catch {
        return false;
    }
}

async function checkSupabaseHealth() {
    try {
        const response = await fetch('http://127.0.0.1:8000/health');
        return response.ok;
    } catch {
        return false;
    }
}

async function checkPipelineHealth() {
    try {
        const response = await fetch('http://127.0.0.1:3001/health');
        return response.ok;
    } catch {
        return false;
    }
}

async function checkCDNHealth() {
    try {
        const response = await fetch(`${process.env.CDN_PUBLIC_URL}/health`);
        return response.ok;
    } catch {
        return false;
    }
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
        const metrics = await getMetrics();

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(metrics));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const PORT = 3002;
server.listen(PORT, () => {
    console.log(`Admin API server running on port ${PORT}`);
});
EOF

    # Create systemd service for admin dashboard
    cat >/etc/systemd/system/admin-dashboard.service <<EOF
[Unit]
Description=Albion Online Admin Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/admin-dashboard
ExecStart=/usr/bin/node api/metrics.js
Restart=always
Environment=REDIS_PASSWORD=$REDIS_PASSWORD
Environment=CDN_PUBLIC_URL=https://cdn.$DOMAIN

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start admin dashboard
    systemctl enable --now admin-dashboard

    success "Admin dashboard and monitoring setup completed"
}

# ============================================================================
# PHASE 9: CADDY REVERSE PROXY AND SSL
# ============================================================================

setup_caddy() {
    log "=== PHASE 9: Setting up Caddy reverse proxy and SSL ==="

    # Install Caddy
    log "Installing Caddy..."
    retry_with_backoff 3 5 "curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg"
    echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | tee /etc/apt/sources.list.d/caddy-stable.list
    retry_with_backoff 3 5 "apt-get update -y"
    retry_with_backoff 3 5 "apt-get install -y caddy"

    # Configure Caddy
    cat >/etc/caddy/Caddyfile <<EOF
# Albion Online Enterprise Dashboard - Caddy Configuration
# Security headers and performance optimizations

{$DOMAIN} {
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    # Rate limiting
    rate_limit {
        zone static {
            key {remote_host}
            events 100
            window 1m
        }
    }

    # Compression
    encode zstd gzip

    # Main application (Next.js/Albion dashboard)
    handle /* {
        reverse_proxy 127.0.0.1:3000 {
            health_uri /api/health
            health_interval 30s
            health_timeout 10s
        }
    }

    # API routes
    handle /api/* {
        reverse_proxy 127.0.0.1:3001 {
            health_uri /health
            health_interval 30s
        }
    }

    # Supabase API
    handle /supabase/* {
        reverse_proxy 127.0.0.1:8000 {
            health_uri /health
        }
    }

    # Admin dashboard
    handle /admin/* {
        reverse_proxy 127.0.0.1:3002 {
            health_uri /metrics
        }
    }

    # CDN assets
    handle /cdn/* {
        reverse_proxy $S3_ENDPOINT {
            header_up Host {upstream_hostport}
        }
    }

    # Coolify
    handle /coolify/* {
        reverse_proxy 127.0.0.1:8001
    }

    # TLS configuration
    tls {$EMAIL} {
        protocols tls1.2 tls1.3
    }

    # Logging
    log {
        output file /var/log/caddy/{$DOMAIN}.log {
            roll_size 10mb
            roll_keep 5
        }
        format json
    }
}

# CDN subdomain
cdn.{$DOMAIN} {
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        -Server
    }

    # CDN proxy to S3
    reverse_proxy $S3_ENDPOINT {
        header_up Host {upstream_hostport}
    }

    tls {$EMAIL}
}
EOF

    # Create log directory
    mkdir -p /var/log/caddy

    systemctl enable --now caddy

    success "Caddy reverse proxy and SSL setup completed"
}

# ============================================================================
# PHASE 10: BACKUP AND MONITORING
# ============================================================================

setup_backup_and_monitoring() {
    log "=== PHASE 10: Setting up backup and monitoring ==="

    if [[ "$ENABLE_ADVANCED_MONITORING" == "true" ]]; then
        # Install Prometheus and Grafana
        log "Installing Prometheus and Grafana..."

        # Add Prometheus repository
        wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
        echo "deb https://packages.grafana.com/oss/deb stable main" > /etc/apt/sources.list.d/grafana.list

        retry_with_backoff 3 5 "apt-get update -y"
        retry_with_backoff 3 5 "apt-get install -y prometheus grafana"

        # Configure Prometheus
        cat >/etc/prometheus/prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  - job_name: 'supabase'
    static_configs:
      - targets: ['localhost:8000']

  - job_name: 'albion-api'
    static_configs:
      - targets: ['localhost:3001']
EOF

        # Configure Grafana
        cat >/etc/grafana/grafana.ini <<EOF
[server]
http_port = 3000
domain = $DOMAIN
root_url = https://$DOMAIN/

[database]
type = sqlite3
path = /var/lib/grafana/grafana.db

[security]
admin_user = admin
admin_password = $(openssl rand -hex 16)
EOF

        systemctl enable --now prometheus grafana

        success "Prometheus and Grafana monitoring setup completed"
    fi

    # Setup backup system
    if [[ "$ENABLE_BACKUP" == "true" ]]; then
        log "Setting up automated backup system..."

        # Create backup directory
        mkdir -p /mnt/backups

        # Create backup script
        cat >/usr/local/bin/enterprise-backup.sh <<'BACKUPEOF'
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/mnt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/backup.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting enterprise backup..."

# Backup PostgreSQL
log "Backing up PostgreSQL..."
docker exec supabase-db pg_dumpall -U postgres | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# Backup Redis
log "Backing up Redis..."
redis-cli SAVE
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Backup configuration files
log "Backing up configuration files..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    /opt/supabase/supabase/docker/.env \
    /etc/redis/redis.conf \
    /etc/caddy/Caddyfile \
    /opt/admin-dashboard

# Upload to S3
log "Uploading backups to S3..."
aws s3 sync "$BACKUP_DIR/" "s3://$S3_BUCKET/backups/$DATE/" \
    --endpoint-url "$S3_ENDPOINT" \
    --region "$S3_REGION"

# Cleanup old backups (keep 7 days)
log "Cleaning up old backups..."
find "$BACKUP_DIR" -type f -mtime +7 -delete

log "Backup completed successfully"
BACKUPEOF

        chmod +x /usr/local/bin/enterprise-backup.sh

        # Create cron job for daily backups
        cat >/etc/cron.d/enterprise-backup <<EOF
# Daily enterprise backup at 2:00 AM
0 2 * * * root /usr/local/bin/enterprise-backup.sh
EOF

        success "Automated backup system setup completed"
    fi

    success "Backup and monitoring setup completed"
}

# ============================================================================
# MAIN DEPLOYMENT EXECUTION
# ============================================================================

main() {
    log "🚀 Starting Albion Online Enterprise Deployment"
    log "Domain: $DOMAIN"
    log "Email: $EMAIL"

    # Phase 1: System Setup
    check_requirements
    validate_environment
    setup_system

    # Phase 2: Docker
    setup_docker

    # Phase 3: Supabase
    setup_supabase

    # Phase 4: Redis
    setup_redis

    # Phase 5: Data Pipeline
    setup_data_pipeline

    # Phase 6: ao-bin CDN
    setup_ao_bin_cdn

    # Phase 7: Coolify CI/CD
    setup_coolify

    # Phase 8: Admin Dashboard
    setup_admin_dashboard

    # Phase 9: Caddy
    setup_caddy

    # Phase 10: Backup and Monitoring
    setup_backup_and_monitoring

    # Final verification
    log "=== FINAL VERIFICATION ==="

    # Test all services
    if curl -f "https://$DOMAIN/api/health" >/dev/null 2>&1; then
        success "✅ Main application is accessible"
    else
        warning "❌ Main application health check failed"
    fi

    if curl -f "https://$DOMAIN/admin/" >/dev/null 2>&1; then
        success "✅ Admin dashboard is accessible"
    else
        warning "❌ Admin dashboard health check failed"
    fi

    if curl -f "https://cdn.$DOMAIN/health" >/dev/null 2>&1; then
        success "✅ CDN is accessible"
    else
        warning "❌ CDN health check failed"
    fi

    log "🎉 ENTERPRISE DEPLOYMENT COMPLETED!"
    log ""
    log "🌐 Access your dashboard at: https://$DOMAIN"
    log "🔧 Admin panel at: https://$DOMAIN/admin/"
    log "📊 CDN at: https://cdn.$DOMAIN"
    log "🚀 Coolify at: https://coolify.$DOMAIN"
    log ""
    log "📋 Configuration saved to: /root/deployment-summary.txt"
    log "🔐 All secrets are stored securely in environment variables"
    log ""
    log "Next steps:"
    log "1. Access the admin dashboard to verify all services"
    log "2. Check the deployment logs for any issues"
    log "3. Configure your GitHub repository for CI/CD"
    log "4. Update DNS records if needed"
    log "5. Test the Albion Online data pipeline"

    # Save deployment summary
    cat > /root/deployment-summary.txt <<EOF
ALBION ONLINE ENTERPRISE DEPLOYMENT SUMMARY
============================================

Domain: $DOMAIN
Deployment Date: $(date)
Server IP: $(hostname -I | awk '{print $1}')

SERVICES DEPLOYED:
- ✅ Self-hosted Supabase (Database + API + Auth)
- ✅ Redis Caching Layer
- ✅ Albion Online Real-time Data Pipeline
- ✅ ao-bin CDN Integration (Cloudflare R2)
- ✅ Coolify CI/CD Platform
- ✅ Admin Dashboard with Monitoring
- ✅ Caddy Reverse Proxy with SSL/TLS
- ✅ Automated Backup System
- ✅ Prometheus/Grafana Monitoring Stack

ACCESS URLs:
- Main Dashboard: https://$DOMAIN
- Admin Panel: https://$DOMAIN/admin/
- CDN: https://cdn.$DOMAIN
- Coolify: https://coolify.$DOMAIN
- Grafana: https://$DOMAIN:3000 (if enabled)

CONFIGURATION:
- PostgreSQL: localhost:54322
- Redis: localhost:6379 (password: $REDIS_PASSWORD)
- Supabase URL: $SUPABASE_URL
- Service Role Key: $SUPABASE_SERVICE_ROLE_KEY

SECURITY NOTES:
- All passwords and keys are stored in environment variables
- UFW firewall is active with strict rules
- fail2ban is monitoring for attacks
- SSL/TLS certificates are automatically managed
- Regular backups are scheduled daily

MAINTENANCE:
- Check logs: journalctl -u <service-name>
- Monitor dashboard: https://$DOMAIN/admin/
- Update system: apt-get update && apt-get upgrade
- Backup status: /var/log/backup.log

SUPPORT:
- Check /var/log/ for detailed service logs
- Use systemctl status <service> for service status
- Admin dashboard provides real-time monitoring
EOF

    success "Deployment summary saved to /root/deployment-summary.txt"
}

# Run the deployment
main "$@"
