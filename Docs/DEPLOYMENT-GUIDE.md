# Deployment Guide: Hetzner + Supabase + k3s + Workers - October 2025 Enhanced Edition

This guide provides the exact order to run the modernized infrastructure scripts, plus the commands and configuration you need for a world‑class setup on Hetzner Cloud. It includes both a simple PoC path and the k3s path with GitOps, CI/CD, and enhanced observability.

## Overview
- **Provider**: Hetzner Cloud (server ID `110317757`, CPX11)
- **External volume**: `103677941` in `us-east` (Ashburn), mounted at `/mnt/CDN`
- **Domain**: replace `yourdomain.com` everywhere with your real domain
- **Updated**: October 2025 with latest versions and security enhancements

## What's New in October 2025
- **k3s v1.34.1+k3s1** with enhanced performance and security
- **Docker Engine v27.3** with improved container runtime
- **Caddy v2.9** with advanced security headers and rate limiting
- **Enhanced monitoring stack**: Prometheus v2.54, Grafana v11.3, Loki v3.2
- **Improved error handling** and retry mechanisms across all scripts
- **Security hardening**: fail2ban, UFW, SSH hardening, and security contexts
- **Performance optimizations**: parallel installations and resource management

## 0) DNS and rDNS Setup
- Create `A` record: `yourdomain.com -> 178.156.192.77`
- If serving IPv6, create `AAAA` record to your IPv6 address
- Set reverse DNS for IPv4 and IPv6 to `yourdomain.com` in Hetzner Cloud Console
- **New**: Consider using Cloudflare for DDoS protection and CDN

## 1) Hetzner Cloud Firewall (Enhanced Security)
**Requirements**: 
- `HCLOUD_TOKEN` (Hetzner Cloud API token with firewall permissions)
- `hcloud` CLI v1.53.0+ (optional, with REST API fallback)

**Command** (run from your workstation where the repo is checked out):
```bash
HCLOUD_TOKEN=<token> \
HCLOUD_SERVER_ID=110317757 \
SSH_PORT=22 \
SSH_ALLOW_IPS=<your-management-ip>/32 \
ENABLE_MONITORING=true \
ENABLE_RATE_LIMITING=true \
bash scripts/infra/hetzner-cloud-firewall.sh
```

**Enhanced Options**:
- `SSH_PORT`: Custom SSH port (default: 22)
- `SSH_ALLOW_IPS`: Comma-separated list of allowed IPs (default: 0.0.0.0/0)
- `ENABLE_MINIO_CONSOLE=true`: Enable MinIO console access (port 9001)
- `ENABLE_STUDIO_ACCESS=true`: Enable Supabase Studio access (port 3000)
- `ENABLE_MONITORING=true`: Enable monitoring ports (9090, 9100) - internal networks only
- `ENABLE_RATE_LIMITING=true`: Add rate limiting descriptions to HTTP/HTTPS rules
- `DEBUG=true`: Enable detailed logging
- `--force`: Skip confirmation prompts

**Security Best Practices**:
- Always restrict SSH to specific IPs in production
- Keep MinIO console and Studio access disabled in production
- Monitor firewall logs regularly
- Use strong API tokens with minimal required permissions

## 2) External Volume Setup (Enhanced with Performance Tuning)
Run on the server as `root` or with `sudo`.

**Verify device**:
```bash
ls -l /dev/disk/by-id | grep 103677941
```

**Format** (DANGER: wipes data, do once on new volume):
```bash
# Enhanced formatting with optimizations
mkfs.ext4 -F -E lazy_itable_init=0,lazy_journal_init=0 \
  -O ^has_journal -b 4096 \
  /dev/disk/by-id/scsi-0HC_Volume_103677941
```

**Create mount point and mount**:
```bash
mkdir -p /mnt/CDN
mount -o discard,defaults,noatime \
  /dev/disk/by-id/scsi-0HC_Volume_103677941 /mnt/CDN
```

**Persist across reboots** (enhanced fstab entry):
```bash
echo "/dev/disk/by-id/scsi-0HC_Volume_103677941 /mnt/CDN ext4 discard,noatime,nofail,defaults 0 2" >> /etc/fstab
# Test the mount
mount -a && df -h /mnt/CDN
```

**Enhanced permissions and directory structure**:
```bash
mkdir -p /mnt/CDN/{minio,postgres,backups,logs}
chmod 775 /mnt/CDN/minio /mnt/CDN/postgres
chmod 755 /mnt/CDN/backups /mnt/CDN/logs
chown -R 1000:1000 /mnt/CDN/minio
```

## Choose Your Deployment Path
You have two supported paths. Pick ONE based on your requirements.

### Path A: Single NVMe PoC (Fastest) — Supabase + Caddy + Workers

**Enhanced for October 2025** with Docker v27.3, Caddy v2.9, and security hardening.

**Copy to server**:
```bash
scp scripts/infra/bootstrap-supabase-workers.sh root@178.156.192.77:/root/
```

