# Internal Jobs Cron - Workflow Dispatch Smoke Evidence (2026-03-09)

## Scope
- Workflow executado manualmente via `workflow_dispatch` no repo `giovannasousa105/Belapop`.
- Ambiente alvo: `https://belapopoficial.com.br`
- Objetivo:
  - confirmar que `INTERNAL_JOB_SECRET` no GitHub estava exatamente igual ao da Vercel Production;
  - executar smoke imediato do workflow `Internal Jobs Cron`;
  - registrar run IDs, horarios e resultado final.

## Secret synchronization
- Fonte de verdade usada: `INTERNAL_JOB_SECRET` do projeto Vercel Production `belapop/belapopsite`.
- Acao aplicada:
  - leitura do valor atual na Vercel Production;
  - normalizacao do valor exportado;
  - regravacao do secret `INTERNAL_JOB_SECRET` no repo GitHub `giovannasousa105/Belapop`.
- Resultado:
  - GitHub e Vercel ficaram sincronizados a partir do mesmo valor fonte.

## Important note about the first attempt
- Primeira execucao manual:
  - Run ID: `22834117072`
  - URL: `https://github.com/giovannasousa105/Belapop/actions/runs/22834117072`
  - Criada em UTC: `2026-03-09T01:02:24Z`
  - Atualizada em UTC: `2026-03-09T01:02:32Z`
  - Equivalente em America/Sao_Paulo: `2026-03-08T22:02:24-03:00` a `2026-03-08T22:02:32-03:00`
  - Conclusao: `failure`
- Causa identificada:
  - o valor exportado por `vercel env pull` veio serializado com aspas e escapes de `\r\n`;
  - isso levou a `401 Nao autorizado para job interno.` nos endpoints protegidos.
- Correcao aplicada antes da segunda execucao:
  - normalizacao do secret;
  - nova sincronizacao do `INTERNAL_JOB_SECRET` no GitHub.

## Successful workflow_dispatch evidence
- Run ID: `22834218359`
- URL: `https://github.com/giovannasousa105/Belapop/actions/runs/22834218359`
- Criada em UTC: `2026-03-09T01:07:26Z`
- Atualizada em UTC: `2026-03-09T01:07:46Z`
- Equivalente em America/Sao_Paulo: `2026-03-08T22:07:26-03:00` a `2026-03-08T22:07:46-03:00`
- Status final: `completed`
- Conclusao final: `success`

## Jobs executed in the successful run
- `refresh_sre_foundations`: `success`
- `refresh_risk_recon_t1`: `success`
- `process_notification_outbox`: `success`
- `process_reverse_logistics`: `success`
- `support_sla_escalation`: `success`
- `evaluate_sre`: `success`
- `process_ranking_realtime`: `success`
- `refresh_risk_holdbacks`: `success`

## Direct endpoint validation
- Endpoint validado diretamente com o secret sincronizado:
  - `POST /api/internal/jobs/refresh-risk-recon-t1?risk_limit=10&recon_limit=10&min_score=55`
- Resultado:
  - HTTP `200`
  - `ok: true`

### Payload highlights
- `seller_id: null`
- `date: 2026-03-08`
- `risk_window_days: 7`
- `min_risk_score: 55`
- `critical_delta_cents: 1`
- `risk.profiles_refreshed: 1`
- `risk.holdbacks_applied: 0`
- `risk.alerts_upserted: 0`
- `reconciliation.rows_reconciled: 1`
- `reconciliation.alerts_upserted: 0`
- `reconciliation.provider_critical_alerts_upserted: 0`
- `reconciliation.runs[0].provider: unknown`
- `reconciliation.runs[0].status: ok`
- `reconciliation.runs[0].delta_cash_in_vs_gateway_gross_cents: 0`
- `reconciliation.runs[0].delta_ledger_net_vs_gateway_net_cents: 0`
- `reconciliation.runs[0].delta_payout_vs_ledger_cash_out_cents: 0`
- `notifications.alerts_notified: 0`
- `notifications.admin_recipients: 0`
- `notifications.queued_notifications: 0`

## Operational conclusion
- O workflow `Internal Jobs Cron` foi disparado manualmente com sucesso apos a sincronizacao correta do secret.
- A protecao por `x-job-secret` no dominio final esta funcional.
- O job consolidado `refresh-risk-recon-t1` esta operacional em producao.
- A causa da falha inicial foi isolada, corrigida e registrada.

## Follow-up
- Manter esta run como evidencia operacional de smoke do cron consolidado.
- Reutilizar este procedimento sempre que houver:
  - rotacao de `INTERNAL_JOB_SECRET`;
  - alteracao de workflow;
  - alteracao de autenticacao dos endpoints internos.
