#!/bin/bash

# Environment-specific configurations for Albion Online Dashboard
# This script provides configuration management for dev, staging, and production environments

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Environment detection
detect_environment() {
    local env="${ENVIRONMENT:-}"
    
    if [[ -z "$env" ]]; then
        if [[ "${GITHUB_REF:-}" == "refs/heads/main" ]] || [[ "${GITHUB_REF:-}" == "refs/heads/master" ]]; then
            env="production"
        elif [[ "${GITHUB_REF:-}" == "refs/heads/develop" ]] || [[ "${GITHUB_REF:-}" == "refs/heads/staging" ]]; then
            env="staging"
        else
            env="development"
        fi
    fi
    
    echo "$env"
}

# Development environment configuration
configure_development() {
    log "🔧 Configuring development environment..."
    
    export ENVIRONMENT="development"
    export NODE_ENV="development"
    export DEBUG="true"
    export LOG_LEVEL="debug"
    
    # Database
    export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/albion_dev}"
    export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
    
    # Supabase (local development)
    export SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
    export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
    export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"
    
    # Application
    export NEXTAUTH_URL="http://localhost:3000"
    export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-dev-secret-key-change-in-production}"
    export DOMAIN="localhost"
    export PORT="3000"
    
    # Features
    export ENABLE_ANALYTICS="false"
    export ENABLE_MONITORING="false"
    export ENABLE_COOLIFY="false"
    export ENABLE_SSL="false"
    
    # API Keys (development/mock values)
    export ALBION_API_KEY="${ALBION_API_KEY:-dev-api-key}"
    export GITHUB_TOKEN="${GITHUB_TOKEN:-}"
    
    success "✅ Development environment configured"
}

# Staging environment configuration
configure_staging() {
    log "🔧 Configuring staging environment..."
    
    export ENVIRONMENT="staging"
    export NODE_ENV="production"
    export DEBUG="false"
    export LOG_LEVEL="info"
    
    # Database
    export DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required for staging}"
    export REDIS_URL="${REDIS_URL:?REDIS_URL is required for staging}"
    
    # Supabase
    export SUPABASE_URL="${SUPABASE_URL:?SUPABASE_URL is required for staging}"
    export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required for staging}"
    export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required for staging}"
    
    # Application
    export NEXTAUTH_URL="${NEXTAUTH_URL:?NEXTAUTH_URL is required for staging}"
    export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required for staging}"
    export DOMAIN="${STAGING_DOMAIN:?STAGING_DOMAIN is required for staging}"
    export PORT="3000"
    
    # Features
    export ENABLE_ANALYTICS="true"
    export ENABLE_MONITORING="true"
    export ENABLE_COOLIFY="true"
    export ENABLE_SSL="true"
    
    # API Keys
    export ALBION_API_KEY="${ALBION_API_KEY:?ALBION_API_KEY is required for staging}"
    export GITHUB_TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN is required for staging}"
    
    # Staging-specific settings
    export RATE_LIMIT_REQUESTS="100"
    export RATE_LIMIT_WINDOW="900" # 15 minutes
    export CACHE_TTL="300" # 5 minutes
    
    success "✅ Staging environment configured"
}

# Production environment configuration
configure_production() {
    log "🔧 Configuring production environment..."
    
    export ENVIRONMENT="production"
    export NODE_ENV="production"
    export DEBUG="false"
    export LOG_LEVEL="warn"
    
    # Database
    export DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required for production}"
    export REDIS_URL="${REDIS_URL:?REDIS_URL is required for production}"
    
    # Supabase
    export SUPABASE_URL="${SUPABASE_URL:?SUPABASE_URL is required for production}"
    export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required for production}"
    export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required for production}"
    
    # Application
    export NEXTAUTH_URL="${NEXTAUTH_URL:?NEXTAUTH_URL is required for production}"
    export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required for production}"
    export DOMAIN="${DOMAIN:?DOMAIN is required for production}"
    export PORT="3000"
    
    # Features
    export ENABLE_ANALYTICS="true"
    export ENABLE_MONITORING="true"
    export ENABLE_COOLIFY="true"
    export ENABLE_SSL="true"
    
    # API Keys
    export ALBION_API_KEY="${ALBION_API_KEY:?ALBION_API_KEY is required for production}"
    export GITHUB_TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN is required for production}"
    
    # Production-specific settings
    export RATE_LIMIT_REQUESTS="1000"
    export RATE_LIMIT_WINDOW="3600" # 1 hour
    export CACHE_TTL="1800" # 30 minutes
    
    # Security settings
    export SECURE_COOKIES="true"
    export CSRF_PROTECTION="true"
    export HELMET_ENABLED="true"
    
    success "✅ Production environment configured"
}

