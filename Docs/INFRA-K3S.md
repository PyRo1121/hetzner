# Infrastructure Plan: k3s Migration and Self-Hosting Supabase

## Executive Summary

- Goal: Reduce monthly hosting costs by migrating to a lightweight Kubernetes (k3s) stack, with a path to self-hosting Supabase.
- Approach: Phase-in k3s for stateless workloads first (web, workers), keep Postgres managed or standalone initially, then evaluate self-hosting Supabase services once observability, backups, and security are in place.
- Expectation: Potential infra savings of 30–60% compared to fully managed PaaS, offset by ops time for maintenance, monitoring, and backups.

## Current Stack Assumptions

- Frontend/API: Next.js (App Router) running locally with Bun; deployed on a managed platform.
- Data: Supabase (managed), Postgres, Realtime, Auth, Storage, Edge Functions.
- Background: Workers and scripts in `scripts/` for ingest and checks.

## Proposed k3s Architecture (Small Production)

- Cluster: 2–3 small nodes (e.g., 2 vCPU, 4–8 GB RAM each).
- Ingress: Traefik (built-in for k3s) or Caddy; TLS via cert-manager + Let’s Encrypt.
- Secrets: External Secrets or SOPS; consider SealedSecrets for GitOps.
- Observability: Prometheus + Grafana; Loki for logs; Alertmanager with webhook/Discord.
- Storage: Longhorn or local-path-provisioner for PVCs; S3-compatible object store via MinIO.
- Database: Start with managed Postgres or a single-node Postgres Helm chart; only move to k8s-native Postgres when backups/DR are proven.
- CI/CD: GitHub Actions deploying manifests/Helm to the cluster; can use ArgoCD or Flux later.

## Self-Hosting Supabase: Reality Check

- Supported: Supabase services (Auth/GoTrue, PostgREST/REST, Realtime, Storage, Studio) run via Docker Compose; k8s deployment requires custom charts or community deployments.
- Constraints: Running Postgres in k8s is doable but requires careful persistence, WAL archiving, and backups. Consider a managed Postgres or a dedicated VM until k8s ops maturity.
- Edge Functions: Supabase Edge Functions (Deno) can be run via CLI; k8s support is not officially standardized. Consider deferring or replacing with server routes until maturity.

## Phased Migration Plan

- Phase 0: Cost Modeling and Readiness
  - Compare current spend vs k3s (compute, storage, bandwidth, backups, ops time).
  - Define SLOs: API p95 < 400ms, uptime ≥ 99.5%, RPO ≤ 24h, RTO ≤ 2h.
  - Acceptance: Plan approved; budget for monitoring and backups locked.

- Phase 1: k3s Pilot (Stateless)
  - Deploy web/API container(s) on k3s behind Traefik with TLS.
  - Keep Supabase managed; connect via env vars.
  - Add Prometheus/Grafana/Loki, dashboards and alerts.
  - Acceptance: Traffic-serves reliably for 2 weeks; p95 < 400ms; no alert fatigue.

- Phase 2: Workers and Cron
  - Containerize scripts in `scripts/` as Jobs/CronJobs (ingest, checks).
  - Ensure rate limiting and backoff patterns.
  - Acceptance: All jobs monitored; failure alerts and retry logic verified.

- Phase 3: Storage and Object Store
  - Add MinIO for S3-compatible storage if needed (avatars, exports); evaluate cost vs CDN.
  - Acceptance: Upload/download throughput okay; durability verified via multi-replica.

- Phase 4: Postgres Strategy
  - Option A: Managed Postgres (lower ops burden) + k3s for app services.
  - Option B: Self-host Postgres outside k3s on a dedicated VM (better control).
  - Option C: Postgres in k3s with operator (higher ops complexity, requires strong backup/DR).
  - Acceptance: Nightly backups + PITR; restore rehearsal completed.

- Phase 5: Supabase Services Self-Host (Optional)
  - Migrate GoTrue, PostgREST, Realtime, Storage to cluster.
  - Map RLS policies and auth tokens; validate Studio access.
  - Acceptance: Full parity with managed; performance within 10%; no security regressions.

## Cost Model (Indicative)

- Managed today: App hosting + Supabase monthly tier.
- k3s baseline:
  - Nodes: 2× small VMs (2 vCPU/4–8 GB RAM) + 1× small VM for DB if external.
  - Storage: Block volumes (100–300 GB) + snapshot costs.
  - Bandwidth: Provider egress fees (varies, often included up to a cap).
- Savings drivers:
  - Consolidation of app hosting into commodity VMs.
  - Avoiding managed tier markups; but offset by ops time.
- Hidden costs:
  - On-call and maintenance, security patching, monitoring stack overhead.

## Risks and Mitigations

- Database Durability: High risk if Postgres in k8s without robust PVC and backups.
  - Mitigation: Start with managed or VM Postgres; implement WAL archiving; test restores.
- Security/RBAC: Misconfigurations can expose services.
  - Mitigation: NetworkPolicies; strict ingress; secrets scanning; regular audits.
- Observability Gaps: Without good telemetry, issues go unseen.
  - Mitigation: Prom/Grafana/Loki baseline; SLO dashboards and alert thresholds.
- Migration Drift: RLS and auth differences between managed and self-host.
  - Mitigation: Document policies; CI checks; staging rehearsals.
- Team Bandwidth: Ops burden may offset cost savings.
  - Mitigation: Automate with Helm/GitOps; keep scope tight; review quarterly.

## Backups and DR

- Postgres: Nightly full backups + PITR (WAL), encrypted, offsite.
- Object Store: Versioned buckets; lifecycle policies.
- Manifests: Infra-as-code; restore scripts for cluster.
- DR Drill: Quarterly restore rehearsal with time-bound RTO.

## Implementation Notes

- Ingress/TLS: cert-manager Issuer with DNS or HTTP-01 challenge.
- Secrets: Use SOPS or External Secrets with cloud secret backend.
- Deployment: Multi-stage Dockerfile for Bun/Next.js; health checks and readiness probes.
- CI: Lint manifests; dry-run apply; canary rollout with small percentage traffic.

## Suggested Next Steps

- Create a sandbox k3s cluster and deploy the web/API only; keep Supabase managed.
- Add monitoring and alerts; confirm SLOs for latency and uptime.
- Decide Postgres strategy (managed vs VM vs k8s operator) based on risk tolerance.
- If stable and cost-effective after 4–6 weeks, evaluate migrating Supabase services.

## Acceptance Gates

- Pilot passes with p95 < 400ms and ≥ 99.5% uptime for 2 weeks.
- Backups/restore rehearsals succeed within RTO and RPO targets.
- Security audits show no critical misconfigurations.