**Run bootstrap** (enhanced with new options):
```bash
sudo DOMAIN=yourdomain.com \
     EMAIL=admin@yourdomain.com \
     SSH_PORT=22 \
     FAIL2BAN_ENABLED=true \
     UFW_ENABLED=true \
     DOCKER_ROOTLESS=false \
     bash /root/bootstrap-supabase-workers.sh
```

**Optional external S3** (Cloudflare R2 in `us-east`):
```bash
sudo DOMAIN=yourdomain.com \
     EMAIL=admin@yourdomain.com \
     S3_ENDPOINT=https://<r2-endpoint> \
     S3_ACCESS_KEY=<key> \
     S3_SECRET_KEY=<secret> \
     bash /root/bootstrap-supabase-workers.sh
```

**Enhanced verification**:
```bash
# Health checks
curl -I https://yourdomain.com/auth/v1/health
curl -I https://yourdomain.com/rest/v1/ # 401 without token is expected
curl -I https://yourdomain.com/storage/v1/health

# Security headers check
curl -I https://yourdomain.com | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"

# Performance check
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/auth/v1/health
```

### Path B: World‑Class k3s — Supabase + PGBouncer + Enhanced Observability + GitOps

**Enhanced for October 2025** with k3s v1.34.1, latest Helm charts, and comprehensive monitoring.

**Copy to server**:
```bash
scp scripts/infra/k3s-bootstrap.sh root@178.156.192.77:/root/
scp -r k8s/supabase root@178.156.192.77:/root/k8s/
```

**Run bootstrap** (enhanced with new features):
```bash
sudo DOMAIN=yourdomain.com \
     EMAIL=admin@yourdomain.com \
     K3S_VERSION=v1.34.1+k3s1 \
     ENABLE_MONITORING=true \
     ENABLE_BACKUP=true \
     PARALLEL_INSTALL=true \
     bash /root/k3s-bootstrap.sh
```

**External S3** (recommended for production):
```bash
sudo DOMAIN=yourdomain.com \
     EMAIL=admin@yourdomain.com \
     S3_ENDPOINT=https://<r2-endpoint> \
     S3_ACCESS_KEY=<key> \
     S3_SECRET_KEY=<secret> \
     bash /root/k3s-bootstrap.sh
```

**Enhanced GitOps** (Flux v2 with security scanning):
```bash
sudo DOMAIN=yourdomain.com \
     EMAIL=admin@yourdomain.com \
     ENABLE_GITOPS=true \
     GIT_URL=https://github.com/<owner>/<repo> \
     GIT_BRANCH=main \
     GIT_PATH=k8s \
     FLUX_VERSION=v2.4.0 \
     bash /root/k3s-bootstrap.sh
```

**Optional Hetzner firewall integration**:
```bash
sudo DOMAIN=yourdomain.com \
     EMAIL=admin@yourdomain.com \
     HCLOUD_TOKEN=<token> \
     HCLOUD_SERVER_ID=110317757 \
     bash /root/k3s-bootstrap.sh
```

**Enhanced verification**:
```bash
# Service health
curl -I https://yourdomain.com/auth/v1/health
curl -I https://yourdomain.com/rest/v1/
curl -I https://yourdomain.com/storage/v1/health

# Kubernetes cluster status
kubectl get nodes -o wide
kubectl get pods --all-namespaces
kubectl -n monitoring get pods

# Monitoring stack
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80 &
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090 &
kubectl -n monitoring port-forward svc/loki 3100:3100 &

# Performance metrics
kubectl top nodes
kubectl top pods --all-namespaces
```

## 3) Enhanced Data Sync from GitHub (CronJob with Error Handling)

**Edit** `k8s/supabase/data-sync.yaml` to set:
- `GIT_OWNER`: your GitHub username or org
- `GIT_REPO`: your repo name (e.g., `Perplexity Idea`)
- `GIT_BRANCH`: `main`
- `RETRY_ATTEMPTS`: `3` (new)
- `TIMEOUT_SECONDS`: `300` (new)

**Enhanced features**:
- Automatic retry on failure
- Detailed logging and metrics
- Resource limits and security contexts
- Health checks and monitoring

**Apply** (GitOps will apply automatically if enabled):
```bash
kubectl apply -f k8s/supabase/data-sync.yaml -n platform
```

**Monitor sync jobs**:
```bash
kubectl get cronjobs -n platform
kubectl logs -f job/data-sync-<timestamp> -n platform
```

## 4) Enhanced CI/CD in GitHub Actions

**Updated workflows for October 2025**:

**K8s validation**: `.github/workflows/k8s-validate.yml`
- Runs on PR and push
- Enhanced with security scanning
- Performance testing
- Helm chart validation

**Workers deploy**: `.github/workflows/workers-deploy.yml`
- Enhanced error handling
- Rollback capabilities
- Performance monitoring
- Required secrets:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`

**New: Infrastructure validation**: `.github/workflows/infra-validate.yml`
- Script linting and testing
- Security scanning
- Documentation updates

**Enhanced data push workflow**:
- Automatic retries
- Data validation
- Performance metrics
- Required secrets:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 5) Enhanced Backups and Disaster Recovery

**wal-g with enhanced configuration**:
```bash
# Add to k8s/supabase/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: wal-g-backup
            image: wal-g/wal-g:v2.0.1
            env:
            - name: WALG_S3_PREFIX
              value: "s3://your-bucket/postgres-backups"
            - name: WALG_COMPRESSION_METHOD
              value: "lz4"
            - name: WALG_DELTA_MAX_STEPS
              value: "7"
