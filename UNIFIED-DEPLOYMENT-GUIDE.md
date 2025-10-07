# Unified Deployment Guide - Single Approach Architecture

This guide covers the unified deployment architecture for the Albion Online Dashboard, implementing the roadmap's recommended Supabase Self-Hosting + Cloudflare Workers architecture for optimal cost-effectiveness and performance.

## 🚀 Overview

The unified deployment system implements a **single, standardized approach** based on the October 2025 roadmap:
- **Supabase Self-Hosting**: Cost-effective, production-ready database and backend services
- **Cloudflare Workers**: Serverless compute layer for API endpoints and data processing
- **Single-Host Deployment**: Optimized for NVMe servers (Hetzner AX41-NVMe or similar)
- **Roadmap Compliance**: Follows the official project roadmap for scalability and cost optimization

## 🎯 Single Deployment Mode

**All deployments now use the unified script with consistent architecture:**
- Production-ready Supabase self-hosting with TimescaleDB optimization
- Cloudflare Workers integration for serverless API endpoints
- MinIO for S3-compatible storage
- Caddy reverse proxy with automatic HTTPS
- Automated backups and monitoring
- No multiple deployment modes or complex configuration options

### System Requirements
- **OS**: Ubuntu 22.04 or 24.04 LTS
- **Memory**: 16GB+ recommended (8GB minimum)
- **Storage**: 40GB+ available disk space
- **Network**: Public IP with domain name

### Required Tools
- Docker & Docker Compose
- Git
- curl, wget, unzip
- OpenSSL

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 22.04 or 24.04 LTS
- **Memory**: 16GB+ recommended (8GB minimum)
- **Storage**: 40GB+ available disk space
- **Network**: Public IP with domain name

### Required Tools
- Docker & Docker Compose
- Git
- curl, wget, unzip
- OpenSSL

### Environment Variables
The unified deployment script handles all configuration automatically. Only basic domain and email settings are required:

```bash
export DOMAIN="yourdomain.com"
export EMAIL="admin@yourdomain.com"
```

## 🔧 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/albion-dashboard.git
cd albion-dashboard
```

### 2. Configure Basic Settings
```bash
# Set minimal required environment variables
export DOMAIN="yourdomain.com"
export EMAIL="admin@yourdomain.com"
```

### 3. Run Unified Deployment
```bash
# Make script executable and run deployment
chmod +x deploy-albion-unified.sh
sudo bash deploy-albion-unified.sh
```

## 🏗️ Deployment Architecture

The unified deployment implements the roadmap's recommended architecture:

### Core Components
- **Supabase Self-Hosting**: PostgreSQL + PostgREST + Auth + Realtime + Storage
- **TimescaleDB Integration**: Optimized for time-series data (market prices, PvP events)
- **MinIO Storage**: S3-compatible object storage for Supabase buckets
- **Caddy Proxy**: Reverse proxy with automatic HTTPS and security headers
- **Cloudflare Workers**: Serverless API layer for data processing

### Cloudflare Workers Integration
The deployment automatically sets up Cloudflare Workers for serverless API endpoints:

- **API Endpoints**: Market prices, flip suggestions, PvP matchups
- **Serverless Compute**: Cost-effective data processing and caching
- **Global CDN**: Automatic edge caching for improved performance
- **Environment Secrets**: Secure configuration management

## 📁 File Structure

```
deploy-albion-unified.sh           # Main unified deployment script
.env.example                      # Environment configuration template
scripts/infra/
├── .env.example                  # Archived legacy environment configs
└── ao-bin-integration.js         # Albion Online binary integration (kept for reference)

