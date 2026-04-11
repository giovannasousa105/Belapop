# Internal Jobs Cron - Nightly Scheduled Smoke Evidence

## Status
- Estado atual: `completed`
- Documento gerado automaticamente em UTC: `2026-03-11T10:29:26.960Z`
- Fonte: ultima run `event=schedule` do workflow `internal-jobs-cron.yml` contendo o job `process_ranking_realtime`.

## Scheduled run selected
- Repo: `giovannasousa105/Belapop`
- Workflow: `internal-jobs-cron.yml`
- Trigger: `schedule`
- Branch/Ref: `main`
- Run ID: `22947333765`
- Run number: `726`
- URL: `https://github.com/giovannasousa105/Belapop/actions/runs/22947333765`
- Created at UTC: `2026-03-11T10:09:00Z`
- Updated at UTC: `2026-03-11T10:09:07Z`
- Equivalent in America/Sao_Paulo: `2026-03-11T07:09:00 (America/Sao_Paulo)` to `2026-03-11T07:09:07 (America/Sao_Paulo)`
- Status final: `completed`
- Conclusion final: `success`

## Job summary
- Total jobs observados: `8`
- Jobs com `success`: `1`
- Jobs com `skipped`: `7`
- Jobs com falha/conclusao nao-success: `0`
- Job alvo `process_ranking_realtime`: `success`

## Jobs executed in the selected run
- `process_ranking_realtime`: `success` (2026-03-11T10:09:03Z -> 2026-03-11T10:09:06Z)
- `support_sla_escalation`: `skipped` (2026-03-11T10:09:00Z -> 2026-03-11T10:09:00Z)
- `refresh_risk_holdbacks`: `skipped` (2026-03-11T10:09:00Z -> 2026-03-11T10:09:00Z)
- `evaluate_sre`: `skipped` (2026-03-11T10:09:00Z -> 2026-03-11T10:09:00Z)
- `refresh_sre_foundations`: `skipped` (2026-03-11T10:09:00Z -> 2026-03-11T10:09:00Z)
- `refresh_risk_recon_t1`: `skipped` (2026-03-11T10:09:01Z -> 2026-03-11T10:09:00Z)
- `process_notification_outbox`: `skipped` (2026-03-11T10:09:01Z -> 2026-03-11T10:09:00Z)
- `process_reverse_logistics`: `skipped` (2026-03-11T10:09:01Z -> 2026-03-11T10:09:00Z)

## Notes
- Este fechamento automatico usa apenas a API do GitHub Actions para escolher a ultima run agendada relevante.
- Payloads internos dos endpoints nao sao expostos pela API de runs; para highlights de resposta, use logs/artifacts ou uma chamada autenticada ao endpoint.
- Resultado operacional: a ultima execucao noturna relevante do cron consolidado concluiu com sucesso.
