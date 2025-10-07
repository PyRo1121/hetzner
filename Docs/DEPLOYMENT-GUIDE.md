# Deployment Guide: Hetzner + Supabase + k3s + Workers

This guide gives you the exact order to run the uploaded scripts, plus the commands and configuration you need for a world‑class setup on Hetzner. It includes both a simple PoC path and the k3s path with GitOps and CI/CD.

## Overview
- Provider: Hetzner Cloud (server ID `110317757`, CPX11)
- External volume: `103677941` in `us-east` (Ashburn), mounted at `/mnt/CDN`
- Domain: replace `yourdomain.com` everywhere with your real domain

## 0) DNS and rDNS
- Create `A` record: `yourdomain.com -> 178.156.192.77`
- If serving IPv6, create `AAAA` record to your IPv6 address.
- Set reverse DNS for IPv4 and IPv6 to `yourdomain.com` in Hetzner.

## 1) Hetzner provider firewall (recommended)
- Requirements: `HCLOUD_TOKEN` (Hetzner Cloud API token)
- Command (run from your workstation where the repo is checked out):
  - `HCLOUD_TOKEN=<token> SERVER_ID=110317757 bash scripts/infra/hetzner-cloud-firewall.sh`
- Options:
  - Add `IP_ALLOWLIST_SSH=<your-management-ip>/32` to lock down SSH.
  - `ALLOW_MINIO_CONSOLE=true` or `ALLOW_SUPABASE_STUDIO=true` only for private testing; keep these closed in production.

## 2) Attach, format, and mount the external volume (once)
Run on the server as `root` or with `sudo`.

- Verify device:
  - `ls -l /dev/disk/by-id | grep 103677941`
- Format (DANGER: wipes data, do once on new volume):
  - `mkfs.ext4 -F /dev/disk/by-id/scsi-0HC_Volume_103677941`
- Create mount point:
  - `mkdir -p /mnt/CDN`
- Mount:
  - `mount -o discard,defaults /dev/disk/by-id/scsi-0HC_Volume_103677941 /mnt/CDN`
- Persist across reboots (by-id):
  - `echo "/dev/disk/by-id/scsi-0HC_Volume_103677941 /mnt/CDN ext4 discard,noatime,nofail,defaults 0 0" >> /etc/fstab`
  - Test: `mount -a`
- Permissions (for local MinIO or hostPath use):
  - `mkdir -p /mnt/CDN/minio /mnt/CDN/postgres && chmod 775 /mnt/CDN/minio /mnt/CDN/postgres`

## Choose a path
You have two supported paths. Pick ONE.

### Path A: Single NVMe PoC (fastest) — Supabase + Caddy + Workers
- Copy to server:
  - `scp scripts/infra/bootstrap-supabase-workers.sh root@178.156.192.77:/root/`
- Run bootstrap:
  - `sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com bash /root/bootstrap-supabase-workers.sh`
- Optional external S3 (Cloudflare R2 in `us-east`): add
  - `S3_ENDPOINT=https://<r2-endpoint> S3_ACCESS_KEY=<key> S3_SECRET_KEY=<secret>`
- Verify:
  - `curl -I https://yourdomain.com/auth/v1/health`
  - `curl -I https://yourdomain.com/rest/v1/` (401 without token is expected)

### Path B: World‑class k3s — Supabase + PGBouncer + Observability + GitOps
- Copy to server:
  - `scp scripts/infra/k3s-bootstrap.sh root@178.156.192.77:/root/`
  - `scp -r k8s/supabase root@178.156.192.77:/root/k8s/`
- Run bootstrap (Let’s Encrypt, ingress, observability):
  - `sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com bash /root/k3s-bootstrap.sh`
- External S3 (recommended): add
  - `S3_ENDPOINT=https://<r2-endpoint> S3_ACCESS_KEY=<key> S3_SECRET_KEY=<secret>`
- Optional GitOps (Flux): add
  - `ENABLE_GITOPS=true GIT_URL=https://github.com/<owner>/<repo> GIT_BRANCH=main GIT_PATH=k8s`
- Optional: integrate Hetzner firewall during bootstrap (if token is present):
  - `HCLOUD_TOKEN=<token> SERVER_ID=110317757`
- Verify:
  - `curl -I https://yourdomain.com/auth/v1/health`
  - `kubectl -n monitoring get pods`
  - Grafana: `kubectl -n monitoring port-forward svc/kube-prom-stack-grafana 3000:80` then open `http://localhost:3000`

## 3) Data sync from GitHub (CronJob)
- Edit `k8s/supabase/data-sync.yaml` to set:
  - `GIT_OWNER`: your GitHub username or org
  - `GIT_REPO`: your repo name (e.g., `Perplexity Idea`)
  - `GIT_BRANCH`: `main`
- Ensure target table exists (example used: `gameinfo_samples`). Create via migration or SQL.
- Apply (GitOps will apply automatically if enabled), otherwise:
  - `kubectl apply -f k8s/supabase/data-sync.yaml -n platform`

## 4) CI/CD in GitHub
- K8s validation: `.github/workflows/k8s-validate.yml` runs on PR and push.
- Workers deploy (optional): `.github/workflows/workers-deploy.yml` runs if you set GitHub repo secrets:
  - `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- For an Actions‑based data push alternative, we can add a workflow that posts to Supabase REST using repo secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## 5) Backups and restores (recommended)
- Add `wal-g` CronJob to push base backups and WAL to your external S3 (`/mnt/CDN` or R2).
- Schedule restore rehearsals monthly on a throwaway branch/DB to verify integrity.

## 6) Security and hardening
- Keep MinIO console closed if using external S3; never expose service role keys.
- Restrict SSH to management IPs in provider firewall and UFW.
- If serving IPv6, enable in UFW: set `IPV6=yes` in `/etc/default/ufw`, then `ufw reload`.
- Leave port 80 open for Let’s Encrypt HTTP‑01 challenges.

## Troubleshooting
- cert-manager: check `kubectl get clusterissuer letsencrypt` and `kubectl describe certificate -n platform supabase-tls`.
- PostgREST 401: expected without token; generate JWT via Supabase client or use service role.
- Ingress 404: verify `ingress-nginx` pods are Ready and `ingress.yaml` has your domain.

## Exact commands (k3s path, with external S3)
- Copy:
  - `scp scripts/infra/k3s-bootstrap.sh root@178.156.192.77:/root/`
  - `scp -r k8s/supabase root@178.156.192.77:/root/k8s/`
- Run:
  - `sudo DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com S3_ENDPOINT=https://<r2-endpoint> S3_ACCESS_KEY=<key> S3_SECRET_KEY=<secret> ENABLE_GITOPS=true GIT_URL=https://github.com/<owner>/<repo> GIT_BRANCH=main GIT_PATH=k8s bash /root/k3s-bootstrap.sh`
- Verify:
  - `curl -I https://yourdomain.com/auth/v1/health`
  - `kubectl -n platform get svc`

---
If you share your actual domain and GitHub repo, I can generate the ready‑to‑paste command lines with your exact values and pre‑limit SSH in the Hetzner firewall to your IPs.