.github/workflows/
└── [CI/CD workflows for future roadmap phases]
```

## 🔧 Configuration Management

The unified deployment script handles all configuration automatically:

- **Security Settings**: UFW firewall, fail2ban, automatic updates
- **Database Optimization**: TimescaleDB for time-series data
- **Storage Configuration**: MinIO buckets for Supabase
- **Proxy Settings**: Caddy with HTTPS and security headers
- **Monitoring Setup**: Basic health checks and logging

## 🚀 Deployment Process

The deployment follows a single, streamlined process:

### Phase 1: System Setup
- Ubuntu package updates and security hardening
- UFW firewall configuration with secure defaults
- Automatic security updates setup

### Phase 2: Docker Runtime
- Docker Engine installation and configuration
- Docker Compose plugin setup

### Phase 3: Supabase Self-Hosting
- Supabase services deployment (PostgreSQL, PostgREST, Auth, Realtime, Storage)
- TimescaleDB extension for time-series optimization
- Albion Online database schema creation

### Phase 4: MinIO Storage
- S3-compatible storage server setup
- Bucket creation for Supabase integration

### Phase 5: Caddy Proxy
- Reverse proxy configuration with automatic HTTPS
- Security headers and rate limiting

### Phase 6: Cloudflare Workers
- Worker script generation for API endpoints
- Deployment configuration setup

### Phase 7: Monitoring & Backups
- Daily automated backup scripts
- System monitoring and health checks

## 🔍 Monitoring & Maintenance

### Health Checks
The system includes basic health monitoring:

```bash
# Application health
curl https://yourdomain.com/health

# Database connectivity
curl https://yourdomain.com/api/health/db

# Supabase services status
docker ps --filter name=supabase
```

### Backup Management
```bash
# Run manual backup
/opt/backup-albion.sh

# Check backup logs
tail -f /var/log/cron.log

# List available backups
ls -la /opt/backups/
```

### Log Monitoring
```bash
# Application logs
docker-compose logs -f supabase

# System logs
journalctl -f -u docker

# Caddy access logs
tail -f /var/log/caddy/access.log
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Domain Not Resolving
```bash
# Check DNS configuration
nslookup yourdomain.com

# Verify Caddy configuration
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
curl -I https://yourdomain.com

# Force certificate renewal (if needed)
docker exec caddy caddy reload
```

#### 3. Database Connection Problems
```bash
# Check database status
docker exec supabase-db pg_isready -U postgres

# View database logs
docker logs supabase-db
```

#### 4. Cloudflare Workers Issues
```bash
# Check worker deployment
cd /opt/cloudflare-workers
./deploy.sh --dry-run
```

### Debug Mode
Enable debug logging:

```bash
export DEBUG=true

# Re-run deployment with debug output
sudo bash deploy-albion-unified.sh
```

## 🔄 Updates & Maintenance

### Manual Updates
```bash
# Pull latest changes
git pull origin main

# Update Supabase services
cd /opt/supabase && git pull
docker compose up -d

# Run database migrations (if needed)
# Check deployment summary for migration instructions
```

### Backup Verification
```bash
# Test backup restoration
# 1. Create test environment
# 2. Restore from latest backup
# 3. Verify data integrity
```

## 🔐 Security Considerations

### Network Security
- UFW firewall with minimal open ports
- Fail2Ban for intrusion prevention
- Regular security updates via unattended-upgrades

### Application Security
- HTTPS-only with HSTS headers
- CSP headers for XSS protection
- Rate limiting on API endpoints

### Data Protection
- Encrypted database connections
- Secure environment variable handling
- Regular automated backups

## 📞 Support & Documentation

### Getting Help
1. Check this unified deployment guide
2. Review deployment logs in `/opt/albion-deployment-summary.txt`
3. Check application and system logs
4. Contact the development team

### Additional Resources
- [Project Roadmap](./Docs/ROADMAP.md)
- [Security Hardening](./SECURITY-HARDENING.md)
- [Environment Variables](./ENVIRONMENT-VARIABLES.md)

---

*Last updated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")*

**Note**: This deployment guide implements the single, unified approach as specified in the October 2025 roadmap. All previous multi-mode deployment scripts have been archived for reference.