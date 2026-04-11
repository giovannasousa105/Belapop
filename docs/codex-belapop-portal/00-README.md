# BelaPop Portal Docs

This folder defines the operational blueprint for the multi-role portal:
- Cliente
- Parceiro (lojista)
- Admin (restrito)

## Scope
- Auth and role routing
- Supabase data + RLS
- Navigation and page behavior
- Editorial premium UX rules for marketplace experience

## Canonical references
- `docs/belapop-codex-editorial/*` for visual/editorial baseline
- `docs/CODEX_BELAPOP_EDITORIAL.md` for master direction

## Status model
- P0: blockers (security, broken routes, auth leaks)
- P1: core flow (cliente/seller/admin)
- P2: refinements (ux polish, analytics, advanced ops)

## SQL execution rule
- All remote SQL must be applied from this repository using:
  - `scripts/apply-sql-migrations.ps1`
- Manual SQL in Supabase SQL Editor is allowed only for emergency diagnostics/hotfixes.
- Any manual hotfix must be backported to `supabase/migrations/*.sql` and then applied via the script above.

## Ops automation
- Close the nightly internal-jobs smoke record with:
  - `npm run docs:close:nightly-smoke`

## Recent enterprise deliverables
- `22-DASHBOARD-LOJISTA-ENTERPRISE-LOGISTICA.md`
- `22-SQL-LOGISTICA-ENTERPRISE.sql`
- `23-WIREFRAME-ASCII-HOME-ENTERPRISE.md`
- `24-EVENTOS-WEBHOOKS-AUTOMATIONS.md`
- `25-NOTIFICATION-TEMPLATES.md`
- `26-METRICS-DICTIONARY.md`
- `27-SELLER-DASHBOARD-API.openapi.yaml`
- `28-DASHBOARD-HOME-MOCK.json`
- `29-ENDPOINT-PERMISSIONS-MATRIX.md`
- `30-RBAC-POLICY-ENGINE.md`
- `37-SRE-OPERATING-MODEL.md`
- `39-SRE-MATURITY-POLICY.md`
- `40-RISK-RECON-JOBS-SMOKE-2026-03-08.md`
- `41-INTERNAL-JOBS-WORKFLOW-DISPATCH-SMOKE-2026-03-09.md`
- `42-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE-2026-03-09.md`
- `43-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE-PENDING.md`
- `44-INTERNAL-JOBS-NIGHTLY-CRON-SMOKE-TEMPLATE.md`
- `45-PROCESS-RANKING-REALTIME-INCIDENT-2026-03-11.md`
- `45-PROCESS-RANKING-REALTIME-NIGHTLY-CRON-SMOKE-2026-03-11.md`
- `46-PROCESS-RANKING-REALTIME-NIGHTLY-SMOKE-PENDING.md`
- `47-PROCESS-RANKING-REALTIME-NIGHTLY-SMOKE-TEMPLATE.md`
- `48-ADMIN-FINANCE-CURADORIA-PROD-SMOKE-2026-03-11.md`
- `49-SKINGPT-EVIDENCE-ADMIN-AND-INGESTION-2026-03-11.md`
- `50-GO-LIVE-ROADMAP-EXECUTABLE.md`
- `51-TECHNICAL-BACKLOG-BY-FILE-ROUTE.md`
- `52-OPERATIONS-BOARD.md`
- `53-GO-LIVE-SIGNOFF-CHECKLIST.md`
- `54-SPRINT-EXECUTION-PLAN.md`
- `55-SPRINT-1-EXECUTION-CHECKLIST.md`
- `56-P0-RUNBOOKS-CHECKOUT-FRETE-CHARGEBACK-RECONCILIACAO.md`
- `57-P0-INCIDENT-EXECUTION-CHECKLISTS.md`
- `58-P0-INCIDENT-RECORD-TEMPLATES.md`
