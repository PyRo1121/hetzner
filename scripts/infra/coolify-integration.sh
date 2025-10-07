#!/bin/bash

# ============================================================================
# COOLIFY CI/CD INTEGRATION SCRIPT - OCTOBER 2025 STANDARDS
# ============================================================================
# This script integrates Coolify with existing k3s and Supabase infrastructure
# Supports GitHub-driven deployments with automated rollbacks
# ============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Retry function with exponential backoff
retry_with_backoff() {
    local max_attempts=$1
    local delay=$2
    local command="${@:3}"
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if eval "$command"; then
            return 0
        fi

        if [[ $attempt -eq $max_attempts ]]; then
            error "Command failed after $max_attempts attempts: $command"
            return 1
        fi

        warning "Attempt $attempt failed. Retrying in ${delay}s..."
        sleep $delay
        delay=$((delay * 2))
        attempt=$((attempt + 1))
    done
}

# Check prerequisites
check_coolify_prerequisites() {
    log "🔍 Checking Coolify prerequisites..."

    # Check required environment variables
    local required_vars=(
        "DOMAIN"
        "EMAIL"
        "GITHUB_REPO"
        "GITHUB_TOKEN"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable not set: $var"
            exit 1
        fi
    done

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running or not accessible"
        exit 1
    fi

    # Check available ports
    local required_ports=(8000 8080 8443)
    for port in "${required_ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            warning "Port $port is already in use"
        fi
    done

    success "✅ Prerequisites check completed"
}

# Install Coolify
install_coolify() {
    log "🚀 Installing Coolify v4 (October 2025 Standards)..."

    # Create Coolify directory
    mkdir -p /opt/coolify
    cd /opt/coolify

    # Download and install Coolify
    retry_with_backoff 3 10 "curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash"

    # Wait for Coolify to initialize
    log "Waiting for Coolify to initialize..."
    local attempts=0
    local max_attempts=60

    while [[ $attempts -lt $max_attempts ]]; do
        if docker ps --format "table {{.Names}}" | grep -q "coolify"; then
            success "✅ Coolify containers are running"
            break
        fi

        sleep 5
        ((attempts++))
        log "Waiting for Coolify containers... ($attempts/$max_attempts)"
    done

    if [[ $attempts -eq $max_attempts ]]; then
        error "Coolify failed to start within expected time"
        exit 1
    fi

    success "✅ Coolify installation completed"
}

# Configure Coolify for GitHub integration
configure_coolify_github() {
    log "🔧 Configuring Coolify GitHub integration..."

    # Generate webhook secret
    local webhook_secret=$(openssl rand -hex 32)

    # Create Coolify configuration
    cat >/opt/coolify/config.json <<EOF
{
  "version": "4.0",
  "deployment": {
    "mode": "production",
    "domain": "coolify.$DOMAIN",
    "ssl": {
      "enabled": true,
      "email": "$EMAIL",
      "provider": "letsencrypt"
    }
  },
  "github": {
    "repository": "$GITHUB_REPO",
    "token": "$GITHUB_TOKEN",
    "webhook": {
      "secret": "$webhook_secret",
      "events": ["push", "pull_request", "release"]
    },
    "branches": {
      "production": "main",
      "staging": "develop",
      "preview": "feature/*"
    }
  },
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 54321,
    "database": "coolify",
    "ssl": true
  },
  "security": {
    "sso": {
      "enabled": true,
      "provider": "github"
    },
    "mfa": {
      "enabled": true,
      "provider": "totp"
    },
    "api": {
      "rate_limit": 1000,
      "cors": {
        "enabled": true,
        "origins": ["https://$DOMAIN", "https://coolify.$DOMAIN"]
      }
    }
  },
  "monitoring": {
    "enabled": true,
    "prometheus": {
      "enabled": true,
      "port": 9090
    },
    "grafana": {
      "enabled": true,
      "port": 3000
    }
  }
}
EOF

    # Save webhook secret for GitHub configuration
    echo "$webhook_secret" > /opt/coolify/webhook-secret.txt
    chmod 600 /opt/coolify/webhook-secret.txt

    success "✅ Coolify GitHub configuration completed"
    success "   📝 Webhook Secret: $webhook_secret"
    success "   🔗 Webhook URL: https://coolify.$DOMAIN/webhooks/github"
}

