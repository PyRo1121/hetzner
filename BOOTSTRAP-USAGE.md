# Enhanced Supabase Bootstrap Script Usage Guide

## Overview

The `bootstrap-supabase-workers.sh` script provides a complete, secure, and production-ready Supabase hosting environment with optional advanced monitoring and analytics capabilities. This script is modernized for October 2025 standards and includes state-of-the-art security, monitoring, and performance features.

## Prerequisites

- **Operating System**: Ubuntu 22.04 or 24.04 LTS
- **Root Access**: Script must be run with `sudo`
- **Domain**: A valid domain name pointing to your server
- **Email**: Valid email address for TLS certificate notifications

## Quick Start

### Basic Installation (Supabase Only)

```bash
sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com bash bootstrap-supabase-workers.sh
```

### Advanced Installation (with Monitoring Stack)

```bash
sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com ENABLE_K3S_MONITORING=true bash bootstrap-supabase-workers.sh
```

## Environment Variables

### Required Variables

| Variable | Description                             | Example             |
| -------- | --------------------------------------- | ------------------- |
| `DOMAIN` | Your public domain name                 | `example.com`       |
| `EMAIL`  | Email for TLS certificate notifications | `admin@example.com` |

### Optional Variables

| Variable                | Default  | Description                          |
| ----------------------- | -------- | ------------------------------------ |
| `HARDEN_SSH`            | `false`  | Disable password auth and root login |
| `TZ`                    | `UTC`    | Server timezone                      |
| `POSTGRES_PASSWORD`     | _random_ | Custom PostgreSQL password           |
| `EXPOSE_MINIO_CONSOLE`  | `false`  | Expose MinIO console on port 9001    |
| `ENABLE_K3S_MONITORING` | `false`  | Install k3s + monitoring stack       |
| `DEBUG`                 | `false`  | Enable verbose logging               |

## Features Included

### Core Features (Always Installed)

- **Docker Engine 27.3** with Compose plugin
- **Caddy 2.9** reverse proxy with automatic HTTPS
- **Supabase Self-Hosted** complete stack
- **UFW Firewall** with secure defaults
- **Fail2ban** SSH protection
- **Automated Backups** with 7-day retention
- **Security Headers** and rate limiting

### Advanced Features (Optional with `ENABLE_K3S_MONITORING=true`)

- **k3s Kubernetes** cluster (v1.34.1)
- **Prometheus** metrics collection (v2.54)
- **Grafana** dashboards (v11.3)
- **Loki** log aggregation (v3.2)
- **Promtail** log shipping
- **Ingress-nginx** controller
- **Cert-manager** for TLS automation

## Installation Examples

### 1. Basic Secure Setup

```bash
# Basic installation with SSH hardening
sudo DOMAIN=myapp.com \
     EMAIL=admin@myapp.com \
     HARDEN_SSH=true \
     TZ=America/New_York \
     bash bootstrap-supabase-workers.sh
```

### 2. Full Monitoring Stack

```bash
# Complete installation with monitoring and analytics
sudo DOMAIN=myapp.com \
     EMAIL=admin@myapp.com \
     ENABLE_K3S_MONITORING=true \
     EXPOSE_MINIO_CONSOLE=true \
     HARDEN_SSH=true \
     bash bootstrap-supabase-workers.sh
```

### 3. Development Setup

```bash
# Development setup with debug logging
sudo DOMAIN=dev.myapp.com \
     EMAIL=dev@myapp.com \
     DEBUG=true \
     bash bootstrap-supabase-workers.sh
```

## Post-Installation Access

### Supabase Endpoints

After installation, your Supabase instance will be available at:

- **API**: `https://yourdomain.com/rest/v1/`
- **Auth**: `https://yourdomain.com/auth/v1/`
- **Realtime**: `wss://yourdomain.com/realtime/v1/`
- **Storage**: `https://yourdomain.com/storage/v1/`
- **Functions**: `https://yourdomain.com/functions/v1/`
- **Studio**: `https://yourdomain.com/studio`

### Monitoring Endpoints (if enabled)

