# SRE Operating Model (BelaPop)

## SLO/SLI
- `api.v1 / availability`: target `99.95%` (window `60m`)
- `internal.jobs / success_rate`: target `99.0%` (window `60m`)
- `checkout.payment / success_rate`: target `99.5%` (window `60m`)
- `webhooks.ingestion / success_rate`: target `99.9%` (window `60m`)

## Data Model
- `service_slo_targets`
- `service_sli_events`
- `service_sli_rollups`
- `sre_incidents`
- `sre_incident_events`
- `sre_runbooks`
- `dr_test_runs`

## Automation
- `public.evaluate_slo_breaches(60)` every `5m`
- `public.check_dr_test_freshness(30)` daily
- SLO breaches generate `finance_ops_alerts.alert_type = 'sre_slo_breach'`
- Critical breaches auto-open incident in `sre_incidents`

## Incident Flow
1. Alert opens (`warn` or `critical`).
2. If `critical`, incident is auto-created (`sre_incidents`).
3. On-call updates timeline via `sre_incident_events`.
4. Mitigation + validation of SLI recovery.
5. Resolve incident (`status = resolved`), attach postmortem notes.

## Formal On-Call
- Rotation source: `sre_oncall_rotations` (`primary` and `secondary`).
- Shift calendar: `sre_oncall_shifts` (daily owner assignment).
- Policy source: `sre_oncall_policies` (ACK SLA + escalation cadence).
- Auto assignment: open incidents without owner are assigned to current `primary` via `public.assign_sre_incidents_to_current_oncall(...)`.
- ACK and escalation:
  - incident ACK (`public.acknowledge_sre_incident(...)`)
  - stale incidents escalate automatically (`public.escalate_unacknowledged_sre_incidents(...)`)
  - uncovered/unacknowledged shifts generate alerts (`public.create_finance_ops_alerts_from_oncall_coverage(...)`)
- Refresh cadence:
  - `public.refresh_sre_oncall_shifts(21)` hourly.
  - `public.refresh_sre_oncall_shift_states()` every 10 min.
  - GitHub internal job: `POST /api/internal/jobs/refresh-sre-foundations`.

## Error Budget Policy
- Policy source: `sre_error_budget_policies`.
- Daily rollup: `sre_error_budget_rollups` with:
  - observed error rate
  - allowed error rate (`100 - target_pct`)
  - budget burn percent
  - recommended action (`none`, `capacity_review`, `incident_review`, `freeze_deploy`)
- Burn thresholds (default):
  - `warn`: `>= 50%`
  - `critical`: `>= 85%`
- Alerts:
  - `finance_ops_alerts.alert_type = 'sre_error_budget_burn'`.

## DR Operating Rule
- At least one successful DR drill every `30` days.
- Missing drill opens alert: `alert_type = dr_test_overdue`.
- Register drill evidence via `public.record_dr_test_run(...)`.

## Fixed DR Calendar
- Calendar source: `dr_drill_calendar`.
- Legacy fixed monthly cadence (`day_of_month` controlled by job input, default `10`):
  - `public.ensure_dr_drill_calendar(6, 10, 'regional_failover')`.
- Recurring game day templates:
  - table `dr_game_day_templates`
  - generator `public.ensure_dr_game_day_calendar(6)` for monthly + quarterly scenarios
- Run synchronization:
  - `public.sync_dr_calendar_from_runs(...)`.
- Missed drill escalation:
  - `public.create_finance_ops_alerts_from_dr_calendar(grace_days, limit)`.
  - alert type: `dr_drill_missed`.
- Preventive/failed drill alerts:
  - `public.create_finance_ops_alerts_from_dr_upcoming(days_ahead, limit)`
  - `public.create_finance_ops_alerts_from_dr_failures(lookback_days, limit)`

## Internal Job (Single Entry)
- Endpoint: `POST /api/internal/jobs/refresh-sre-foundations`
- Parameters:
  - `limit`
  - `oncall_days_ahead`
  - `incident_ack_minutes`
  - `oncall_coverage_days_ahead`
  - `budget_window_days`
  - `dr_months_ahead`
  - `dr_day_of_month`
  - `dr_grace_days`
  - `dr_reminder_days_ahead`
  - `dr_failure_lookback_days`
- Workflow:
  - `.github/workflows/internal-jobs-cron.yml`
  - schedule `17 * * * *` + manual `workflow_dispatch`.
