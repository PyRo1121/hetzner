# Project Roadmap and Competitive Strategy

## Executive Summary
- Build the definitive Albion Online intelligence platform that unifies trading, PvP analytics, guild operations, and navigation.
- Differentiate on verified data quality, integrated workflows, and performance: sub‑minute market latency, end‑to‑end PvP event linkage, and guild regear automation.
- Monetize with a freemium core and pro features for high‑intent traders, shot‑callers, and guilds.

## Competitive Landscape (Research Oct 2025)
- Albion Free Market (AFM) — market suite and flipper
  - Features: market prices, crafting/refining calculators, farming tools, trade routes, interactive map with pathfinding, black market flipper, meta builds, PvP tracker, tutorials.
  - Notes: premium gate for flipper; heavy reliance on AODP; strong UX and multi‑tool coverage.
  - Source: https://albionfreemarket.com/ and Crafting calculator page https://albionfreemarket.com/crafting
- Albion Online Data Project (AODP) — market data backbone
  - Features: crowdsourced market orders and gold prices via client; NATS topics for ingest/deduped streams; daily table dumps per region.
  - Limitations: coverage depends on player scans; no order completion events; data deduped but age/visibility issues remain.
  - Source: https://www.albion-online-data.com/
- Albion Online 2D (AO2D) — items, prices, merged killboard sections
  - Features: item pages with multi‑city prices; merged with Murder Ledger for EU/Asia; uses AODP for prices.
  - Limitations: Cloudflare‑gated pages; relies on crowdsourced price updates.
  - Source: Example item page (Cloudflare): https://albiononline2d.com/en/item
- Murder Ledger — killboard analytics and Twitch linking
  - Features: fast, searchable kill/death history; daily event throughput 120k–150k; Kafka pipeline; links events to Twitch VODs by player mapping.
  - Limitations: depends on official killboard recency; outages impact availability; manual Twitch linking needed.
  - Source: Architecture write‑up: https://findley.dev/projects/albion-stats/
- Albion Online Tools (AOT) — multi‑feature portal and Discord bot
  - Features: market prices, player/guild stats, guides, refining/cooking/butcher calculators, killboard favorites, Top PvP kills, ZvZ battles; Discord bot with notifications, multi‑language.
  - Limitations: breadth over depth; pro‑grade trading/PvP intelligence less rigorous; relies on external data.
  - Sources: https://albiononlinetools.com/ and bot page https://albiononlinetools.com/bot.php
- Albion Profit Calculator — focused calculators
  - Features: trees for profit flows (refining, transmuting, food/potions, artifacts), transport beta.
  - Limitations: narrow scope; minimal integration.
  - Source: https://albion-profit-calculator.com/
- Tools4Albion — legacy calculators
  - Features: crafting cook/potion calculator; price averaging; station fees, return rates.
  - Limitations: limited categories; older UX; niche utility.
  - Source: https://www.tools4albion.com/crafting.php
- ROAMapp — world zone search
  - Features: instant zone search; metadata across 800+ zones; useful for planning.
  - Limitations: not route optimization; data freshness varies.
  - Source: https://albionroamapp.com/search
- Community bots and regear automation
  - Features: kill/death notifications; guild member management; regear workflow; blacklist; events/templates.
  - Limitations: fragmentation; reliability varies; limited data verification.
  - Sources: Discord bot listings and community posts (examples):
    - Albion Guild Manager bot features: https://top.gg/bot/1058620006390317076
    - Killboard scanner community bots: https://www.reddit.com/r/albiononline/comments/6u5hc1/show_killboard_scanner_that_sends_guild_kills/

## Gap Analysis and Opportunities
- Verified market data and anomaly checks
  - Combine AODP with optional private collectors and our users’ scan telemetry; apply statistical anomaly detection to flag stale/implausible orders.
  - Track order “seen last” with decay models and confidence scoring to reduce ghost flips.
- End‑to‑end PvP intelligence
  - Weapon matchup matrices, time‑of‑day heatmaps, zone risk indices; automated Twitch VOD linking when consented; Elo‑style player/guild ratings.
- Black Market flipping with private datasets
  - Private flip queues per user; upgrade/quality flips with tax/fee modeling; logistics planning vs risk exposure.
- Guild operations suite
  - Discord‑native regear flows, ledger entries, itemized payouts; attendance and roles; blacklist/verifications; campaign planning with build bundles.
- Route planning and safety modeling
  - Weighted pathfinding including zone types and recent kill density; travel time estimates; portal preference rules; convoy planning.
- Crafting/refining/farming integrated calculators
  - Spec‑aware returns, focus efficiency, station fees, food bonuses; shopping lists by city and weight.
- Data integrity and resilience
  - Outage backfills; multi‑region replication; latency SLOs; graceful degradation when API/AODP issues occur.

## Competitive Benchmarks (Targets)
- Market data latency: < 60 seconds median from user scan to availability; < 5 minutes worst‑case with AODP only.
- Price confidence score: 0–100 scale, require ≥ 70 for public flip recommendations; include freshness and city coverage metrics.
- Kill event ingestion: ≥ 200k/day capacity; duplicate suppression; 99.95% uptime for event API.
- Route planner performance: compute routes in < 150 ms P95; live risk overlay refresh < 1 s.
- Page performance: LCP < 1.8 s; TTI < 2.5 s on mid‑range devices; Core Web Vitals green.
- API reliability: 99.95% monthly uptime; p99 response < 500 ms; graceful degradation when upstreams fail.
- Flip ROI accuracy: < 3% mean absolute error after fees/taxes across test set; false‑positive rate < 5% under high contention.

