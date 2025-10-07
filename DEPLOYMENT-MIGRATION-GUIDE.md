# Deployment Migration Guide

This guide helps you migrate from the old deployment approach to the new unified deployment architecture.

## 🔄 Migration Overview

The new unified deployment system consolidates multiple deployment scripts into a single, comprehensive solution that supports:

- **Multiple deployment modes** (development, staging, production, enterprise)
- **Automated CI/CD** with GitHub Actions and Coolify
- **Environment-specific configurations**
- **Enhanced monitoring and security**
- **Kubernetes orchestration**

## 📋 Pre-Migration Checklist

### 1. Backup Current Setup
```bash
# Backup your current environment files
cp .env .env.backup
cp docker-compose.yml docker-compose.yml.backup

# Export current database (if applicable)
pg_dump your_database > database_backup.sql

# Backup any custom configurations
tar -czf config_backup.tar.gz config/ scripts/
```

### 2. Review Current Configuration
- Document your current environment variables
- Note any custom Docker configurations
- List any manual infrastructure setup steps
- Identify external dependencies and integrations

## 🚀 Migration Steps

### Step 1: Update Repository Structure

1. **Pull Latest Changes**
   ```bash
   git pull origin main
   ```

2. **Review New File Structure**
   ```
   scripts/infra/
   ├── deploy-unified-enterprise.sh    # Main deployment script
   ├── coolify-integration.sh          # CI/CD setup
   ├── environment-configs.sh          # Environment management
   └── .env.example                    # Configuration template
   
   .github/workflows/
   ├── deploy-production.yml           # Production deployment
   ├── deploy-staging.yml              # Staging deployment
   └── infrastructure-validation.yml   # Infrastructure validation
   ```

### Step 2: Configure Environment Variables

1. **Create New Environment Configuration**
   ```bash
   # Copy the new template
   cp scripts/infra/.env.example .env.production
   
   # Edit with your settings
   nano .env.production
   ```

2. **Required Variables for Migration**
   ```bash
   # Core Application
   DOMAIN="yourdomain.com"
   EMAIL="admin@yourdomain.com"
   
   # GitHub Integration
   GITHUB_REPO="your-username/albion-dashboard"
   GITHUB_TOKEN="your-github-token"
   GITHUB_WEBHOOK_SECRET="your-webhook-secret"
   
   # Database (migrate existing values)
   DATABASE_URL="postgresql://user:pass@localhost:5432/albion"
   REDIS_URL="redis://localhost:6379"
   
   # Supabase (migrate existing values)
   SUPABASE_URL="your-supabase-url"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-key"
   ```

### Step 3: Choose Deployment Mode

#### Option A: Docker Compose (Recommended for existing setups)
```bash
# Set deployment mode
export DEPLOYMENT_MODE="docker-compose"

# Run unified deployment
sudo bash scripts/infra/deploy-unified-enterprise.sh
```

#### Option B: Kubernetes (For scalable production)
```bash
# Set deployment mode
export DEPLOYMENT_MODE="kubernetes"

# Ensure k3s is available or will be installed
export K3S_VERSION="v1.28.5+k3s1"

# Run unified deployment
sudo bash scripts/infra/deploy-unified-enterprise.sh
```

#### Option C: Enterprise with Coolify CI/CD
```bash
# Set deployment mode
export DEPLOYMENT_MODE="enterprise"
export ENABLE_COOLIFY="true"

# Run unified deployment
sudo bash scripts/infra/deploy-unified-enterprise.sh
```

### Step 4: Migrate Data (If Applicable)

1. **Database Migration**
   ```bash
   # If you have existing data, restore it after deployment
   psql $DATABASE_URL < database_backup.sql
   
   # Run any new migrations
   bun run db:migrate
   ```

2. **Redis Data**
   ```bash
   # Redis data is typically ephemeral, but if you need to preserve:
   redis-cli --rdb dump.rdb
   # Restore after new Redis is running
   ```