- **Grafana**: `https://yourdomain.com:3000` (admin/admin123)
- **Prometheus**: `https://yourdomain.com:9090`
- **k3s API**: `https://yourdomain.com:6443`

### MinIO Console (if enabled)

- **Console**: `https://yourdomain.com:9001`

## Security Features

### Firewall Configuration

The script automatically configures UFW with these rules:

- **SSH (22/tcp)**: Allowed
- **HTTP (80/tcp)**: Allowed (redirects to HTTPS)
- **HTTPS (443/tcp)**: Allowed
- **MinIO Console (9001/tcp)**: Optional
- **Grafana (3000/tcp)**: If monitoring enabled
- **Prometheus (9090/tcp)**: If monitoring enabled
- **k3s API (6443/tcp)**: If monitoring enabled

### SSH Hardening (Optional)

When `HARDEN_SSH=true`:

- Disables password authentication
- Disables root login
- Requires SSH key authentication

**⚠️ Warning**: Ensure SSH keys are properly configured before enabling SSH hardening.

### Fail2ban Protection

Automatically configured to protect SSH with:

- **Ban time**: 10 minutes
- **Find time**: 10 minutes
- **Max retry**: 5 attempts

## Backup System

### Automated Backups

- **Schedule**: Daily at 2:00 AM
- **Location**: `/var/backups/supabase/`
- **Retention**: 7 days
- **Compression**: gzip
- **Integrity**: SHA256 checksums

### Manual Backup

```bash
# Create manual backup
sudo -u postgres pg_dump -h localhost -p 5432 -U postgres supabase > backup.sql

# Restore from backup
sudo -u postgres psql -h localhost -p 5432 -U postgres supabase < backup.sql
```

## Monitoring and Analytics

### Grafana Dashboards

When monitoring is enabled, Grafana includes:

- **System Metrics**: CPU, memory, disk usage
- **Docker Metrics**: Container performance
- **Supabase Metrics**: Database and API performance
- **k3s Metrics**: Kubernetes cluster health

### Log Management

- **Application logs**: Collected by Promtail
- **System logs**: Aggregated in Loki
- **Caddy logs**: Available at `/var/log/caddy/`

## Troubleshooting

### Common Issues

1. **Domain not resolving**

   ```bash
   # Check DNS resolution
   nslookup yourdomain.com

   # Verify Caddy configuration
   sudo caddy validate --config /etc/caddy/Caddyfile
   ```

2. **Docker containers not starting**

   ```bash
   # Check Docker status
   sudo systemctl status docker

   # View Supabase logs
   cd /opt/supabase/supabase && sudo docker compose logs
   ```

3. **Monitoring stack issues**

   ```bash
   # Check k3s status
   sudo k3s kubectl get nodes

   # View monitoring pods
   sudo k3s kubectl get pods -n monitoring
   ```

### Log Locations

- **Script logs**: `/var/log/bootstrap-supabase.log`
- **Caddy logs**: `/var/log/caddy/yourdomain.com.log`
- **Docker logs**: `sudo docker compose logs` (in Supabase directory)
- **System logs**: `/var/log/syslog`

## Maintenance

### Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd /opt/supabase/supabase && sudo docker compose pull && sudo docker compose up -d

# Update monitoring stack (if enabled)
sudo helm repo update
sudo helm upgrade prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

### Certificate Renewal

Caddy automatically handles certificate renewal. To check status:

```bash
# View certificate status
sudo caddy list-certificates

# Force certificate renewal
sudo systemctl reload caddy
```

## Performance Optimization

### Resource Requirements

**Minimum (Supabase only)**:

- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 20GB SSD

**Recommended (with monitoring)**:

- **CPU**: 4 cores
- **RAM**: 8GB
- **Disk**: 50GB SSD

### Scaling Considerations

- Use load balancers for high availability
- Consider database read replicas for heavy read workloads
- Monitor resource usage through Grafana dashboards
- Implement horizontal pod autoscaling in k3s

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Ensure all prerequisites are met
4. Verify DNS and firewall configuration

## License

This script is provided as-is for educational and production use. Please review and test thoroughly before deploying to production environments.