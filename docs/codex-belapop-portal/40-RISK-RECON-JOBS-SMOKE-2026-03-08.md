# Risk + Reconciliation + Jobs Smoke Evidence (2026-03-08)

## Scope executed
- Migration aplicada em `belapop` (prod) e `belapop-staging`:
  - `20260308_1500_risk_device_velocity_payout_release_recon_alerts.sql`
- Deploy em producao:
  - Preview: `https://belapopsite-h04apikcf-belapop.vercel.app`
  - Alias final: `https://belapopoficial.com.br`
- Smoke HTTP end-to-end dos jobs internos no dominio final.

## Smoke command set
POST endpoints (com `x-job-secret`):
1. `/api/internal/jobs/process-notification-outbox?limit=150`
2. `/api/internal/jobs/support-sla-escalation?limit=200`
3. `/api/internal/jobs/process-reverse-logistics?limit=200`
4. `/api/internal/jobs/refresh-sre-foundations?...`
5. `/api/internal/jobs/evaluate-sre?...`
6. `/api/internal/jobs/process-ranking-realtime?limit=120&attribution_days=14`
7. `/api/internal/jobs/refresh-risk-holdbacks?limit=500&min_score=55`
8. `/api/internal/jobs/reconcile-gateway-t1?limit=120&critical_delta_cents=10000`

## Execution result
- Post-deploy run: **8/8 OK**
- Window: `2026-03-08T13:31:07-03:00` to `2026-03-08T13:31:29-03:00`

## Key evidence (payload highlights)
- `refresh-risk-holdbacks`
  - `refreshed_profiles: 1`
  - `holdbacks_applied: 0`
  - `released_holdbacks_last_24h: 0`
  - `risk_tier_counts: {"low":1}`
  - `top_risk_sellers[0].device_risk_30d: 0`
  - `top_risk_sellers[0].velocity_risk_30d: 0.35`
- `reconcile-gateway-t1`
  - `critical_delta_cents: 10000`
  - `reconciled_rows: 1`
  - `critical_provider_alerts_upserted: 0`
  - run status: `provider=unknown`, `status=ok`, deltas `=0`
- `refresh-sre-foundations`
  - `oncall_refreshed: 22`
  - `dr_game_day_calendar_upserted: 14`
  - `alerts_notified: 5`
- `evaluate-sre`
  - `dr_alerts_upserted: 1`
  - `oncall_coverage_alerts_upserted: 2`

## Artifacts
- Pre-deploy smoke log:
  - `tmp-job-logs/smoke-internal-jobs-2026-03-08.json`
- Post-deploy smoke log:
  - `tmp-job-logs/smoke-internal-jobs-2026-03-08-postdeploy.json`

## Notes
- Pre-deploy run had `404` on `refresh-sre-foundations` (old deploy sem rota).
- After deploy, the same endpoint returned `200` and the full chain closed successfully.