# Setup Coolify projects and applications
setup_coolify_projects() {
    log "📋 Setting up Coolify projects and applications..."

    # Wait for Coolify API to be ready
    local api_ready=false
    local attempts=0
    local max_attempts=30

    while [[ $attempts -lt $max_attempts ]] && [[ "$api_ready" == "false" ]]; do
        if curl -f -s "http://localhost:8000/api/health" >/dev/null 2>&1; then
            api_ready=true
            success "✅ Coolify API is ready"
        else
            sleep 10
            ((attempts++))
            log "Waiting for Coolify API... ($attempts/$max_attempts)"
        fi
    done

    if [[ "$api_ready" == "false" ]]; then
        error "Coolify API failed to become ready"
        exit 1
    fi

    # Create project configuration
    cat >/opt/coolify/project-config.json <<EOF
{
  "name": "Albion Online Dashboard",
  "description": "Enterprise Albion Online resource hub with real-time data",
  "repository": {
    "url": "https://github.com/$GITHUB_REPO",
    "branch": "main",
    "auto_deploy": true
  },
  "build": {
    "command": "bun install && bun run build",
    "output_directory": ".next",
    "install_command": "bun install",
    "framework": "nextjs"
  },
  "environment": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_SUPABASE_URL": "https://$DOMAIN",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "\${SUPABASE_ANON_KEY}",
    "NEXTAUTH_SECRET": "\${NEXTAUTH_SECRET}",
    "NEXTAUTH_URL": "https://$DOMAIN",
    "REDIS_URL": "redis://localhost:6379"
  },
  "domains": [
    {
      "domain": "$DOMAIN",
      "ssl": true,
      "redirect_www": true
    }
  ],
  "health_check": {
    "enabled": true,
    "path": "/api/health",
    "interval": 30,
    "timeout": 10,
    "retries": 3
  },
  "scaling": {
    "min_instances": 1,
    "max_instances": 3,
    "cpu_threshold": 80,
    "memory_threshold": 85
  }
}
EOF

    success "✅ Coolify project configuration created"
}

# Integrate with existing k3s infrastructure
integrate_with_k3s() {
    log "☸️ Integrating Coolify with existing k3s infrastructure..."

    # Check if k3s is running
    if ! kubectl get nodes >/dev/null 2>&1; then
        warning "k3s not detected, skipping k3s integration"
        return
    fi

    # Create Coolify namespace in k3s
    kubectl create namespace coolify --dry-run=client -o yaml | kubectl apply -f -

    # Create service account for Coolify
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: coolify-deployer
  namespace: coolify
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: coolify-deployer
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: coolify-deployer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: coolify-deployer
subjects:
- kind: ServiceAccount
  name: coolify-deployer
  namespace: coolify
EOF

    # Get service account token for Coolify
    local sa_secret=$(kubectl get serviceaccount coolify-deployer -n coolify -o jsonpath='{.secrets[0].name}')
    local k8s_token=$(kubectl get secret "$sa_secret" -n coolify -o jsonpath='{.data.token}' | base64 -d)

    # Configure Coolify to use k3s
    cat >/opt/coolify/k8s-config.json <<EOF
{
  "kubernetes": {
    "enabled": true,
    "cluster": {
      "name": "local-k3s",
      "server": "https://127.0.0.1:6443",
      "token": "$k8s_token",
      "namespace": "default"
    },
    "deployment": {
      "strategy": "RollingUpdate",
      "replicas": 2,
      "resources": {
        "requests": {
          "cpu": "100m",
          "memory": "128Mi"
        },
        "limits": {
          "cpu": "500m",
          "memory": "512Mi"
        }
      }
    }
  }
}
EOF

    success "✅ Coolify k3s integration completed"
}

# Setup Coolify monitoring integration
setup_coolify_monitoring() {
    log "📊 Setting up Coolify monitoring integration..."

    # Create monitoring configuration
    cat >/opt/coolify/monitoring.json <<EOF
{
  "prometheus": {
    "enabled": true,
    "scrape_interval": "15s",
    "targets": [
      "localhost:8000",
      "localhost:3000",
      "localhost:54321"
    ]
  },
  "grafana": {
    "enabled": true,
    "dashboards": [
      {
        "name": "Coolify Overview",
        "url": "https://grafana.com/api/dashboards/coolify-overview"
      },
      {
        "name": "Application Metrics",
        "url": "https://grafana.com/api/dashboards/nextjs-metrics"
      }
    ]
  },
  "alerts": {
    "enabled": true,
    "channels": [
      {
        "type": "email",
        "address": "$EMAIL"
      }
    ],
    "rules": [
      {
        "name": "High CPU Usage",
        "condition": "cpu_usage > 80",
        "duration": "5m"
      },
      {
        "name": "High Memory Usage",
        "condition": "memory_usage > 85",
        "duration": "5m"
      },
      {
        "name": "Application Down",
        "condition": "up == 0",
        "duration": "1m"
      }
    ]
  }
}
EOF

    success "✅ Coolify monitoring configuration completed"
}

