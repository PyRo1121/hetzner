# Unified Deployment Guide

This guide covers the new unified deployment architecture for the Albion Online Dashboard, combining enterprise features with robust infrastructure automation.

## 🚀 Overview

The unified deployment system supports multiple deployment modes:
- **Development**: Local development with Docker Compose
- **Staging**: Testing environment with full CI/CD pipeline
- **Production**: Enterprise-grade deployment with Kubernetes or Docker Compose
- **Enterprise**: Full-featured deployment with Coolify CI/CD, monitoring, and auto-scaling

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
Copy `.env.example` to your environment-specific file and configure:

```bash
# Copy template
cp scripts/infra/.env.example .env.production

# Edit with your values
nano .env.production
```

## 🔧 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/albion-dashboard.git
cd albion-dashboard
```

### 2. Configure Environment
```bash
# Set up environment variables
export DOMAIN="yourdomain.com"
export EMAIL="admin@yourdomain.com"
export GITHUB_REPO="your-username/albion-dashboard"
export GITHUB_TOKEN="your-github-token"
export DEPLOYMENT_MODE="enterprise"  # or "basic", "k8s"
```

### 3. Run Deployment
```bash
# Make script executable
chmod +x scripts/infra/deploy-unified-enterprise.sh

# Run deployment
sudo bash scripts/infra/deploy-unified-enterprise.sh
```

## 🏗️ Deployment Modes

### Development Mode
For local development and testing:

```bash
export ENVIRONMENT="development"
export DEPLOYMENT_MODE="basic"
export ENABLE_COOLIFY="false"
export ENABLE_MONITORING="false"

# Run development setup
bash scripts/infra/environment-configs.sh development
docker-compose up -d
```

### Staging Mode
For testing before production:

```bash
export ENVIRONMENT="staging"
export DEPLOYMENT_MODE="enterprise"
export STAGING_DOMAIN="staging.yourdomain.com"

# Deploy to staging
sudo bash scripts/infra/deploy-unified-enterprise.sh
```

### Production Mode - Docker Compose
Standard production deployment:

```bash
export ENVIRONMENT="production"
export DEPLOYMENT_MODE="enterprise"
export ENABLE_COOLIFY="true"
export ENABLE_MONITORING="true"
export ENABLE_SSL="true"

# Deploy to production
sudo bash scripts/infra/deploy-unified-enterprise.sh
```

### Production Mode - Kubernetes
Enterprise Kubernetes deployment:

```bash
export ENVIRONMENT="production"
export DEPLOYMENT_MODE="k8s"
export K8S_NAMESPACE="albion-dashboard"
export MIN_REPLICAS="3"
export MAX_REPLICAS="20"

# Deploy to Kubernetes
sudo bash scripts/infra/deploy-unified-enterprise.sh
```

## 🔄 CI/CD Integration

### GitHub Actions
The deployment includes three GitHub Actions workflows:

#### 1. Production Deployment (`.github/workflows/deploy-production.yml`)
- **Triggers**: Push to `main`/`master`, manual dispatch
- **Features**: Full validation, multi-mode deployment, health checks
- **Modes**: `basic`, `enterprise`, `k8s`

#### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)
- **Triggers**: Push to `develop`/`staging`, PRs to main
- **Features**: Staging environment testing, cleanup
- **Modes**: `basic`, `enterprise`

#### 3. Infrastructure Validation (`.github/workflows/infrastructure-validation.yml`)
- **Triggers**: Changes to infrastructure files
- **Features**: Script validation, security scanning, dry-run testing

### Coolify CI/CD
When `ENABLE_COOLIFY=true`, the system sets up:
- Automated GitHub webhook integration
- Zero-downtime deployments
- Rollback capabilities
- Resource monitoring

## 🏛️ Architecture Components

### Core Infrastructure
- **Reverse Proxy**: Caddy with automatic HTTPS
- **Database**: PostgreSQL with automated backups
- **Cache**: Redis for session and data caching
- **Storage**: Supabase for file storage and real-time features

### Monitoring Stack (Optional)
- **Metrics**: Prometheus + Grafana
- **Logs**: Centralized logging with retention
- **Alerts**: Slack/Discord notifications
- **Health Checks**: Automated endpoint monitoring

### Security Features
- **SSL/TLS**: Automatic certificate management
- **Firewall**: UFW with secure defaults
- **Fail2Ban**: Intrusion prevention
- **Security Headers**: CSP, HSTS, etc.

## 📁 File Structure

```
scripts/infra/
├── deploy-unified-enterprise.sh    # Main deployment script
├── environment-configs.sh          # Environment-specific configurations
├── coolify-integration.sh          # Coolify CI/CD setup
├── .env.example                   # Environment template
└── docker-compose/               # Docker Compose configurations
    ├── docker-compose.yml
    ├── docker-compose.override.yml
    └── monitoring.yml

.github/workflows/
├── deploy-production.yml          # Production deployment
├── deploy-staging.yml            # Staging deployment
└── infrastructure-validation.yml  # Infrastructure validation