## 6–12 Month Plan
- Q4 2025
  - Finish backend consolidation (Supabase clients, realtime utilities, admin routes) [Completed].
  - Release Market Overview v2 with price confidence scores and anomaly flags.
  - Ship PvP Meta Builds v2 with live KDR, weapon matchup matrices.
  - Launch basic Route Finder with zone weights and summary stats.
- Q1 2026
  - Black Market Flipper v1: safe flips (Caerleon only), private flips, upgrade/quality modeling.
  - Guild Ops v1: regear requests, payouts ledger, Discord integration; basic member tracking.
  - Crafting/Refining/Farming calculators v1: spec‑aware returns, shopping lists by city/weight.
- Q2 2026
  - PvP Intelligence v2: kill heatmaps, Elo ratings, automated Twitch VOD linking (opt‑in).
  - Route Safety v2: kill density overlays, convoy planning, portal rule sets.
  - Trade Routes Analyzer v1: 7‑day profitability scans, logistics constraints, weight planning.
- Q3 2026
  - Pro tier: bulk API access, custom alerts, team workspaces.
  - Analytics exports: CSV/JSON; webhook alerts; org dashboards for guilds.

## Data Strategy
- Sources
  - AODP streams (marketorders.deduped, goldprices.deduped, markethistories.deduped).
  - User telemetry from in‑game market scans (opt‑in), logged with timestamps and city context.
  - Official killboard recency endpoints; backfill windows; Kafka queue for resilience.
- Integrity
  - Deduplication window checks; age decay; cross‑city coherence tests; outlier removal; variance tracking per item.
- Privacy
  - Opt‑in for private flips; anonymized aggregates; clear data deletion and export tools.

## Monetization and Community
- Freemium
  - Market overview, route finder basic, PvP meta dashboard, calculators, limited alerts.
- Pro
  - Black market flipper advanced, private flip queues, guild ops suite, bulk exports, advanced analytics, higher API rate limits.
- Community
  - Public guides and tutorials; contributor credits; Discord support; opt‑in Twitch linking program for creators.

## Risks and Mitigations
- Upstream outages (official API/AODP)
  - Mitigation: backfills, cached snapshots, graceful degradation, status pages, user messaging.
- Data quality variance
  - Mitigation: confidence scoring, anomaly detection, multi‑source blending, clear freshness indicators.
- Security and compliance
  - Mitigation: scoped keys, RLS, audit logs, rate limiting, data deletion/export.

## Implementation Status (Oct 2025)
- Backend consolidation
  - Centralized Supabase clients `src/backend/supabase/clients.ts`; backend entry `src/backend/index.ts`; realtime utilities `src/backend/realtime.ts`.
  - Deprecated `src/lib/backend/index.ts` forwards to `@/backend`.
  - Refactors applied across API routes, services, and server components.
  - Dev preview stable; recommend terminal checks for warnings.

## Competitive References
- AFM overview and features: https://albionfreemarket.com/
- AFM crafting calculator: https://albionfreemarket.com/crafting
- AFM black market flipper: https://albionfreemarket.com/flipper and tutorial: https://albionfreemarket.com/articles/view/albion-online-black-market-flipper-tutorial
- AODP developer info and streams: https://www.albion-online-data.com/
- AO2D item prices (AODP sourced): https://albiononline2d.com/en/item
- Murder Ledger architecture and Twitch linking: https://findley.dev/projects/albion-stats/
- Albion Online Tools portal: https://albiononlinetools.com/ and bot: https://albiononlinetools.com/bot.php
- Profit calculators: https://albion-profit-calculator.com/ and legacy tools: https://www.tools4albion.com/crafting.php
- ROAMapp zone search: https://albionroamapp.com/search
- Guild management bot example: https://top.gg/bot/1058620006390317076
- Community killboard bots: https://www.reddit.com/r/albiononline/comments/6u5hc1/show_killboard_scanner_that_sends_guild_kills/

## Success Metrics
- Outperform AFM/AO2D on:
  - Data freshness and confidence transparency; lower false‑positive flips.
  - Integrated guild ops and PvP analytics with creator‑friendly VOD indexing.
  - Pathfinding with safety modeling and actionable summaries.
- Achieve and maintain:
  - 99.95% API uptime; p99 < 500 ms.
  - LCP < 1.8 s; TTI < 2.5 s across core pages.
  - Kill event processing ≥ 200k/day with resilient backfills.

## Feature Comparison Matrix

