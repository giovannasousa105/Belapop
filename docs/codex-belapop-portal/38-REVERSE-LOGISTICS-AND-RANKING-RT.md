# Reverse Logistics + Ranking Near-Real-Time

## Reverse Logistics
- `return_requests`: fluxo de devolucao/troca por `sub_order_id`.
- `logistics_exceptions`: excecoes operacionais (`delivery_delay`, etc.).
- `logistics_exception_policies`: SLA por tipo de excecao.

### Automacoes
- Ticket de suporte com `desired_resolution` gera/atualiza `return_requests`.
- Mudanca em `return_requests.status` sincroniza status do `sub_orders`.
- `refresh_logistics_exceptions(limit)` detecta atraso automaticamente.
- `escalate_logistics_exceptions(limit)` escala SLA vencido e abre ticket tecnico quando necessario.
- `create_finance_ops_alerts_from_logistics_exceptions(limit)` gera alertas automáticos para operacao.

## Ranking Near-Real-Time
- `ranking_realtime_queue`: fila de sinais de produto.
- Triggers:
  - `analytics_events` -> enqueue por view/click/purchase.
  - `order_items` -> enqueue por conversao.
- Job:
  - `process_ranking_realtime_queue(limit)`:
    - refresh `product_metrics_30d`
    - refresh `product_scores`
    - refresh `product_ranking_snapshot` por categoria + `featured`

## A/B Experimentacao
- `ab_experiments`, `ab_experiment_variants`
- `ab_experiment_assignments` (bucket deterministico)
- `ab_experiment_events` (exposure/conversion/revenue)
- `ab_experiment_attribution_daily` (uplift vs control)

### Jobs
- `refresh_ab_experiment_attribution_daily(14)` hourly
- `process-ranking-realtime` every `2m` (workflow + pg_cron)

### Playbooks
- `POST /api/internal/jobs/process-reverse-logistics` retorna `next_actions[]` com playbook por excecao (owner, SLA de acao, canal e checklist).
