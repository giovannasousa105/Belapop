# Process Ranking Realtime Incident - 2026-03-11

## Summary
- Workflow afetado: `internal-jobs-cron.yml`
- Job afetado: `process_ranking_realtime`
- Sintoma observado: falha em run `event=schedule`
- Data da correcao: `2026-03-11`

## Impact
- O job de ranking realtime nao fechava a execucao agendada com sucesso.
- O restante do workflow permanecia sem impacto direto, mas a camada de ranking/discovery ficava sem refresh automatico completo.

## Root cause
- O encadeamento de ranking/discovery dependia de objetos de banco nao totalmente alinhados:
  - `product_trending`
  - `product_rankings`
  - seeds/editorial collections
  - compatibilidade da migration `20260310_1600_luxury_marketplace_core.sql` com o schema real de `posts`

## Fix applied
- Migrations aplicadas:
  - `20260310_1400_discovery_engine_trending.sql`
  - `20260310_1600_luxury_marketplace_core.sql`
  - `20260310_2330_discovery_editorial_seed.sql`
  - `20260310_2340_skincare_simulation_batches_and_effectiveness_refresh.sql`
- Ajuste de compatibilidade:
  - `20260310_1600_luxury_marketplace_core.sql` foi endurecida para o schema real de `posts` (`body_md`, `media_url`)
- Validacoes diretas no banco:
  - `process_ranking_realtime_queue`: `OK`
  - `refresh_ab_experiment_attribution_daily`: `OK`
  - `refresh_product_trending`: `OK`
  - `refresh_product_ranking_snapshot`: `OK`

## Verification
- Run manual de validacao: `22931372709`
- URL:
  - `https://github.com/giovannasousa105/Belapop/actions/runs/22931372709`
- Resultado:
  - `process_ranking_realtime`: `success`
  - Demais jobs da execucao manual: `success`

## Scheduled confirmation
- Run agendada confirmada com sucesso:
  - Run ID: `22947333765`
  - URL: `https://github.com/giovannasousa105/Belapop/actions/runs/22947333765`
  - Trigger: `schedule`
  - Job `process_ranking_realtime`: `success`
- Evidencia historica fechada em:
  - `45-PROCESS-RANKING-REALTIME-NIGHTLY-CRON-SMOKE-2026-03-11.md`

## Operational next step
- Working record da proxima madrugada preparado em:
  - `46-PROCESS-RANKING-REALTIME-NIGHTLY-SMOKE-PENDING.md`
- Fechamento automatico permanece disponivel com:
```bash
npm run docs:close:ranking-nightly-smoke
```

## Note
- Esta evidencia registra a correcao, a validacao manual e a primeira confirmacao `event=schedule` bem-sucedida apos o fix.
