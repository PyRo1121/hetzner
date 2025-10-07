# k3s Bootstrap: Self-hosted Supabase + Observability + Backups (Hetzner)

This guide ships a single-node k3s cluster with Supabase core services, Postgres pooling (PGBouncer), optional S3 (MinIO or external), and observability (Prometheus, Grafana, Loki, Blackbox). It targets Hetzner Cloud VMs (e.g., CPX11) and uses HTTPS via cert-manager.

## Prerequisites
- Ubuntu 22.04 VM with `sudo` access
- DNS `A` (IPv4) and `AAAA` (IPv6) records pointing to `DOMAIN`
- Optional: Hetzner Cloud Firewall applied (see `scripts/infra/hetzner-cloud-firewall.sh`)
- Optional: External S3/CDN bucket (e.g., Cloudflare R2 in `us-east`, ID 103677941) with endpoint and keys

## One-time setup
1. Copy the bootstrap to server
   - `scp scripts/infra/k3s-bootstrap.sh root@<IP>:/root/`
   - `scp -r k8s/supabase root@<IP>:/root/k8s/`
2. Run the bootstrap
   - `sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com bash /root/k3s-bootstrap.sh`
   - Optional S3: add `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` to use external storage (e.g., Cloudflare R2 in Ashburn, us-east)
   - Optional Hetzner firewall: `HCLOUD_TOKEN` and `SERVER_ID` to preconfigure provider-layer rules

## What gets installed
- k3s + Helm
- ingress-nginx + cert-manager (ClusterIssuer: `letsencrypt`)
- Postgres (Bitnami) with 20Gi local PV + PGBouncer
- Storage: MinIO (standalone) unless `S3_ENDPOINT` provided
- Observability: kube-prometheus-stack, Loki, Promtail, Blackbox Exporter
- Supabase core services: GoTrue (Auth), PostgREST, Realtime, Storage API
- Ingress path routing: `/auth/v1`, `/rest/v1`, `/realtime/v1`, `/storage/v1`

## External S3/CDN (us-east volume)
If you purchased a CDN/S3 volume (e.g., Cloudflare R2 Ashburn `us-east`, resource ID `103677941` in project `Albion-Online-Dashboard`), set:
- `S3_ENDPOINT=https://<your-r2-endpoint>`
- `S3_ACCESS_KEY=<key>`
- `S3_SECRET_KEY=<secret>`

Storage API will use the external bucket as origin. For CDN caching, CNAME a subdomain (e.g., `cdn.yourdomain.com`) to your provider and configure cache rules there.

## Verify
- `curl -I https://DOMAIN/auth/v1/health`
- `curl -I https://DOMAIN/rest/v1/` (returns 401 without token)
- Grafana: `kubectl -n monitoring port-forward svc/kube-prom-stack-grafana 3000:80` then open `http://localhost:3000`

## Notes
- This is a PoC: single node, local PVs. For production, add HA, backups, and CSI volumes.
- DB credentials and JWT keys are generated and stored in `Secret/supabase-secrets`.
- PostgREST uses PGBouncer DSN; Auth/Realtime/Storage connect via PGBouncer.
- TLS: Let’s Encrypt via cert-manager; ensure port 80 remains open for HTTP-01.

## Next steps
- Offsite backups: add `wal-g` cronjob to push base backups to your S3 volume.
- Dashboards/alerts: import Supabase/Postgres dashboards into Grafana; configure Alertmanager.
- Security: restrict SSH to management IPs; keep MinIO console non-public.
- Scaling: this is single-node PoC; add CSI volumes and HA before production.

## GitOps + CI/CD (world-class)
- GitOps (optional): enable Flux in bootstrap by setting `ENABLE_GITOPS=true`, `GIT_URL=https://github.com/<owner>/<repo>`, `GIT_BRANCH=main`, `GIT_PATH=k8s`.
  - Flux will watch your repo and auto-apply manifests from `k8s/`.
