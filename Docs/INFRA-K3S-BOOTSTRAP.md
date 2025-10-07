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