| Feature | AFM | AO2D | Murder Ledger | AOT | Our Platform |
|---|---|---|---|---|---|
| Market prices (multi‑city) | ✓ | ✓ | ✗ | ✓ | ✓ + confidence |
| Crafting/refining calculators | ✓ | ~ | ✗ | ✓ | ✓ spec‑aware |
| Farming/breeding tools | ✓ | ✗ | ✗ | ~ | ✓ roadmap |
| Black Market flipper | ✓ (premium) | ✗ | ✗ | ✗ | ✓ with confidence |
| Trade route finder | ✓ | ✗ | ✗ | ~ | ✓ risk‑aware |
| Interactive map/pathfinding | ✓ | ✗ | ✗ | ✗ | ✓ weighted + risk |
| PvP killboard analytics | ~ | ~ | ✓ | ✓ | ✓ end‑to‑end |
| Twitch VOD linking | ✗ | ~ | ✓ | ✗ | ✓ opt‑in automated |
| Guild ops (regear/ledger) | ✗ | ✗ | ✗ | ~ (bot) | ✓ Discord‑native |
| Confidence scoring & anomalies | ✗ | ✗ | ✗ | ✗ | ✓ transparent |
| Pro tier (private flips/alerts/API) | ✓ | ✗ | ✗ | ✗ | ✓ |

Legend: ✓ supported, ~ partial/limited, ✗ not supported.

## Technical Appendices

### Confidence Scoring Schema (Draft)
```json
{
  "item_id": "T6_MAIN_SWORD",
  "city": "Caerleon",
  "last_seen_at": "2025-10-06T12:34:56Z",
  "seen_count": 42,
  "sources": ["AODP", "private_scan"],
  "freshness_seconds": 75,
  "city_coverage": 6,
  "variance": 0.12,
  "outlier_score": 0.08,
  "confidence": 81,
  "notes": "Confidence >= 70 required for public flips",
  "version": "1.0"
}
```

Scoring components
- Freshness decay (recent observations weighted higher).
- City coverage (breadth across cities increases confidence).
- Variance and outlier suppression (robust stats to reduce ghost data).
- Source weighting (private scans > AODP when both present, configurable).

### Flip ROI Model (Outline)
- Revenue: `sell_price * quantity * (1 - market_tax)`.
- Costs: `buy_price + station_fee + transport_cost + upgrade_cost`.
- Risk premium: `expected_loss = probability_of_failure * loss_amount`.
- ROI: `(Revenue - Costs - expected_loss) / Costs`.
- Constraints: min confidence threshold, max transport weight, city availability.

## Validation & Test Mapping
- Market latency and confidence
  - Map to `scripts/check-market-prices.ts` and `src/hooks/use-market-prices.ts` instrumentation.
  - Add synthetic streams to validate median < 60s; expose `confidence` in API responses.
- Flipper ROI accuracy
  - Map to `tests/trading/arbitrage.test.ts` and `tests/trading/monte-carlo.test.ts`.
  - Add fixtures to measure MAE < 3% under typical scenarios.
- PvP ingest and analytics
  - Map to `supabase/functions/sync-pvp-data` and `tests/pvp-system.test.ts`.
  - Add duplicate suppression checks and throughput benchmarks.
- Routing performance
  - Map to `src/components/widgets/*` and `src/lib/analysis` graph builder.
  - Benchmark P95 < 150 ms and overlay refresh < 1 s.
- Web performance
  - Lighthouse CI integration; monitor `src/app/*` core pages. Targets: LCP < 1.8 s; TTI < 2.5 s.
- API reliability
  - k6 load tests against `src/app/api/*`; verify p99 < 500 ms, graceful fallbacks.

## Ops & SLOs
- Status page and incident response
  - Publish latency, uptime, and freshness indicators; outage notices and ETAs.
- Alerting
  - Thresholds for ingest lag, API p99 spikes, confidence drop per item category.
- Runbooks
  - Kafka backfills, AODP outage handling, Supabase failover, cache warm strategies.

## Infrastructure Plan
- Hosting Strategy
  - Evaluate k3s migration to reduce hosting costs while maintaining SLOs.
  - Phased approach: move stateless services first; keep Postgres managed initially.
- Self-Hosting Supabase
  - Optional later phase after observability, backups, and security baselines.
  - Validate parity for Auth, REST, Realtime, and Storage before cutover.
- Reference
  - See `Docs/INFRA-K3S.md` for detailed phased plan, cost model, risks, and acceptance gates.

## Supabase Self‑Hosting with Workers (PoC)

Overview
- Goal: Stand up a cost‑effective, restartable (0 data) Supabase stack on a single NVMe server and use Cloudflare Workers for serverless compute, while keeping a path to k3s for scale.
- Priorities: Low monthly cost, clear backups, safe secrets, and acceptable latency (p95 < 400 ms) for core flows.

Architecture (Textual)
- Compute: Cloudflare Workers for API glue and scheduled jobs (CRON), using `@supabase/supabase-js` v2 over HTTP.
- Data: Self‑hosted Supabase services via Docker Compose (Postgres + PostgREST + Auth/GoTrue + Realtime + Storage + Studio).
- Storage: MinIO (S3‑compatible) on the same host for Supabase Storage buckets; CDN optional.
- Backups: WAL archival to MinIO and offsite snapshot (weekly) for DR.
- Secrets: Cloudflare Worker secrets (environment bindings) + host `.env` for Supabase services.

Step‑by‑Step Setup
1) Provision NVMe host (cost‑effective)
- Example: Hetzner AX41‑NVMe or OVH/SoYouStart NVMe instance (≥ 8 vCPU, 32–64 GB RAM, 2× NVMe SSD, Ubuntu 22.04 LTS).
- Create a dedicated data volume/partition for Postgres (`ext4` or `xfs`) and separate volume for MinIO data.

