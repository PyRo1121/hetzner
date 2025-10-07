# Test Server Setup Guide

## Prerequisites for Your Test Server

Before running the bootstrap script on your test server, ensure you have:

### Server Requirements

- **OS**: Ubuntu 22.04 or 24.04 LTS
- **RAM**: Minimum 4GB (8GB recommended with monitoring)
- **CPU**: Minimum 2 cores (4 cores recommended)
- **Disk**: Minimum 20GB free space (50GB recommended)
- **Root access**: Required for installation

### Domain Setup

- A domain name pointing to your server's IP address
- DNS A record configured (e.g., `test.yourdomain.com` → `your-server-ip`)

## Step 1: Upload the Script to Your Server

### Option A: Direct Download (Recommended)

```bash
# On your test server, download the script
wget https://raw.githubusercontent.com/yourusername/yourrepo/main/scripts/infra/bootstrap-supabase-workers.sh
chmod +x bootstrap-supabase-workers.sh
```

### Option B: Copy via SCP

```bash
# From your local machine
scp "C:\Users\olen\Documents\Code\Perplexity Idea\scripts\infra\bootstrap-supabase-workers.sh" user@your-server-ip:/root/
```

### Option C: Manual Copy-Paste

1. SSH into your server
2. Create the file: `nano /root/bootstrap-supabase-workers.sh`
3. Copy the entire script content and paste it
4. Save and exit (Ctrl+X, Y, Enter)
5. Make executable: `chmod +x /root/bootstrap-supabase-workers.sh`

## Step 2: Basic Installation (Supabase Only)

### Test with Basic Setup

```bash
# SSH into your test server
ssh root@your-server-ip

# Run basic installation
sudo DOMAIN=test.yourdomain.com \
     EMAIL=admin@yourdomain.com \
     HARDEN_SSH=false \
     DEBUG=true \
     bash /root/bootstrap-supabase-workers.sh
```

### Environment Variables for Testing

```bash
export DOMAIN="test.yourdomain.com"        # Replace with your test domain
export EMAIL="admin@yourdomain.com"        # Replace with your email
export HARDEN_SSH="false"                  # Keep false for testing
export DEBUG="true"                        # Enable verbose logging
export TZ="UTC"                           # Or your timezone
export EXPOSE_MINIO_CONSOLE="true"        # Optional: expose MinIO console
```

## Step 3: Advanced Installation (with Monitoring)

### Full Stack with Monitoring

```bash
# For complete setup with monitoring stack
sudo DOMAIN=test.yourdomain.com \
     EMAIL=admin@yourdomain.com \
     ENABLE_K3S_MONITORING=true \
     EXPOSE_MINIO_CONSOLE=true \
     DEBUG=true \
     HARDEN_SSH=false \
     bash /root/bootstrap-supabase-workers.sh
```

## Step 4: Verification Steps

### Check Services Status

```bash
# Check Docker
sudo systemctl status docker

# Check Caddy
sudo systemctl status caddy

# Check Supabase containers
cd /opt/supabase/supabase && sudo docker compose ps

# If monitoring enabled, check k3s
sudo k3s kubectl get nodes
sudo k3s kubectl get pods -A
```

### Test Endpoints

```bash
# Test health endpoint
curl https://test.yourdomain.com/health

# Test API endpoint
curl https://test.yourdomain.com/rest/v1/

# Check Supabase Studio
curl -I https://test.yourdomain.com/studio
```

### Access Web Interfaces

- **Supabase Studio**: `https://test.yourdomain.com/studio`
- **Grafana** (if monitoring enabled): `https://test.yourdomain.com:3000` (admin/admin123)
- **Prometheus** (if monitoring enabled): `https://test.yourdomain.com:9090`
- **MinIO Console** (if enabled): `https://test.yourdomain.com:9001`

## Step 5: Troubleshooting

### Common Issues and Solutions

#### 1. Domain Not Resolving

```bash
# Check DNS resolution
nslookup test.yourdomain.com

# If DNS is not ready, you can test with IP
# Edit /etc/hosts temporarily
echo "your-server-ip test.yourdomain.com" >> /etc/hosts
```

#### 2. Firewall Issues

```bash
# Check UFW status
sudo ufw status

# Manually open ports if needed
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
```

#### 3. Docker Issues

```bash
# Restart Docker if needed
sudo systemctl restart docker

# Check Docker logs
sudo journalctl -u docker -f
```

#### 4. Caddy Configuration Issues

```bash
# Check Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Restart Caddy
sudo systemctl restart caddy

# Check Caddy logs
sudo journalctl -u caddy -f
```

#### 5. Supabase Container Issues

```bash
# Navigate to Supabase directory
cd /opt/supabase/supabase

# Check container status
sudo docker compose ps

# View logs
sudo docker compose logs

# Restart specific service
sudo docker compose restart kong
```

### Log Locations

- **Script logs**: Check terminal output during installation
- **Caddy logs**: `/var/log/caddy/test.yourdomain.com.log`
- **Docker logs**: `sudo docker compose logs` (in Supabase directory)
- **System logs**: `sudo journalctl -f`

## Step 6: Testing Specific Features

### Test Database Connection

```bash
# Connect to PostgreSQL
sudo docker exec -it supabase-db psql -U postgres -d postgres

# List databases
\l

# Exit
\q
```

### Test API Endpoints

```bash
# Get Supabase keys from .env file
cd /opt/supabase/supabase
cat docker/.env | grep -E "(ANON_KEY|SERVICE_ROLE_KEY)"

# Test with curl (replace with actual keys)
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     https://test.yourdomain.com/rest/v1/
```

### Test Monitoring (if enabled)

```bash
# Check Prometheus targets
curl https://test.yourdomain.com:9090/api/v1/targets

# Check Grafana health
curl https://test.yourdomain.com:3000/api/health
```

## Step 7: Cleanup (if needed)

### Remove Installation

```bash
# Stop and remove Supabase
cd /opt/supabase/supabase && sudo docker compose down -v

# Remove Docker containers and images
sudo docker system prune -a

# Remove k3s (if installed)
sudo /usr/local/bin/k3s-uninstall.sh

# Remove Caddy
sudo systemctl stop caddy
sudo apt remove -y caddy

# Remove directories
sudo rm -rf /opt/supabase
sudo rm -rf /var/lib/rancher
```

## Security Notes for Testing

1. **SSH Access**: Keep `HARDEN_SSH=false` during testing for easier access
2. **Firewall**: The script configures UFW automatically
3. **Passwords**: Generated passwords are stored in `/opt/supabase/supabase/docker/.env`
4. **TLS Certificates**: Caddy handles automatic HTTPS with Let's Encrypt

## Next Steps After Successful Test

1. **Production Deployment**: Use `HARDEN_SSH=true` for production
2. **Backup Testing**: Verify the automated backup system
3. **Monitoring Setup**: Configure Grafana dashboards and alerts
4. **Performance Testing**: Load test your Supabase endpoints
5. **Security Audit**: Review firewall rules and access controls

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Ensure DNS is properly configured
4. Verify server meets minimum requirements
5. Test with `DEBUG=true` for verbose output