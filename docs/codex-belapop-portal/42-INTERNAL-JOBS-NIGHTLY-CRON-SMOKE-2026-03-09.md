# Internal Jobs Cron - Nightly Scheduled Smoke Evidence

## Status
- Estado atual: `completed`
- Documento gerado automaticamente em UTC: `2026-03-09T12:11:03.699Z`
- Fonte: ultima run `event=schedule` do workflow `internal-jobs-cron.yml` contendo o job `refresh_risk_recon_t1`.

## Scheduled run selected
- Repo: `giovannasousa105/Belapop`
- Workflow: `internal-jobs-cron.yml`
- Trigger: `schedule`
- Branch/Ref: `main`
- Run ID: `22839174468`
- Run number: `395`
- URL: `https://github.com/giovannasousa105/Belapop/actions/runs/22839174468`
- Created at UTC: `2026-03-09T05:03:07Z`
- Updated at UTC: `2026-03-09T05:03:16Z`
- Equivalent in America/Sao_Paulo: `2026-03-09T02:03:07 (America/Sao_Paulo)` to `2026-03-09T02:03:16 (America/Sao_Paulo)`
- Status final: `completed`
- Conclusion final: `success`

## Job summary
- Total jobs observados: `8`
- Jobs com `success`: `1`
- Jobs com `skipped`: `7`
- Jobs com falha/conclusao nao-success: `0`
- Job alvo `refresh_risk_recon_t1`: `success`

## Jobs executed in the selected run
- `refresh_risk_recon_t1`: `success` (2026-03-09T05:03:09Z -> 2026-03-09T05:03:15Z)
- `support_sla_escalation`: `skipped` (2026-03-09T05:03:07Z -> 2026-03-09T05:03:07Z)
- `process_ranking_realtime`: `skipped` (2026-03-09T05:03:08Z -> 2026-03-09T05:03:07Z)
- `refresh_risk_holdbacks`: `skipped` (2026-03-09T05:03:08Z -> 2026-03-09T05:03:07Z)
- `process_notification_outbox`: `skipped` (2026-03-09T05:03:08Z -> 2026-03-09T05:03:07Z)
- `process_reverse_logistics`: `skipped` (2026-03-09T05:03:08Z -> 2026-03-09T05:03:07Z)
- `evaluate_sre`: `skipped` (2026-03-09T05:03:08Z -> 2026-03-09T05:03:07Z)
- `refresh_sre_foundations`: `skipped` (2026-03-09T05:03:08Z -> 2026-03-09T05:03:07Z)

## Notes
- Este fechamento automatico usa apenas a API do GitHub Actions para escolher a ultima run agendada relevante.
- Payloads internos dos endpoints nao sao expostos pela API de runs; para highlights de resposta, use logs/artifacts ou uma chamada autenticada ao endpoint.
- Resultado operacional: a ultima execucao noturna relevante do cron consolidado concluiu com sucesso.