### Step 5: Update CI/CD Pipeline

1. **GitHub Actions Setup**
   - The new workflows are automatically available in `.github/workflows/`
   - Configure repository secrets:
     ```
     DOMAIN
     EMAIL
     GITHUB_TOKEN
     SUPABASE_URL
     SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY
     DATABASE_URL
     REDIS_URL
     ```

2. **Coolify Integration** (if enabled)
   - Coolify will be automatically configured during deployment
   - Access dashboard at `https://coolify.yourdomain.com`
   - GitHub webhooks are automatically configured

### Step 6: Verify Migration

1. **Health Checks**
   ```bash
   # Check application health
   curl https://yourdomain.com/api/health
   
   # Check database connectivity
   curl https://yourdomain.com/api/health/db
   
   # Check Redis connectivity
   curl https://yourdomain.com/api/health/cache
   ```

2. **Monitoring Dashboards**
   - Application: `https://yourdomain.com/dashboard`
   - Grafana (if enabled): `https://grafana.yourdomain.com`
   - Coolify (if enabled): `https://coolify.yourdomain.com`

3. **SSL Certificate Verification**
   ```bash
   # Check SSL certificate
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
   ```

## 🔧 Troubleshooting Migration Issues

### Common Issues and Solutions

#### 1. Environment Variable Conflicts
```bash
# Check for conflicting variables
env | grep -E "(DATABASE|REDIS|SUPABASE)"

# Clear old variables if needed
unset OLD_VARIABLE_NAME
```

#### 2. Port Conflicts
```bash
# Check for port conflicts
netstat -tulpn | grep -E "(80|443|5432|6379)"

# Stop conflicting services
sudo systemctl stop nginx  # or apache2
sudo systemctl stop postgresql
sudo systemctl stop redis-server
```

#### 3. Docker Issues
```bash
# Clean up old containers
docker system prune -a

# Remove old volumes (CAUTION: This removes data)
docker volume prune
```

#### 4. Kubernetes Migration Issues
```bash
# Check k3s status
sudo systemctl status k3s

# View pod status
kubectl get pods -A

# Check logs
kubectl logs -n platform deployment/albion-dashboard
```

### Rollback Procedure

If migration fails, you can rollback:

1. **Stop New Services**
   ```bash
   # Stop new deployment
   docker-compose down
   # or
   kubectl delete namespace platform
   ```

2. **Restore Backup**
   ```bash
   # Restore environment
   cp .env.backup .env
   cp docker-compose.yml.backup docker-compose.yml
   
   # Restore database
   psql your_database < database_backup.sql
   
   # Restart old services
   docker-compose up -d
   ```

## 📊 Post-Migration Optimization

### 1. Performance Tuning
- Review resource allocation in new deployment
- Adjust scaling parameters if using Kubernetes
- Configure caching strategies

### 2. Security Hardening
- Review SSL/TLS configuration
- Update firewall rules
- Configure rate limiting

### 3. Monitoring Setup
- Configure alerting rules
- Set up log aggregation
- Establish backup procedures

## 📚 Additional Resources

- [Unified Deployment Guide](./UNIFIED-DEPLOYMENT-GUIDE.md) - Complete deployment documentation
- [Environment Configuration](./scripts/infra/.env.example) - All configuration options
- [Troubleshooting Guide](./UNIFIED-DEPLOYMENT-GUIDE.md#troubleshooting) - Common issues and solutions

## 🆘 Getting Help

If you encounter issues during migration:

1. Check the [troubleshooting section](./UNIFIED-DEPLOYMENT-GUIDE.md#troubleshooting)
2. Review deployment logs: `tail -f /var/log/albion-deployment.log`
3. Create an issue with migration details and error logs
4. Join our Discord for community support

---

**Migration completed successfully? Don't forget to:**
- Update your documentation
- Inform your team about new deployment procedures
- Schedule regular backups with the new system
- Test disaster recovery procedures