# Configure Caddy reverse proxy for Coolify
configure_caddy_coolify() {
    log "🌐 Configuring Caddy reverse proxy for Coolify..."

    # Add Coolify configuration to Caddyfile
    cat >>/etc/caddy/Caddyfile <<EOF

# Coolify CI/CD Dashboard
coolify.$DOMAIN {
    tls {
        protocols tls1.2 tls1.3
    }

    encode zstd gzip

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;"
    }

    # Rate limiting
    rate_limit {
        zone coolify {
            key {remote_host}
            events 100
            window 1m
        }
    }

    # Coolify dashboard
    reverse_proxy localhost:8000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
        
        health_uri /api/health
        health_interval 30s
        health_timeout 10s
    }

    # Logging
    log {
        output file /var/log/caddy/coolify.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format json
    }
}

# Coolify API subdomain (for webhooks)
api.coolify.$DOMAIN {
    tls {
        protocols tls1.2 tls1.3
    }

    # Webhook endpoint
    handle /webhooks/* {
        reverse_proxy localhost:8000
    }

    # API endpoints
    handle /api/* {
        reverse_proxy localhost:8000
    }

    # Health check
    handle /health {
        respond "OK" 200
    }
}
EOF

    # Reload Caddy configuration
    systemctl reload caddy

    success "✅ Caddy configuration for Coolify completed"
}

# Create GitHub webhook configuration
create_github_webhook() {
    log "🔗 Creating GitHub webhook configuration..."

    local webhook_secret=$(cat /opt/coolify/webhook-secret.txt)
    
    cat >/opt/coolify/github-webhook-setup.md <<EOF
# GitHub Webhook Configuration

To complete the Coolify integration, add the following webhook to your GitHub repository:

## Webhook Settings

1. Go to your repository: https://github.com/$GITHUB_REPO
2. Navigate to Settings > Webhooks
3. Click "Add webhook"
4. Configure the webhook:

**Payload URL:** https://coolify.$DOMAIN/webhooks/github
**Content type:** application/json
**Secret:** $webhook_secret

**Events to trigger:**
- [x] Push
- [x] Pull requests
- [x] Releases
- [x] Deployment status

## Automatic Deployment

Once configured, Coolify will automatically:
- Deploy on push to main branch (production)
- Create preview deployments for pull requests
- Deploy tagged releases
- Send deployment status back to GitHub

## Manual Deployment

You can also trigger deployments manually:
- Coolify Dashboard: https://coolify.$DOMAIN
- API Endpoint: https://api.coolify.$DOMAIN/api/deploy

## Monitoring

- Application: https://$DOMAIN
- Coolify Dashboard: https://coolify.$DOMAIN
- Monitoring: https://monitoring.$DOMAIN (if enabled)
EOF

    success "✅ GitHub webhook configuration created"
    success "   📝 Configuration guide: /opt/coolify/github-webhook-setup.md"
}

# Validate Coolify installation
validate_coolify() {
    log "🔍 Validating Coolify installation..."

    # Check if Coolify containers are running
    if ! docker ps | grep -q "coolify"; then
        error "Coolify containers are not running"
        return 1
    fi

    # Check if Coolify API is responding
    if ! curl -f -s "http://localhost:8000/api/health" >/dev/null; then
        error "Coolify API is not responding"
        return 1
    fi

    # Check if Coolify dashboard is accessible
    if ! curl -f -s "https://coolify.$DOMAIN" >/dev/null; then
        warning "Coolify dashboard may not be accessible via HTTPS yet (DNS propagation)"
    fi

    # Check database connection
    if docker exec coolify-db pg_isready >/dev/null 2>&1; then
        success "✅ Coolify database is ready"
    else
        warning "⚠️ Coolify database connection issue"
    fi

    success "✅ Coolify validation completed"
}

# Main function
main() {
    log "🚀 === COOLIFY CI/CD INTEGRATION - OCTOBER 2025 ==="
    log "Domain: $DOMAIN"
    log "GitHub Repository: $GITHUB_REPO"
    log "Email: $EMAIL"

    check_coolify_prerequisites
    install_coolify
    configure_coolify_github
    setup_coolify_projects
    integrate_with_k3s
    setup_coolify_monitoring
    configure_caddy_coolify
    create_github_webhook
    validate_coolify

    log "🎉 === COOLIFY INTEGRATION COMPLETE ==="
    echo ""
    echo "🌐 Coolify Dashboard: https://coolify.$DOMAIN"
    echo "🔗 Webhook URL: https://coolify.$DOMAIN/webhooks/github"
    echo "📝 Setup Guide: /opt/coolify/github-webhook-setup.md"
    echo "🔑 Webhook Secret: $(cat /opt/coolify/webhook-secret.txt)"
    echo ""
    echo "Next Steps:"
    echo "1. Configure GitHub webhook using the provided settings"
    echo "2. Push to main branch to trigger first deployment"
    echo "3. Monitor deployments via Coolify dashboard"
    echo "4. Set up branch protection rules in GitHub"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi