# SRE Maturity Policy (Formal)

## Scope
- Platform/API availability
- Internal jobs reliability
- Checkout/payment reliability
- Webhook ingestion reliability

## On-Call (24x7)
- Two levels per day: `primary` and `secondary`.
- Source of truth:
  - `sre_oncall_rotations`
  - `sre_oncall_shifts`
  - `sre_oncall_policies`
- Operational rules:
  - Acknowledge within policy SLA (default `10m`).
  - First mitigation target within policy escalation SLA (default `20m`).
  - Secondary auto-paged if primary misses acknowledgment.
  - Incidents without owner are auto-assigned to current `primary`.
  - Unacknowledged incidents are escalated automatically (`sre_incident_escalation`).
  - Shift coverage/unacknowledged gaps generate automatic alerts:
    - `sre_oncall_uncovered`
    - `sre_oncall_unacknowledged`

## Error Budget Governance
- Rollup source: `sre_error_budget_rollups`.
- Policy source: `sre_error_budget_policies`.
- Window baseline: `30 days`.
- Stages:
  - `ok`: burn `< warn threshold`
  - `warn`: burn `>= warn threshold` (default 50%)
  - `critical`: burn `>= critical threshold` (default 85%)
- Mandatory action:
  - `warn`: capacity/reliability review within 24h.
  - `critical`: freeze risky production changes until burn returns to `warn/ok`.

## DR Fixed Calendar
- Calendar table: `dr_drill_calendar`.
- Recurring schedule source: `dr_game_day_templates`.
- Supports monthly and quarterly game days across scenarios.
- Rules:
  - each scheduled drill must have evidence in `dr_test_runs`
  - overdue after grace period becomes `missed`
  - missed drill opens `finance_ops_alerts` (`dr_drill_missed`)
  - upcoming drill reminder opens `finance_ops_alerts` (`dr_drill_upcoming`)
  - failed drill opens `finance_ops_alerts` (`dr_drill_failed`)

## Automation Jobs
- `POST /api/internal/jobs/evaluate-sre`
  - SLO breach evaluation + DR freshness check
  - fast on-call assignment + escalation path
- `POST /api/internal/jobs/refresh-sre-foundations`
  - on-call shift refresh + shift state reconciliation
  - incident owner auto-assignment + ack escalation
  - on-call coverage alerting
  - error budget rollups + alerts
  - DR calendar ensure (legacy + templates), run sync, missed/upcoming/failed drill alerts

## Compliance Cadence
- Daily:
  - check open critical incidents
  - check error budget critical services
  - check uncovered on-call for next 48h
- Weekly:
  - review on-call rotation coverage (next 21 days)
  - verify postmortems closed with action items
- Monthly:
  - run DR game day(s) and attach evidence
  - review SLO targets and budget thresholds