# Kubernetes-specific configuration
configure_kubernetes() {
    log "🔧 Configuring Kubernetes-specific settings..."
    
    export DEPLOYMENT_MODE="k8s"
    export K8S_NAMESPACE="${K8S_NAMESPACE:-albion-dashboard}"
    export K8S_CLUSTER_NAME="${K8S_CLUSTER_NAME:-albion-cluster}"
    
    # Resource limits
    export CPU_LIMIT="${CPU_LIMIT:-1000m}"
    export MEMORY_LIMIT="${MEMORY_LIMIT:-2Gi}"
    export CPU_REQUEST="${CPU_REQUEST:-500m}"
    export MEMORY_REQUEST="${MEMORY_REQUEST:-1Gi}"
    
    # Scaling
    export MIN_REPLICAS="${MIN_REPLICAS:-2}"
    export MAX_REPLICAS="${MAX_REPLICAS:-10}"
    export TARGET_CPU_UTILIZATION="${TARGET_CPU_UTILIZATION:-70}"
    
    success "✅ Kubernetes configuration set"
}

# Docker Compose configuration
configure_docker_compose() {
    log "🔧 Configuring Docker Compose settings..."
    
    export DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-enterprise}"
    export COMPOSE_PROJECT_NAME="albion-dashboard"
    export COMPOSE_FILE="docker-compose.yml"
    
    # If staging or production, use override
    if [[ "$ENVIRONMENT" != "development" ]]; then
        export COMPOSE_FILE="docker-compose.yml:docker-compose.override.yml"
    fi
    
    success "✅ Docker Compose configuration set"
}

# Coolify-specific configuration
configure_coolify() {
    if [[ "$ENABLE_COOLIFY" != "true" ]]; then
        return
    fi
    
    log "🔧 Configuring Coolify CI/CD settings..."
    
    export COOLIFY_URL="${COOLIFY_URL:-https://coolify.$DOMAIN}"
    export COOLIFY_TOKEN="${COOLIFY_TOKEN:?COOLIFY_TOKEN is required when Coolify is enabled}"
    export COOLIFY_PROJECT_UUID="${COOLIFY_PROJECT_UUID:-}"
    export COOLIFY_APPLICATION_UUID="${COOLIFY_APPLICATION_UUID:-}"
    
    # GitHub integration
    export GITHUB_REPO="${GITHUB_REPO:?GITHUB_REPO is required for Coolify}"
    export GITHUB_WEBHOOK_SECRET="${GITHUB_WEBHOOK_SECRET:-$(openssl rand -hex 32)}"
    
    success "✅ Coolify configuration set"
}

# Monitoring configuration
configure_monitoring() {
    if [[ "$ENABLE_MONITORING" != "true" ]]; then
        return
    fi
    
    log "🔧 Configuring monitoring settings..."
    
    export PROMETHEUS_URL="${PROMETHEUS_URL:-http://prometheus:9090}"
    export GRAFANA_URL="${GRAFANA_URL:-http://grafana:3001}"
    export GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-$(openssl rand -base64 32)}"
    
    # Alert manager
    export ALERTMANAGER_URL="${ALERTMANAGER_URL:-http://alertmanager:9093}"
    export SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
    export DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
    
    success "✅ Monitoring configuration set"
}

# SSL/TLS configuration
configure_ssl() {
    if [[ "$ENABLE_SSL" != "true" ]]; then
        return
    fi
    
    log "🔧 Configuring SSL/TLS settings..."
    
    export SSL_EMAIL="${EMAIL:?EMAIL is required for SSL certificates}"
    export SSL_PROVIDER="${SSL_PROVIDER:-letsencrypt}"
    export SSL_CHALLENGE="${SSL_CHALLENGE:-http}"
    
    # Cloudflare (if using DNS challenge)
    if [[ "$SSL_CHALLENGE" == "dns" ]]; then
        export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN required for DNS challenge}"
        export CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID:?CLOUDFLARE_ZONE_ID required for DNS challenge}"
    fi
    
    success "✅ SSL configuration set"
}

