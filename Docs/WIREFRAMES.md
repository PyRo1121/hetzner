# Wireframes: Market v2, Flipper v1, Guild Ops v1

These wireframes describe layout and interaction at a high level so UI can be implemented consistently. They reflect fields and acceptance criteria defined in `ROADMAP.md` and `API-DOCS.md`.

## Market Overview v2

- Header: `Market Overview` + server selector + last updated badge (`freshnessSeconds`)
- Filters: `Item`, `Tier`, `Quality`, `Locations (multi)`, `Confidence ≥ slider`
- KPI Row: `Avg Price`, `Spread`, `Volatility`, `Confidence` (with tooltip)
- Table columns:
  - `Item`, `Location`, `Quality`, `Sell Min`, `Buy Max`, `Spread %`, `Updated`, `Confidence`, `Anomaly`
- Row affordances:
  - Confidence badge (color-coded by threshold: ≥0.9 green, ≥0.8 amber, else grey)
  - Anomaly icon if `anomalies.outlier === true` with tooltip message
- Right rail:
  - Price history chart (last 24h/7d toggle)
  - Data freshness panel: `X seconds ago`; source and window

## Black Market Flipper v1

- Header: `Black Market Flipper` + safety banner (`route.riskLevel`)
- Controls:
  - `From City`, `To City`, `Tier range`, `Min Profit`, `Limit`, `Include Fees`
- Cards/List:
  - Per suggestion: `Item`, `Buy @ from`, `Sell @ to`, `Profit`, `ROI`, `Confidence`, `Route Risk`
  - Expandable: `route.steps` (textual), `volumeEstimate` and `notes`
- Map (optional, phase 2):
  - City-to-city line with risk overlay (color-coded)
- Footer:
  - Disclaimer on confidence and market volatility

## Guild Ops v1 (Regear + Ledger)

- Header: `Guild Ops` with tab switcher: `Regear`, `Ledger`, `Policies`
- Regear Form:
  - Fields: `Guild`, `Player`, `Item`, `Quantity`, `Reason`, `EventId?`, `Notes?`
  - Status: `accepted|pending|rejected` with time
  - Validation messages inline; API error mapping (400/401/403/429/503)
- Ledger Table:
  - `Date`, `Player`, `Item`, `Qty`, `Cost`, `Event`, `Status`, `Reviewer`
  - Export: CSV button
- Policies:
  - Text area for policy notes; links to `Docs/ROADMAP.md` governance section

## Accessibility & i18n

- Enforce WCAG 2.2: Focus states, color contrast for badges (confidence/risk), aria labels for charts and tables
- i18n strategy: Translate headers, filters, tooltips, error messages

## Acceptance Checkboxes (UI Specs)

- [ ] Market badge shows `freshnessSeconds` under 60s for ≥85% of items
- [ ] Confidence badge reflects defined thresholds with clear color contrast
- [ ] Flipper card includes `roi`, `confidence`, and `route.riskLevel`
- [ ] Regear form maps validation errors to inline field messages