2) Install Docker and Compose
- `curl -fsSL https://get.docker.com | sh`
- `sudo usermod -aG docker $USER && newgrp docker`
- `sudo apt install docker-compose-plugin`

3) Fetch Supabase self‑hosted stack
- `git clone https://github.com/supabase/supabase` (or use the self‑hosting compose from the Supabase repo)
- Copy compose files and `.env.example` to `/opt/supabase/`.

4) Configure environment
- Create `/opt/supabase/.env` (example minimal)
```
SUPABASE_URL=http://your-public-domain
JWT_SECRET=change_me_long_random
POSTGRES_PASSWORD=strong_password
ANON_KEY=generated_anon_jwt
SERVICE_ROLE_KEY=generated_service_role_jwt
STORAGE_S3_ENDPOINT=http://localhost:9000
STORAGE_S3_ACCESS_KEY=minio_access
STORAGE_S3_SECRET_KEY=minio_secret
SMTP_HOST=smtp.example.com
SMTP_USER=supabase@example.com
SMTP_PASS=app_password
``` 
- Ensure DNS + TLS (Caddy/Traefik + cert‑manager or standalone Caddy) terminate to the Supabase services that need public exposure (PostgREST, Auth, Studio optional).

5) Start services
- From `/opt/supabase`: `docker compose up -d`
- Verify health: PostgREST on `/rest/v1/`, Auth on `/auth/v1/`, Realtime on `/realtime/v1/`, Storage on `/storage/v1/`.

6) Configure MinIO
- `docker run -d -p 9000:9000 -p 9001:9001 --name minio -e MINIO_ROOT_USER=minio_access -e MINIO_ROOT_PASSWORD=minio_secret -v /data/minio:/data minio/minio server /data --console-address :9001`
- Create buckets for Supabase Storage; enable versioning if needed; set public/private policies via Supabase.

7) Postgres tuning for NVMe (baseline)
- `shared_buffers = 25% RAM`
- `effective_cache_size = 60% RAM`
- `wal_level = replica`
- `max_wal_size = 4GB`
- `checkpoint_timeout = 15min`
- `wal_compression = on`
- `random_page_cost = 1.0` (NVMe)
- `effective_io_concurrency = 200` (NVMe)
- `work_mem = 16MB` (adjust per workload)
- `maintenance_work_mem = 1GB`
- Consider `synchronous_commit = off` for non‑critical writes in PoC.

8) Backups & DR (PoC)
- Nightly `pg_basebackup` or `wal-g` to MinIO bucket; weekly offsite copy (another provider or S3).
- Quarterly restore rehearsal: recreate DB from base + WAL; document RTO/RPO.

Workers Integration (Cloudflare)
- Create a Worker; add secrets:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY` (client context with RLS)
  - `SUPABASE_SERVICE_ROLE_KEY` (server‑side only; never expose to browsers)
- Read example (Workers runtime):
```js
import { createClient } from '@supabase/supabase-js';

export default {
  async fetch(req, env) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase
      .from('items')
      .select('id,name,price')
      .limit(50);
    return new Response(JSON.stringify({ data, error }), {
      headers: { 'content-type': 'application/json' },
    });
  },
};
```
- Write example (server‑side with service role; consider IP allowlist):
```js
import { createClient } from '@supabase/supabase-js';