- CI Validation: `.github/workflows/k8s-validate.yml` runs kubeconform on PRs and pushes.
- Workers Deploy (optional): `.github/workflows/workers-deploy.yml` deploys Cloudflare Workers when `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are set.
- Data sync CronJob: `k8s/supabase/data-sync.yaml` pulls JSON from GitHub raw and upserts into Supabase via REST. Configure `GIT_OWNER`, `GIT_REPO`, `GIT_BRANCH` in the manifest. Ensure target tables exist.

Recommended approach for data
- Treat `data/` in GitHub as the declarative source of truth.
- Keep an `index.json` that lists datasets and target tables, then adapt the CronJob to iterate; or wire a dedicated ETL in Actions to push to S3 and signal the cluster.
- For higher scale: replace the CronJob with a small ETL container (e.g., Dagster or custom) and use SOPS/SealedSecrets for credentials.

## Next steps
- Offsite backups: add `wal-g` cronjob to push base backups to your S3 volume.
- Dashboards/alerts: import Supabase/Postgres dashboards into Grafana; configure Alertmanager.
- Security: restrict SSH to management IPs; keep MinIO console non-public.
## Important Updates (October 2025)

These notes reflect fixes and operational guidance discovered during recent k3s boots on Hetzner. Pull the latest repo before running the bootstrap script.

### API Readiness Wait
- The bootstrap now waits for the Kubernetes API to be reachable before any Helm operations.
- It polls `kubectl version --short` and `kubectl get nodes` until success (up to 5 minutes). A 30–120s wait is normal on first boot while images pull.
- If it exceeds 5 minutes, check service health: `systemctl status k3s`, `kubectl get nodes`, and `kubectl get pods -n kube-system`.

### Helm Repositories and Updates
- Add observability chart repos early and do a full index refresh to avoid stale chart metadata:

```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

- Do not interrupt `helm repo update`; it can take a minute on fresh hosts.

### MinIO Chart: Use Valid Images
- Avoid pinning non-existent Bitnami tags. Let the chart select compatible defaults or pin only known-good versions.
- The console repository has changed: use `bitnami/minio-console` (not `minio-object-browser`).

Example `values-minio.yaml` (remove or leave tags empty to use chart defaults):

```
image:
  repository: bitnami/minio
  tag: ""

console:
  enabled: true
  image:
    repository: bitnami/minio-console
    tag: ""
```

Install or update MinIO (create the namespace if needed):

```
kubectl create namespace platform --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install minio bitnami/minio -n platform -f ./values-minio.yaml
```

If you don’t need the console UI, set `console.enabled: false`.

### PgBouncer TLS Secret Requirements
- PgBouncer mounts a TLS secret named `oaf-tls` in namespace `platform`. Create it before PgBouncer starts.

Option A (temporary): self-signed certificate

```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout oaf.key -out oaf.crt -subj "/CN=oaf.local"
kubectl create secret tls oaf-tls -n platform --cert=oaf.crt --key=oaf.key
```

Option B (preferred): cert-manager-managed certificate

Ensure cert-manager is installed and a `ClusterIssuer` (e.g., `letsencrypt-prod`) exists, then apply:

```
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: oaf-tls
  namespace: platform
spec:
  secretName: oaf-tls
  issuerRef:
    kind: ClusterIssuer
    name: letsencrypt-prod
  commonName: your.domain.example
  dnsNames:
    - your.domain.example
```

Check status and secret materialization:

```
kubectl describe certificate oaf-tls -n platform
kubectl get secret oaf-tls -n platform
```

### DNS Warning: Nameserver Limits Exceeded
- k3s/CoreDNS may log “Nameserver limits exceeded” when `/etc/resolv.conf` lists multiple IPv6/IPv4 nameservers. CoreDNS forwards to a subset; this is usually benign.
- If image pulls or external resolution fail, consider:
  - Trim resolv.conf to 1–2 reliable resolvers, or
  - Configure CoreDNS `forward` plugin to a single resolver (e.g., `1.1.1.1`).

### Run With the Updated Script
- After pulling the latest repository, run the script from the repo path (avoid stale copies under `/root`). For example:

```
sudo bash ./scripts/infra/k3s-bootstrap.sh
```

- If running on a remote host, sync or `git pull` there, then execute the script from the repository directory.

### Quick Verification Checklist
- `kubectl get nodes` shows Ready node(s).
- `kubectl get pods -A` core pods Running; ingress-nginx controller Ready.
- MinIO pods in `platform` namespace Running (no `ImagePullBackOff`).
- `kubectl get secret oaf-tls -n platform` exists before PgBouncer starts.
- `helm list -A` shows expected releases; `helm get values minio -n platform` reflects the above values.

### Troubleshooting Commands
- Events: `kubectl get events -A --sort-by=.metadata.creationTimestamp | tail -n 50`
- Pod details: `kubectl describe pod <name> -n <ns>`
- k3s logs: `journalctl -u k3s -n 200 --no-pager`