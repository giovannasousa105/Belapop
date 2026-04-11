# Dashboard do Lojista Enterprise (Cada Lojista Envia)

## Escopo entregue na Home
- Grid 12 colunas com prioridade logistica/SLA.
- Linha 1: barra sticky de filtros globais + acoes de visao + Command Palette.
- Linha 2: 8 status cards (SLA, vencendo, tracking, GMV, pedidos pagos, cancelamento por ruptura, validade critica, saldo a receber).
- Linha 3: Funil e series (8 colunas) + Atencao agora com prioridade manual (4 colunas).
- Linha 4: Tabela Pedidos: Excecoes (6 colunas) + Top SKUs em risco com mini heatmap (6 colunas).
- Linha 5: Transportadoras (4 colunas) + Validade e lote (4 colunas) + Repasses e financeiro rapido (4 colunas).
- Footer: logs recentes de acoes.
- Drawer lateral padrao (520px) para drill-down e acoes.

Arquivo principal:
- [app/seller/dashboard/page.tsx](/c:/Users/Gleiser/Desktop/BELAPOPSITE/app/seller/dashboard/page.tsx)

## Regras de UX implementadas
- Badges de SLA com semaforo (verde/amarelo/vermelho).
- Ultimo update visivel nos cards.
- CTA direta: Resolver, Criar regra, Criar ticket, Ignorar 24h.
- Estado vazio com texto de orientacao em excecoes, SKUs e transportadoras.
- Acoes em lote na tabela de excecoes.

## Fluxo tecnico de pedido (estado x trigger x evento)
Mapa recomendado para backend/eventos:

1. `created` -> trigger `payment_approved` -> `paid` -> evento `order.payment.approved`
2. `paid` -> trigger `notify_store/auto_accept` -> `a_confirmar` -> evento `order.waiting.confirmation`
3. `a_confirmar` -> trigger `store_accept` -> `separando` -> evento `order.separacao.iniciada`
4. `separando` -> trigger `items_picked` -> `pronto_envio` -> evento `order.pronto_envio`
5. `pronto_envio` -> trigger `add_tracking/post` -> `postado` -> evento `shipment.created`
6. `postado` -> trigger `carrier_update_in_transit` -> `em_transito` -> evento `shipment.in_transit`
7. `em_transito` -> trigger `carrier_update_delivered` -> `entregue` -> evento `shipment.delivered`
8. `em_transito` -> trigger `carrier_update_attempt_failed` -> `tentativa_frustrada` -> evento `shipment.attempt_failed`
9. `tentativa_frustrada` -> trigger `carrier_update_returned` -> `devolucao_logistica` -> evento `shipment.returned`
10. `devolucao_logistica` -> trigger `return_received` -> `returned` -> evento `order.returned`
11. `paid/a_confirmar/separando` -> trigger `cancel_request` -> `cancelled` -> evento `order.cancelled`

## Eventos de telemetria recomendados
- `view_dashboard`
- `filter_change`
- `click_kpi_card`
- `funnel_view`
- `alert_resolve`
- `alert_snooze`
- `alert_rule_create`
- `export_report`
- `update_stock_lot`
- `dispatch_order`

## Endpoints REST sugeridos (v1)
- `GET /dashboard/home?period=&channel=&region=&category=&city=`
- `GET /orders?filter=exceptions`
- `POST /orders/{id}/add-tracking`
- `POST /shipments/{id}/update-tracking`
- `GET /stores/{id}/logistics-score`
- `POST /alert-rules`
- `GET /alert-rules`
- `POST /lots/{id}/create-queima`
- `POST /webhooks/carrier`
- `POST /webhooks/payment`

## Formula de ranking (resumo)
`score_total = logistica(30) + qualidade(25) + conversao(20) + financeiro(15) + engajamento(10)`

Sugestao de faixas:
- `>=85`: Preferred
- `70-84`: Normal
- `50-69`: Warning
- `<50`: Restricted

## Roadmap 60-120 dias
1. Semanas 1-3: funil, excecoes, SLA base, extratos.
2. Semanas 4-6: lote/validade, alertas configuraveis, score de produto.
3. Semanas 7-10: ads + atribuicao + automacoes com guardrails.
4. Semanas 11-16: auditoria, disputa financeira, relatorios agendados, hardening.