export default {
  async fetch(req, env) {
    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const input = await req.json();
    const { error } = await supabaseAdmin.from('ledger').insert(input);
    if (error) return new Response(JSON.stringify({ error }), { status: 400 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  },
};
```
- Caching and rate limiting:
  - Use `caches.default` with short TTL for public reads; implement simple token bucket per IP in Durable Objects or KV.
  - Prefer RLS + anon key for client reads; reserve service role for server routes only.

Configuration Guidelines
- PostgREST
  - Restrict exposed schemas; configure `db-pool` size (start with `50`), enable gzip, set `jwt-secret` and default `role`.
  - Use RPCs for complex joins to avoid N+1; materialized views for hot queries.
- Auth (GoTrue)
  - Enforce email confirmations; rotate JWT secrets periodically; set sensible token expiry and refresh.
- Realtime
  - Scope channels to tables actually needed; prefer presence off in PoC; scale later.
- Storage
  - Buckets: public vs private with signed URLs; attach CDN if needed; lifecycle policies for retention.
- Observability
  - Enable structured logs; ship logs to Loki; set health endpoints and uptime checks.

Optimization Tips (PoC‑friendly)
- Index common filters and joins (e.g., `city`, `item_id`, `timestamp`) and verify via `EXPLAIN ANALYZE`.
- Prefer `select` with explicit columns; enable gzip/br at the proxy; HTTP/2/3 with keep‑alive.
- Apply PGBouncer for connection pooling if Worker burst traffic spikes; tune pool sizes around PostgREST.
- Use RLS aggressively to avoid server secrets in client paths; service role only in Workers.
- Precompute ROI/confidence in materialized views updated on schedule to reduce live compute.

Cost‑Effective Patterns
- Single NVMe host for all services (PoC) to minimize spend; accept single‑host risk.
- MinIO on same host; offsite snapshot weekly; monitor disk health (SMART).
- Cloudflare Workers free tier for low volume; move heavy jobs to Cron Triggers with backoff.

Scalability Path
- Add read replica (VM or managed) and point analytical queries to replica.
- Migrate services into k3s as maturity grows (see `INFRA-K3S.md`); keep Postgres on dedicated VM.
- Add CDN in front of public assets and Storage if bandwidth grows.

Acceptance Gates (Self‑host + Workers)
- p95 API (Workers → PostgREST) < 400 ms under smoke load; uptime ≥ 99.5% for a 2‑week pilot.
- Backup restore rehearsal succeeds within defined RTO/RPO; secrets management validated.
- No exposure of service role key to browsers; RLS rules verified against tests.

Roadmap Change Log (Oct 2025)
- Added “Supabase Self‑Hosting with Workers (PoC)” section with setup, configuration, optimization, and cost‑saving guidance.

## Data Governance
- RLS policies and scoped keys for user data.
- Audit logs for guild ops and private flips.
- Data export and deletion tooling; anonymized aggregates by default.

## Community & Partnerships
- Creator program with opt‑in VOD linking and featured analytics.
- Contributor credits for private scan telemetry.
- Discord support, tutorials, and regular roadmap updates.

## Milestone Acceptance Criteria
- Market Overview v2 (Q4 2025)
  - Confidence score surfaced on price cards and API responses.
  - Latency median < 60s from ingest to UI; freshness indicator on items.
  - Anomaly flags shown for outliers; opt‑in details panel explains confidence.
- PvP Meta v2 (Q4 2025)
  - Live KDR and matchup matrix by weapon line; 7‑day and 30‑day windows.
  - Zone/type filters; export CSV; p95 query < 300 ms.
- Route Finder Basic (Q4 2025)
  - Weighted zone routing (blue/yellow/red/black); summary stats (ETA, distance, zone breakdown).
  - P95 route compute < 150 ms; overlays refresh < 1 s.
- Black Market Flipper v1 (Q1 2026)
  - Safe flips for Caerleon; confidence ≥ 70; ROI MAE < 3% in tests.
  - Private flip queues and watchlists; alerts with rate limits.
- Guild Ops v1 (Q1 2026)
  - Discord regear request flow; payouts ledger; role/permission model.
  - Audit logs on all ledger writes; export JSON/CSV.
- Calculators v1 (Q1 2026)
  - Spec‑aware returns; station fees; shopping lists by city/weight.
  - Deterministic calculations with unit tests; variance documented.

## Pricing & Tiers (Draft)
- Free
  - Market overview, meta builds, basic routes, calculators.
  - API: 60 req/min, no bulk exports, basic alerts.
- Pro
  - Advanced flipper, private queues, guild ops suite, risk overlays.
  - API: 240 req/min, bulk exports/webhooks, custom alerts, team workspaces.
- Enterprise (optional)
  - SSO, custom SLAs, dedicated support, higher limits.

## API Examples (Sketch)
- GET `/api/market/prices?itemId=T6_MAIN_SWORD&city=Caerleon`
```json
{
  "itemId": "T6_MAIN_SWORD",
  "city": "Caerleon",
  "buy": 152000,
  "sell": 168500,
  "lastSeen": "2025-10-06T12:34:56Z",
  "confidence": 81,
  "sources": ["AODP", "private_scan"],
  "anomalies": ["variance_high"],
  "freshnessSeconds": 75
}
```
- GET `/api/flips/suggestions?city=Caerleon&minConfidence=70`
```json
{
  "suggestions": [
    {
      "itemId": "T7_BROADSWORD",
      "buy": 410000,
      "sell": 468000,
      "roi": 0.11,
      "confidence": 78,
      "constraints": { "weight": 12.5, "tax": 0.065 }
    }
  ]
}
```
- GET `/api/pvp/matchups?weapon=T6_MAIN_SWORD&window=7d`
```json
{
  "weapon": "T6_MAIN_SWORD",
  "window": "7d",
  "matchups": [
    { "vs": "T6_SPEAR", "wins": 812, "losses": 705, "winRate": 0.535 }
  ]
}
```
- POST `/api/guilds/regear`
```json
{
  "guildId": "GUILD_123",
  "memberId": "PLAYER_456",
  "items": [ { "id": "T6_PLATE_ARMOR", "qty": 1 } ],
  "reason": "ZvZ loss",
  "fightId": "KILL_789"
}
```

## Data Freshness Indicators (UI Spec)
- Display relative age (e.g., "1m 15s ago") on price cells with color scale.
- Confidence badge (0–100) with tooltip explaining factors and sources.
- Anomaly icon for outliers; click opens details with variance and coverage.
- Route pages show last risk overlay update timestamp and data source.

## Measurement & Analytics
- Instrument Web Vitals: LCP, FID, CLS; send to analytics backend.
- Track ingest → availability lag per item/city; weekly latency reports.
- Sentry traces on API route p95/p99; alert on threshold breaches.
- Release checklists with automated Lighthouse and k6 runs.

## Risk Register (Expanded)
- AODP coverage gaps
  - Probability: medium; Impact: medium‑high.
  - Response: private scans, confidence decay, user messaging.
- Official killboard outages
  - Probability: low‑medium; Impact: medium.
  - Response: backfills, cache snapshots, degraded mode.
- Discord integration limits/changes
  - Probability: medium; Impact: medium.
  - Response: maintain fallbacks, clear permissions, audit logs.
- Model drift on ROI and confidence
  - Probability: medium; Impact: medium.
  - Response: periodic re‑evaluation, shadow testing, thresholds.

## Governance & Compliance (Expanded)
- Retention policies for telemetry and guild ledger data; defaults to minimal necessary.
- Anonymization pipelines for aggregates; opt‑out and deletion workflows.
- Periodic access reviews; scoped tokens and per‑feature rate limits.

## Release Plan
- Beta 1 (internal)
  - Scope: Market v2 confidence, PvP meta v2, Route Finder basic.
  - Gates: Latency < 60s median; LCP < 1.8 s; core flows stable; instrumentation in place.
  - Feedback: internal test notes; issue triage; KPI review.
- Beta 2 (private cohort)
  - Scope: Flipper v1 (Caerleon), calculators v1, confidence badges in UI.
  - Gates: ROI MAE < 3% on test fixtures; false‑positive flips < 5%.
  - Feedback: cohort interviews; telemetry opt‑in; pricing sensitivity.
- Public v1
  - Scope: Guild Ops v1, risk overlays v2, pro tier launch.
  - Gates: API p99 < 500 ms; 99.95% uptime; audit logs active.
  - Feedback: public roadmap; status page; community Discord support.

## Architecture Overview (Textual)
- Ingest
  - Market: AODP streams and optional private scans → parser → dedupe → freshness/variance scoring.
  - PvP: official killboard endpoints → queue (Kafka) → duplicate suppression → aggregation windows.
- Storage & Processing
  - Supabase/Postgres for canonical data; materialized views for confidence, ROI, and matchups.
  - Background workers for backfills and overlays; caches for route graph and risk density.
- API & Edge Functions
  - Next.js route handlers under `src/app/api/*`; Supabase Edge Functions for sync and Discord flows.
- UI
  - React components and hooks under `src/components/*` and `src/hooks/*` with freshness/confidence UI.
- Observability
  - Sentry traces; Web Vitals; KPI dashboards for latency and uptime; status page.

## Observability & Dashboards
- Metrics
  - Ingest lag (per item/city), API p95/p99 per route, event throughput/day, route compute P95.
- Logs
  - Structured logs on dedupe decisions, anomaly flags, guild ledger writes.
- Traces
  - End‑to‑end traces from ingest → process → API → UI render.
- Dashboards
  - Latency/freshness; ROI accuracy; uptime; route performance; error budgets.

## Security & RBAC
- RBAC roles: user, pro, guild‑member, guild‑officer, admin.
- Scopes for API tokens by feature (market, flips, pvp, guilds).
- RLS policies for guild data; audit logs on ledger and permissions changes.
- Rate limits per tier; anomaly alerts for suspicious usage.

## Migration Tasks
- Remove `@/lib/backend` shim and forwards; consolidate imports to `@/backend`.
- Update affected services/components, confirm API route imports resolved.
- Run integration and e2e tests: `tests/e2e/*`, `tests/api-integration.test.ts`.
- Scan dev server logs for warnings during preview.

## Benchmarking Protocol
- Data freshness
  - Sample 50 high‑volume items across all cities; record age and coverage hourly for 7 days.
  - Report median/95th percentiles; compare against AFM/AO2D visible freshness indicators.
- Flip ROI
  - Backtest on historical prices; measure MAE and false‑positive rates; segment by item tier and city.
- PvP analytics
  - Validate matchup matrices against manual samples; assess stability across windows.
- Routing
  - Benchmark compute times and overlay refresh under varied weights; test portal rules.

## Glossary
- AODP: Albion Online Data Project market data streams and dumps.
- Confidence: 0–100 trust score combining freshness, coverage, variance, and source weighting.
- MAE: Mean Absolute Error for ROI accuracy vs realized.
- KDR: Kill/Death Ratio; matchup matrices compare weapon lines.
- P95/P99: 95th/99th percentile performance metrics.
- RLS: Row‑Level Security in Postgres/Supabase.

## FAQ
- Why introduce confidence scores?
  - To reduce false flips and stale price reliance; builds trust via transparency.
- How do you handle AODP outages?
  - Cached snapshots, backfills, degraded modes, and user messaging via status page.
- Will private scans leak my strategy?
  - No; opt‑in, anonymized aggregates, and clear deletion/export tools.
- Can guild ops be used without Discord?
  - Yes; Discord provides automation, but core ledger and roles work via web.

## Core Data Models (Sketch)
- MarketPrice
```json
{
  "itemId": "T6_MAIN_SWORD",
  "city": "Caerleon",
  "buy": 152000,
  "sell": 168500,
  "lastSeen": "2025-10-06T12:34:56Z",
  "confidence": 81,
  "sources": ["AODP", "private_scan"],
  "anomalies": ["variance_high"],
  "freshnessSeconds": 75
}
```
- FlipSuggestion
```json
{
  "itemId": "T7_BROADSWORD",
  "city": "Caerleon",
  "buy": 410000,
  "sell": 468000,
  "roi": 0.11,
  "confidence": 78,
  "constraints": { "weight": 12.5, "tax": 0.065, "minConfidence": 70 },
  "explanation": "ROI meets threshold under current fees and confidence."
}
```
- PvPEvent (normalized)
```json
{
  "id": "KILL_789",
  "timestamp": "2025-10-06T13:01:22Z",
  "killer": { "id": "PLAYER_123", "guildId": "GUILD_42", "weapon": "T6_MAIN_SWORD" },
  "victim": { "id": "PLAYER_456", "guildId": "GUILD_77", "weapon": "T6_SPEAR" },
  "zone": "RedZone_A",
  "lootValue": 185000,
  "sources": ["official_killboard"],
  "twitch": { "vodUrl": null, "creatorOptIn": false }
}
```
- GuildLedgerEntry
```json
{
  "id": "LEDGER_001",
  "guildId": "GUILD_123",
  "memberId": "PLAYER_456",
  "type": "regear",
  "items": [ { "id": "T6_PLATE_ARMOR", "qty": 1 } ],
  "reason": "ZvZ loss",
  "fightId": "KILL_789",
  "createdAt": "2025-10-06T14:11:00Z",
  "audit": { "actor": "OFFICER_321", "ip": "x.x.x.x" }
}
```
- RoutePlan
```json
{
  "from": "Martlock",
  "to": "Caerleon",
  "weights": { "blue": 1, "yellow": 1.2, "red": 1.6, "black": 2.0 },
  "etaMinutes": 9.5,
  "distance": 13.2,
  "zoneBreakdown": { "blue": 3, "yellow": 2, "red": 1, "black": 0 },
  "lastRiskUpdate": "2025-10-06T14:10:00Z"
}
```

## API Error Codes and Rate Limits (Draft)
- Rate limits
  - Free: `60 req/min`, burst `120`, fair use policies apply.
  - Pro: `240 req/min`, burst `480`, bulk exports and webhooks enabled.
- Error codes
  - `ERR_RATE_LIMIT_EXCEEDED` (429): include `retryAfter` seconds.
  - `ERR_CONFIDENCE_TOO_LOW` (422): include `requiredMinConfidence` and `actualConfidence`.
  - `ERR_UPSTREAM_OUTAGE` (503): AODP/killboard outage; degraded mode active.
  - `ERR_INVALID_PARAMS` (400): schema validation failure; include `field` and `reason`.
  - `ERR_NOT_AUTHORIZED` (401/403): missing/insufficient scope; include `requiredScopes`.

## Feature KPIs by Module
- Market
  - Median latency < 60s; freshness displayed; anomaly flags accuracy > 90%.
  - Confidence distribution tracked; min confidence for flips ≥ 70.
- Flipper
  - ROI MAE < 3%; false‑positive flips < 5% under contention; alert precision targets.
- PvP
  - Ingest ≥ 200k/day capacity; duplicate suppression rate > 99%; matchup stability.
- Route
  - Compute P95 < 150 ms; overlay refresh < 1 s; user satisfaction surveys.
- Guild Ops
  - Ledger write success 99.99%; audit completeness; permission accuracy.

## Implementation Backlog (Near‑Term)
- Market confidence MVP
  - Backend scoring module in `src/lib/market` (new), expose via `src/app/api/market/*`.
  - UI badges in `src/components/market/*`; tooltip copy; tests in `tests/validation/trading.test.ts`.
- Flipper v1 (Caerleon)
  - ROI model in `src/lib/trading`; suggestions endpoint; list UI in `src/components/trading/*`.
  - Add rate‑limited alerts; fixtures in `tests/trading/*`.
- PvP meta v2
  - Aggregations in `src/lib/pvp`; hooks in `src/hooks/use-pvp.ts`; matrix component.
- Route basic
  - Graph builder under `src/lib/analysis`; widget in `src/components/widgets/*`; performance benchmarks.
- Guild ops v1
  - Edge functions for Discord; ledger module in `src/lib/guilds` (new); UI in `src/components/guilds/*`.

## Internationalization & Accessibility
- i18n
  - Localize core UI strings (market, flipper, routes, PvP, guilds); plan RU/ES/DE priority.
  - Numbers/currency and date formats per locale; item names via `Docs/PVP_LOCALIZED_NAMES.md`.
- Accessibility (WCAG 2.2)
  - Color contrast for freshness/confidence badges; keyboard navigation; focus states.
  - ARIA roles on tables and interactive widgets; screen‑reader descriptions for anomalies.

## Compliance & Ethics
- Respect AODP and official API ToS; no automated scraping beyond allowed clients.
- Opt‑in telemetry; anonymized aggregates; transparent privacy and deletion/export.
- Creator program consent for VOD linking; clear opt‑out.

## Experiment Roadmap (A/B)
- Confidence badge formats: numeric vs categorical (High/Med/Low).
- Flip alert cadences and thresholds; measure precision, recall, user satisfaction.
- Route safety overlays density windows; evaluate comprehension and travel outcomes.
- PvP matchup visualization styles; measure decision speed and accuracy.



## Competitor Scorecard (Depth, Data, UX, Performance)
- Albion Free Market (AFM)
  - Data quality: medium (AODP dependent; good coverage, variable freshness)
  - Feature depth: high (market, flipper, map, calculators, builds)
  - UX: high (polished, guided flows)
  - Performance: medium‑high (generally responsive)
  - Differentiators: flipper, pathfinding; premium gates
- Albion Online Data Project (AODP)
  - Data quality: medium (crowdsourced; strong dedupe, freshness varies)
  - Feature depth: low (data backbone, not productized UX)
  - UX: N/A
  - Performance: high (streams/dumps reliable)
  - Differentiators: public streams/APIs
- Albion Online 2D (AO2D)
  - Data quality: medium (AODP; Cloudflare gating on some pages)
  - Feature depth: medium (items, prices, merged killboard sections)
  - UX: medium
  - Performance: medium (varies with gating)
- Murder Ledger
  - Data quality: high (robust ingest; occasional upstream outages)
  - Feature depth: medium‑high (kill/death history, Twitch linking)
  - UX: medium‑high (fast search)
  - Performance: high (Kafka/MySQL/K8s; 120k–150k/day)
- Albion Online Tools (AOT)
  - Data quality: medium (mixed sources)
  - Feature depth: medium (bot + calculators + stats)
  - UX: medium
  - Performance: medium
- Profit calculators / Tools4Albion / ROAMapp / community bots
  - Data quality: low‑medium (niche tools)
  - Feature depth: low‑medium (focused utilities)
  - UX/Performance: mixed

Our edge
- Verified data confidence and anomaly detection reduce false flips and stale prices.
- Integrated PvP + guild ops + trading workflows in one platform.
- Performance SLAs and transparent freshness indicators to build trust.

## Benchmark Validation Plan (Acceptance Tests)
- Market latency
  - Setup: instrument ingest timestamps for AODP and user scans; publish availability timestamps in API.
  - Test: run synthetic price updates via test streams; assert median < 60s, worst‑case < 5m.
- Price confidence scoring
  - Setup: implement freshness, city coverage, variance model; output `confidence` 0–100.
  - Test: offline evaluation on historical datasets; assert ≥ 70 for public flips; measure MAE < 3% vs settlement.
- Kill event throughput and uptime
  - Setup: replay test kill events via Kafka/simulator; monitor p95/p99 ingest and duplicates.
  - Test: scale to ≥ 200k/day; assert 99.95% API uptime in synthetic chaos.
- Route planner performance
  - Setup: pre‑compute graph; benchmark route compute under varied weights.
  - Test: P95 < 150 ms; overlay refresh < 1 s under cache bust.
- Web performance (Core pages)
  - Setup: Lighthouse CI; Web Vitals instrumentation.
  - Test: LCP < 1.8 s; TTI < 2.5 s on mid‑range device profiles.
- API reliability
  - Setup: k6 load tests; synthetic failure injection for upstreams.
  - Test: p99 < 500 ms; proper fallback responses when upstreams fail.

## Implementation Mapping (Repo Alignment)
- Market Overview v2
  - Backend: `src/backend/index.ts`, `src/backend/supabase/clients.ts`; price confidence in `src/lib/market` (new module).
  - Frontend: `src/components/market/*`, hooks `src/hooks/use-market-prices.ts`, `use-price-history.ts`.
- Black Market Flipper v1
  - Backend: `src/lib/trading` models and ROI calculations; endpoints in `src/app/api`.
  - Frontend: `src/components/trading/*`, alerts in `src/components/notifications/*`.
- PvP Intelligence v2
  - Backend: event ingest in `supabase/functions/sync-pvp-data`; analytics in `src/lib/pvp`.
  - Frontend: `src/components/pvp/*`, hooks `src/hooks/use-pvp.ts`.
- Guild Ops v1
  - Backend: `src/lib/guilds` (new module), Discord integration via Edge Functions.
  - Frontend: `src/components/guilds/*`, dashboard in `src/app/guilds/*`.
- Route Finder / Safety v2
  - Backend: graph builder `src/lib/analysis` or `src/lib/utils` (new submodule); risk overlays from PvP analytics.
  - Frontend: `src/components/widgets/*` map widget; `src/components/compare/*` for summaries.
- Calculators v1
  - Backend: `src/lib/trading` and `src/lib/data` for returns/specs.
  - Frontend: `src/components/market/*` and `src/components/trading/*` UIs.

## Personas and JTBD
- Trader/Flipper
  - Job: find safe, fast flips with reliable ROI; avoid stale data.
  - Needs: confidence scores, shopping lists, logistics and tax modeling.
- Shot‑caller/Analyst
  - Job: plan comps/routes; read opponent tendencies; decide fight windows.
  - Needs: matchup matrices, heatmaps, risk overlays, route ETA and zone breakdowns.
- Guild Quartermaster/Officer
  - Job: run regear ledger, payouts, attendance; enforce blacklist.
  - Needs: Discord‑native flows, itemized records, exports.
- Content Creator
  - Job: link fights to VODs; showcase data; engage community.
  - Needs: opt‑in VOD linking, shareable analytics, alerts.

## GTM and Adoption
- Freemium core: market overview, meta, basic routes, calculators.
- Pro tier: advanced flipper, private queues, guild ops, bulk APIs, alerts.
- Community: Discord support, tutorials, contributor credits; creator program.

## Open Questions and Research Backlog
- Best approach to blend AODP with private scans while respecting ToS.
- Automated Twitch VOD indexing heuristics and opt‑in flow.
- ROI modeling for upgrade/quality flips under high contention.
- Kill density aggregation windows and smoothing for safety overlays.
- Guild ops permission model and data privacy for member records.