```

**Enhanced backup features**:
- Incremental backups with wal-g
- Automated retention policies
- Backup verification and integrity checks
- Cross-region replication
- Point-in-time recovery capabilities

**Monthly restore rehearsals**:
```bash
# Automated restore testing
kubectl create job --from=cronjob/backup-restore-test restore-test-$(date +%Y%m%d)
```

## 6) Enhanced Security and Hardening

**System-level security**:
- **fail2ban**: Automatic IP blocking for failed attempts
- **UFW**: Enhanced firewall rules with logging
- **SSH hardening**: Key-only auth, custom ports, rate limiting
- **Automatic security updates**: Unattended upgrades configured
- **File integrity monitoring**: AIDE or similar

**Container security**:
- **Security contexts**: Non-root containers, read-only filesystems
- **Network policies**: Micro-segmentation between services
- **Pod security standards**: Enforced across all namespaces
- **Image scanning**: Trivy integration in CI/CD

**Application security**:
- **TLS 1.3**: Enforced across all services
- **HSTS**: HTTP Strict Transport Security headers
- **CSP**: Content Security Policy headers
- **Rate limiting**: Application-level protection

**Monitoring and alerting**:
- **Security events**: Centralized logging and alerting
- **Anomaly detection**: ML-based threat detection
- **Compliance**: SOC2/ISO27001 ready configurations

## 7) Performance Optimization (New Section)

**System optimizations**:
```bash
# Kernel parameters for high performance
echo 'net.core.rmem_max = 134217728' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 134217728' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_rmem = 4096 87380 134217728' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_wmem = 4096 65536 134217728' >> /etc/sysctl.conf
sysctl -p
```

**Database optimizations**:
- Connection pooling with PGBouncer
- Query optimization and indexing
- Automated VACUUM and ANALYZE
- Performance monitoring with pg_stat_statements

**Application optimizations**:
- CDN integration (Cloudflare)
- Caching strategies (Redis)
- Image optimization and compression
- Lazy loading and code splitting

## Troubleshooting (Enhanced)

**Common issues and solutions**:

**cert-manager issues**:
```bash
# Check certificate status
kubectl get clusterissuer letsencrypt -o yaml
kubectl describe certificate -n platform supabase-tls
kubectl logs -n cert-manager deployment/cert-manager
```

**PostgREST 401 errors**:
- Expected without token
- Generate JWT via Supabase client or use service role key
- Check RLS policies and permissions

**Ingress 404 errors**:
```bash
# Verify ingress controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
kubectl describe ingress -n platform supabase-ingress
```

**Performance issues**:
```bash
# Resource usage
kubectl top nodes
kubectl top pods --all-namespaces
# Database performance
kubectl exec -it postgres-0 -n platform -- psql -c "SELECT * FROM pg_stat_activity;"
```

**Enhanced logging and monitoring**:
```bash
# Centralized logs
kubectl logs -f deployment/loki -n monitoring
# Metrics and alerts
kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n monitoring
# Distributed tracing
kubectl port-forward svc/jaeger-query 16686:16686 -n monitoring
```

## Exact Commands (k3s path, with external S3 and all enhancements)

**Copy files**:
```bash
scp scripts/infra/k3s-bootstrap.sh root@178.156.192.77:/root/
scp -r k8s/supabase root@178.156.192.77:/root/k8s/
```

**Run complete setup**:
```bash
sudo DOMAIN=yourdomain.com \
     EMAIL=admin@yourdomain.com \
     S3_ENDPOINT=https://<r2-endpoint> \
     S3_ACCESS_KEY=<key> \
     S3_SECRET_KEY=<secret> \
     ENABLE_GITOPS=true \
     GIT_URL=https://github.com/<owner>/<repo> \
     GIT_BRANCH=main \
     GIT_PATH=k8s \
     ENABLE_MONITORING=true \
     ENABLE_BACKUP=true \
     PARALLEL_INSTALL=true \
     K3S_VERSION=v1.34.1+k3s1 \
     bash /root/k3s-bootstrap.sh
```

**Comprehensive verification**:
```bash
# Service health
curl -I https://yourdomain.com/auth/v1/health
curl -I https://yourdomain.com/rest/v1/
curl -I https://yourdomain.com/storage/v1/health

# Kubernetes status
kubectl get nodes,pods --all-namespaces
kubectl -n platform get svc,ingress
kubectl -n monitoring get pods

# Performance check
kubectl top nodes && kubectl top pods --all-namespaces
```

---

## Support and Updates

This deployment guide is maintained for October 2025 standards. For the latest updates, security patches, and performance optimizations, check the repository regularly.

**Need help?** 
- Check the troubleshooting section above
- Review logs using the provided commands
- Ensure all prerequisites are met
- Verify network connectivity and DNS resolution

If you share your actual domain and GitHub repo, I can generate ready‑to‑paste command lines with your exact values and pre‑configured security settings.