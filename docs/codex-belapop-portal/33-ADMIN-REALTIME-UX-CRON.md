# Dashboard Realtime (Padrao Enterprise)

## UX premium
- Default: `LIVE - Ultimas 3h`
- Janela opcional: `6h`
- Auto refresh: `15s`
- Indicador de estado:
  - Online: bolinha verde
  - Atrasado: ultimo update > 60s (bolinha ambar)
  - Parcial: atraso > 5 min (bolinha vermelha)
- Leitura executiva:
  - Toggle do grafico: `GMV` / `Pedidos`
  - Linha fixa: `Cancelamento (%)` no eixo direito
  - Tooltip: hora + GMV + pedidos + cancelamento

## Bucketing e performance
- 3h: bucket default 1m
- 6h: bucket default 2m
- 7d: bucket default 1h
- 30d e 90d: bucket default 1d

## Arquitetura desacoplada por eventos
- Tabela fonte de verdade: `public.marketplace_events`
  - `event_type` macro: `order` / `payment` / `risk` / `finance`
  - `event_name` detalhado: `order_paid`, `order_canceled`, `refund_settled`, `chargeback_opened`
  - `idempotency_key` para dedupe forte
  - `source` e `provider` para auditoria
  - `ingestion_status` (`received`, `processed`, `failed`)
- Agregados:
  - `public.metrics_marketplace_minute`
  - `public.metrics_marketplace_hour`
  - `public.metrics_marketplace_day`
- Endpoint de leitura: `GET /api/admin/metrics/realtime`
- Endpoint executivo agregado: `GET /api/admin/metrics?range=7d|30d|90d`

## Idempotencia recomendada
- `uq_events_order_event_name` (`order_id`, `event_name`) quando `order_id` existir
- `uq_events_external_ref_event_name` (`external_ref`, `event_name`) quando `external_ref` existir
- `uq_events_idempotency_key` (`idempotency_key`) quando existir

## Insercao de eventos (padrao)
```sql
insert into public.marketplace_events (
  event_type, event_name, occurred_at, channel, store_id, order_id,
  amount_cents, currency, external_ref, idempotency_key, source, provider, metadata
) values (
  :event_type, :event_name, coalesce(:event_time, now()), :channel, :store_id, :order_id,
  :amount_cents, coalesce(:currency, 'BRL'), :external_ref, :idempotency_key, :source, :provider, coalesce(:metadata, '{}'::jsonb)
)
on conflict do nothing;
```

## Jobs (cron)
Executar a cada minuto:
```sql
select public.refresh_marketplace_metrics_minute();
```

Executar a cada 5 minutos:
```sql
select public.refresh_marketplace_metrics_hour();
```

Executar a cada 60 minutos:
```sql
select public.refresh_marketplace_metrics_day();
```

## Backfill inicial
- Ultimas 24h (minuto) e 90d (hora/dia):
```sql
select public.backfill_marketplace_metrics(now() - interval '90 days', now());
```

## Retencao
- Minute: 90 dias
- Hour: 365 dias
- Day: 10 anos

Executar diariamente:
```sql
select public.prune_marketplace_metrics_retention(now(), 90, 365, 3650);
```

## Concorrencia do cron
As funcoes usam `pg_try_advisory_lock(...)` para evitar execucao duplicada em multiplos workers.
