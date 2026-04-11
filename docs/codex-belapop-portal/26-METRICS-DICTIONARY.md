# Dicionario de Metricas (Definicao Exata)

## 1) Vendas / Receita

### GMV (Gross Merchandise Value)
Soma do valor total dos pedidos pagos no periodo (antes de taxas, cupons e reembolsos).

Formula:
```sql
SELECT SUM(orders.total_amount)
FROM orders
WHERE status = 'paid'
  AND payment_approved_at BETWEEN :start AND :end;
```

### Pedidos pagos
Contagem de pedidos com pagamento aprovado no periodo.

Formula:
```sql
SELECT COUNT(*)
FROM orders
WHERE status = 'paid'
  AND payment_approved_at BETWEEN :start AND :end;
```

### Ticket medio
`GMV / PedidosPagos`

### Receita liquida
`GMV - Fees - Discounts - Refunds`

### Margem estimada (se custo informado)
`NetRevenue - SUM(order_items.quantity * products.cost)`

## 2) Funil (checkout interno)

- Sessions: numero de sessoes com atividade no marketplace.
- PDP Views: visualizacoes de pagina de produto.
- Add-to-cart (ATC): eventos de adicionar ao carrinho.
- Checkout started: inicio do checkout.
- Payment approved: pagamentos aprovados.

Taxas:
- Conversao checkout (Sessions -> Paid): `PaidOrders / Sessions`
- PDP -> ATC rate: `ATC / PDPViews`
- ATC -> Checkout rate: `CheckoutStarted / ATC`
- Checkout -> Paid rate: `PaidOrders / CheckoutStarted`

## 3) Logistica / SLA

### SLA on-time %
Percentual de pedidos postados ate `sla_due_at`.

Formula:
```sql
COUNT(orders WHERE posted_at <= sla_due_at) / COUNT(orders eligible)
```

`eligible`:
- pedidos pagos
- nao cancelados
- dentro do periodo
- que exigem postagem

### Pedidos vencendo em 24h
Pedidos pagos cujo `now < sla_due_at <= now + 24h` e ainda nao postados.

### Pedidos em atraso (late)
`now > sla_due_at` e `operational_status` ainda antes de `postado`.

### Tempo pagamento -> postagem
Media de `posted_at - payment_approved_at` para pedidos postados.

### Tempo postagem -> entrega
Media de `delivered_at - posted_at` (quando houver `delivered_at` via tracking).

### Tracking pendente
Pedidos com `operational_status='postado'` e `tracking_code IS NULL OR ''`.

### Tracking parado
Tracking sem `shipment_events` novos por `X` dias.

## 4) Estoque / Validade

### Cobertura (dias)
`estoque_disponivel / media_diaria_vendas`

`media_diaria_vendas = unidades_vendidas_ultimos_N_dias / N`

### Ruptura
SKU com `quantity - reserved <= 0` (ou abaixo do minimo configurado).

### Validade critica
Lote com `expiration_date - today <= threshold_days`.

### Risco de perda estimado
`qty_em_lotes_criticos * custo_unitario`
(ou preco, se custo nao existir).

## 5) Qualidade / Reputacao

### Nota media (30d/90d)
Media de `reviews.rating` no periodo.

### Taxa de devolucao
`ReturnedOrders / PaidOrders` (ou por item).

### Taxa de cancelamento por ruptura
Cancelamentos cujo motivo = falta de estoque / ruptura.

### Taxa de reclamacao
Tickets por pedido (ou por 100 pedidos).

## 6) Marketing / Ads

- Impressoes: vezes que um anuncio apareceu.
- Cliques: cliques no anuncio.
- CTR: `Clicks / Impressions`
- CPC: `Spend / Clicks`
- Pedidos atribuidos: pedidos pagos atribuidos ao canal/campanha segundo modelo.
- ROAS: `AttributedRevenue / Spend`
- Margem pos-ads: `AttributedNetRevenue - Spend - AttributedCOGS`

## 7) Financeiro

### Saldo a receber
Soma de `payouts.net` em status `scheduled/processing`.

### Divergencias
`payouts` em status `disputed` ou com flags de inconsistencia.