k8s/
├── app/                          # Application manifests
├── postgres/                     # PostgreSQL setup
├── redis/                        # Redis configuration
└── supabase/                     # Supabase components
```

## 🔧 Configuration Management

### Environment-Specific Settings

The system automatically detects and configures environments:

```bash
# Development
- Local database and Redis
- Debug mode enabled
- No SSL/monitoring
- Mock API keys

# Staging
- Remote database
- SSL enabled
- Basic monitoring
- Real API keys required

# Production
- High availability setup
- Full monitoring stack
- Security hardening
- Performance optimization
```

### Feature Flags

Control deployment features via environment variables:

```bash
ENABLE_ANALYTICS=true      # Google Analytics integration
ENABLE_MONITORING=true     # Prometheus/Grafana stack
ENABLE_COOLIFY=true        # Coolify CI/CD platform
ENABLE_SSL=true           # Automatic HTTPS certificates
ENABLE_GITOPS=true        # GitOps workflow integration
```

## 🚀 Deployment Process

### Phase 1: Prerequisites
- System requirements validation
- Environment variable checks
- Network connectivity tests
- Security baseline setup

### Phase 2: Core Infrastructure
- Docker and Docker Compose installation
- Database setup (PostgreSQL)
- Cache setup (Redis)
- Network configuration

### Phase 3: Application Deployment
- Application container build/pull
- Database migrations
- Configuration deployment
- Service startup

### Phase 4: Reverse Proxy & SSL
- Caddy installation and configuration
- Automatic HTTPS certificate generation
- Domain routing setup
- Security headers configuration

### Phase 5: CI/CD Integration (Optional)
- Coolify installation and setup
- GitHub webhook configuration
- Automated deployment pipeline
- Rollback mechanism setup

### Phase 6: Monitoring & Observability (Optional)
- Prometheus metrics collection
- Grafana dashboard setup
- Log aggregation configuration
- Alert rule deployment

## 🔍 Monitoring & Maintenance

### Health Checks
The system includes comprehensive health monitoring:

```bash
# Application health
curl https://yourdomain.com/api/health

# Database connectivity
curl https://yourdomain.com/api/health/db

# Cache status
curl https://yourdomain.com/api/health/cache

# Supabase integration
curl https://yourdomain.com/api/health/supabase
```

### Monitoring Dashboards
- **Grafana**: `https://grafana.yourdomain.com`
- **Prometheus**: `https://prometheus.yourdomain.com`
- **Coolify**: `https://coolify.yourdomain.com`

### Log Management
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# Reverse proxy logs
docker-compose logs -f caddy

# System logs
journalctl -f -u docker
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Domain Not Resolving
```bash
# Check DNS configuration
nslookup yourdomain.com

# Verify Caddy configuration
docker-compose exec caddy caddy validate --config /etc/caddy/Caddyfile
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
docker-compose exec caddy caddy list-certificates

# Force certificate renewal
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

#### 3. Database Connection Problems
```bash
# Check database status
docker-compose exec postgres pg_isready

# View database logs
docker-compose logs postgres

# Test connection
docker-compose exec app npm run db:test
```

#### 4. Coolify Integration Issues
```bash
# Check Coolify status
curl -f https://coolify.yourdomain.com/api/health

# Verify webhook configuration
curl -X POST https://coolify.yourdomain.com/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Debug Mode
Enable debug logging for detailed troubleshooting:

```bash
export DEBUG=true
export LOG_LEVEL=debug

# Re-run deployment with debug output
sudo bash scripts/infra/deploy-unified-enterprise.sh
```

## 🔄 Updates & Maintenance

### Automated Updates
The system supports automated updates via:
- GitHub Actions on code changes
- Coolify webhooks for continuous deployment
- Scheduled maintenance windows

### Manual Updates
```bash
# Pull latest changes
git pull origin main

# Update containers
docker-compose pull
docker-compose up -d

# Run database migrations
docker-compose exec app npm run db:migrate
```

### Backup & Recovery
```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres albion_dashboard > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres albion_dashboard < backup.sql

# Configuration backup
tar -czf config-backup.tar.gz .env docker-compose.yml
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
- Secure session management

### Data Protection
- Encrypted database connections
- Secure environment variable handling
- Regular automated backups
- Access logging and monitoring

## 📞 Support & Contributing

### Getting Help
1. Check this documentation
2. Review GitHub Issues
3. Check application logs
4. Contact the development team

### Contributing
1. Fork the repository
2. Create a feature branch
3. Test your changes in staging
4. Submit a pull request

### Reporting Issues
Include the following information:
- Deployment mode and environment
- Error messages and logs
- Steps to reproduce
- System specifications

---

## 📚 Additional Resources

- [API Documentation](./API-DOCS.md)
- [Development Setup](./VSCODE_SETUP.md)
- [Security Hardening](./SECURITY-HARDENING.md)
- [Performance Optimization](./PERFORMANCE.md)
- [Kubernetes Guide](./INFRA-K3S.md)

---

*Last updated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")*