# Validate required environment variables
validate_environment() {
    local env="$1"
    local errors=0
    
    log "🔍 Validating $env environment configuration..."
    
    # Common required variables
    local required_vars=(
        "ENVIRONMENT"
        "NODE_ENV"
        "DOMAIN"
    )
    
    # Environment-specific required variables
    if [[ "$env" != "development" ]]; then
        required_vars+=(
            "DATABASE_URL"
            "REDIS_URL"
            "SUPABASE_URL"
            "SUPABASE_ANON_KEY"
            "NEXTAUTH_SECRET"
            "ALBION_API_KEY"
        )
    fi
    
    # Check each required variable
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "❌ Required variable $var is not set"
            ((errors++))
        fi
    done
    
    if [[ $errors -eq 0 ]]; then
        success "✅ Environment validation passed"
        return 0
    else
        error "❌ Environment validation failed with $errors errors"
        return 1
    fi
}

# Generate environment file
generate_env_file() {
    local env="$1"
    local env_file=".env.${env}"
    
    log "📝 Generating $env_file..."
    
    cat > "$env_file" <<EOF
# Environment: $env
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

# Application
ENVIRONMENT=$ENVIRONMENT
NODE_ENV=$NODE_ENV
DEBUG=$DEBUG
LOG_LEVEL=$LOG_LEVEL
DOMAIN=$DOMAIN
PORT=$PORT

# Database
DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL

# Supabase
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Authentication
NEXTAUTH_URL=$NEXTAUTH_URL
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Features
ENABLE_ANALYTICS=$ENABLE_ANALYTICS
ENABLE_MONITORING=$ENABLE_MONITORING
ENABLE_COOLIFY=$ENABLE_COOLIFY
ENABLE_SSL=$ENABLE_SSL

# API Keys
ALBION_API_KEY=$ALBION_API_KEY
GITHUB_TOKEN=${GITHUB_TOKEN:-}

# Performance
RATE_LIMIT_REQUESTS=${RATE_LIMIT_REQUESTS:-100}
RATE_LIMIT_WINDOW=${RATE_LIMIT_WINDOW:-900}
CACHE_TTL=${CACHE_TTL:-300}
EOF

    # Add environment-specific variables
    if [[ "$DEPLOYMENT_MODE" == "k8s" ]]; then
        cat >> "$env_file" <<EOF

# Kubernetes
DEPLOYMENT_MODE=$DEPLOYMENT_MODE
K8S_NAMESPACE=$K8S_NAMESPACE
K8S_CLUSTER_NAME=$K8S_CLUSTER_NAME
CPU_LIMIT=$CPU_LIMIT
MEMORY_LIMIT=$MEMORY_LIMIT
MIN_REPLICAS=$MIN_REPLICAS
MAX_REPLICAS=$MAX_REPLICAS
EOF
    fi
    
    if [[ "$ENABLE_COOLIFY" == "true" ]]; then
        cat >> "$env_file" <<EOF

# Coolify
COOLIFY_URL=${COOLIFY_URL:-}
COOLIFY_TOKEN=${COOLIFY_TOKEN:-}
GITHUB_REPO=${GITHUB_REPO:-}
EOF
    fi
    
    if [[ "$ENABLE_MONITORING" == "true" ]]; then
        cat >> "$env_file" <<EOF

# Monitoring
PROMETHEUS_URL=${PROMETHEUS_URL:-}
GRAFANA_URL=${GRAFANA_URL:-}
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-}
EOF
    fi
    
    success "✅ Environment file generated: $env_file"
}

# Main configuration function
configure_environment() {
    local env="${1:-$(detect_environment)}"
    
    log "🚀 Configuring environment: $env"
    
    case "$env" in
        "development"|"dev")
            configure_development
            configure_docker_compose
            ;;
        "staging")
            configure_staging
            configure_docker_compose
            configure_coolify
            configure_monitoring
            configure_ssl
            ;;
        "production"|"prod")
            configure_production
            
            # Check deployment mode
            if [[ "${DEPLOYMENT_MODE:-}" == "k8s" ]]; then
                configure_kubernetes
            else
                configure_docker_compose
            fi
            
            configure_coolify
            configure_monitoring
            configure_ssl
            ;;
        *)
            error "❌ Unknown environment: $env"
            error "   Valid environments: development, staging, production"
            exit 1
            ;;
    esac
    
    # Validate configuration
    if ! validate_environment "$env"; then
        exit 1
    fi
    
    # Generate environment file
    generate_env_file "$env"
    
    success "🎉 Environment configuration completed for: $env"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    configure_environment "${1:-}"
fi