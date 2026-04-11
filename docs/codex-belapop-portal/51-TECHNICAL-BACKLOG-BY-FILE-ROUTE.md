# BelaPop Technical Backlog By File And Route

Date: 2026-03-12
Source of truth: `50-GO-LIVE-ROADMAP-EXECUTABLE.md`

## P0 Go-Live

### checkout

#### Melhor Envio live
- Status: `blocked`
- Goal: liberar o checkout ate `PaymentIntent` real com frete live.
- Files / routes:
  - [app/api/stripe/payment-intent/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/payment-intent/route.ts)
  - [lib/checkout/serverCheckout.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/checkout/serverCheckout.ts)
  - [lib/shipping/melhorenvio.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/melhorenvio.ts)
  - [lib/shipping/calculateShippingForSeller.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/calculateShippingForSeller.ts)
  - [app/api/shipping/quote/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/shipping/quote/route.ts)
- Dependencies:
  - `MELHORENVIO_TOKEN`
  - origem CEP valida por seller
- Acceptance:
  - `POST /api/stripe/payment-intent` retorna `200` em producao com frete real
  - smoke vai ate `PaymentIntent` sem stub

#### Matriz real de meios de pagamento Stripe
- Status: `in_progress`
- Goal: esconder da UI metodos que a conta Stripe nao entrega.
- Files / routes:
  - [app/api/stripe/payment-intent/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/payment-intent/route.ts)
  - [app/checkout/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/checkout/page.tsx)
  - [components/StripeCheckoutDemo.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/StripeCheckoutDemo.tsx)
  - [components/customer/CustomerPaymentMethodsPanel.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/customer/CustomerPaymentMethodsPanel.tsx)
- Acceptance:
  - UI exibe apenas `payment_method_types` reais do `PaymentIntent`
  - nao existe Pix/Boleto/Debito exibido quando indisponivel

### admin

#### Remover fallback mock do dashboard executivo
- Status: `planned`
- Goal: dashboard nunca esconder falha real com mock.
- Files / routes:
  - [app/(admin)/admin/dashboard/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/dashboard/page.tsx)
  - [lib/admin/dashboardMetrics.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/admin/dashboardMetrics.ts)
  - [lib/admin/mock.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/admin/mock.ts)
- Acceptance:
  - se a fonte falhar, a tela mostra estado degradado explicito
  - `mockDashboard` nao aparece no dashboard de producao

#### Eliminar endpoint legado simplista de dashboard
- Status: `planned`
- Goal: reduzir concorrencia entre metricas novas e antigas.
- Files / routes:
  - [app/api/admin/dashboard/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/dashboard/route.ts)
  - [app/(admin)/admin/dashboard/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/dashboard/page.tsx)
- Acceptance:
  - existe uma unica fonte de metricas admin
  - nenhum consumidor depende do endpoint simplista

### cliente

#### Recompra real por pedido/item
- Status: `planned`
- Goal: substituir link generico por reorder real.
- Files / routes:
  - [app/(client)/conta/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/page.tsx)
  - [app/(client)/conta/pedidos/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/pedidos/page.tsx)
  - [app/(client)/conta/pedidos/[id]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/pedidos/[id]/page.tsx)
  - [lib/customer/api.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/customer/api.ts)
  - `new`: `/api/v1/orders/{id}/reorder`
- Acceptance:
  - CTA `Comprar de novo` adiciona SKUs reais do pedido ao carrinho

#### ETA e timeline por lojista baseados em eventos
- Status: `planned`
- Goal: timeline real por subpedido.
- Files / routes:
  - [app/(client)/conta/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/page.tsx)
  - [app/(client)/conta/rastreio/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/rastreio/page.tsx)
  - [app/(client)/conta/pedidos/[id]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/pedidos/[id]/page.tsx)
  - [app/api/v1/tracking/by-order/[order_id]/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/v1/tracking/by-order/[order_id]/route.ts)
  - [app/api/v1/tracking/by-sub-order/[sub_order_id]/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/v1/tracking/by-sub-order/[sub_order_id]/route.ts)
- Acceptance:
  - pedido mostra milestones reais por lojista
  - excecoes aparecem sem depender de `shipping_days`

### lojista

#### Remover modulos proxy de reviews e trafego
- Status: `planned`
- Goal: usar dados reais ou esconder as superficies.
- Files / routes:
  - [components/partner/PartnerPortal.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/partner/PartnerPortal.tsx)
  - [app/api/partner/support/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/partner/support/route.ts)
  - `new`: `/api/partner/reviews`
  - `new`: `/api/partner/traffic`
- Acceptance:
  - nenhuma aba critica do seller fica apoiada em proxy

### finance

#### Validacao operacional de chargeback
- Status: `in_progress`
- Goal: checklist operacional com chargeback real ou sintetico controlado.
- Files / routes:
  - [app/api/stripe/webhook/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/webhook/route.ts)
  - [app/api/webhooks/payment/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/webhooks/payment/route.ts)
  - [app/api/admin/finance/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/finance/route.ts)
  - [lib/finance/chargebacks.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/finance/chargebacks.ts)
- Acceptance:
  - `chargeback`, `commission_reversal` e `chargeback_fee` aparecem no admin e no ledger

### ops / home

#### Promessa visivel de frete/troca/suporte
- Status: `planned`
- Goal: tornar confianca comercial visivel antes da compra.
- Files / routes:
  - [app/(public)/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/page.tsx)
  - [app/(public)/produto/[slug]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/produto/[slug]/page.tsx)
  - [components/layout/BPHeader.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/layout/BPHeader.tsx)
  - [components/layout/BPFooter.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/layout/BPFooter.tsx)
- Acceptance:
  - home e PDP mostram entrega, troca, suporte e pagamentos de forma explicita

#### Runbooks operacionais
- Status: `planned`
- Goal: incidentes criticos com procedimento padrao.
- Files:
  - `new`: `docs/codex-belapop-portal/51A-RUNBOOK-CHECKOUT.md`
  - `new`: `docs/codex-belapop-portal/51B-RUNBOOK-SHIPPING.md`
  - `new`: `docs/codex-belapop-portal/51C-RUNBOOK-CHARGEBACK.md`
  - `new`: `docs/codex-belapop-portal/51D-RUNBOOK-RECONCILIATION.md`
- Acceptance:
  - cada incidente P0/P1 possui runbook versionado

## P1 30 dias

### home
- marcas em destaque
  - files:
    - [app/(public)/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/page.tsx)
    - [lib/queries/discovery.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/queries/discovery.ts)
- vitrines por necessidade
  - files:
    - [app/(public)/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/page.tsx)
    - [app/(public)/catalogo/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/catalogo/page.tsx)
    - [lib/product/editorialCuration.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/product/editorialCuration.ts)

### cliente
- central unica de mensagens
  - files:
    - [app/(client)/conta/mensagens/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/mensagens/page.tsx)
    - [app/(client)/conta/reclamacoes-suporte/[ticketId]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/reclamacoes-suporte/[ticketId]/page.tsx)
- devolucao/reembolso self-service
  - files:
    - [app/(client)/conta/trocas-e-devolucoes/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/trocas-e-devolucoes/page.tsx)
    - [app/api/v1/support/tickets/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/v1/support/tickets/route.ts)
- assinatura/reposicao
  - files:
    - [app/(client)/conta/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/page.tsx)
    - `new`: `/api/v1/subscriptions`

### lojista
- bulk actions e CSV
  - files:
    - [components/partner/PartnerPortal.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/partner/PartnerPortal.tsx)
    - [app/api/partner/products/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/partner/products/route.ts)
    - [app/api/partner/orders/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/partner/orders/route.ts)
- extrato financeiro real
  - files:
    - [app/api/partner/payouts/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/partner/payouts/route.ts)
    - `new`: `/api/partner/ledger`
- reputacao
  - files:
    - [components/partner/PartnerPortal.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/partner/PartnerPortal.tsx)
    - [lib/admin/dashboardMetrics.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/admin/dashboardMetrics.ts)

### admin
- filas operacionais
  - files:
    - [app/(admin)/admin/dashboard/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/dashboard/page.tsx)
    - [app/api/admin/summary/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/summary/route.ts)
- modulo de clientes real
  - files:
    - [app/(admin)/admin/customers/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/customers/page.tsx)
    - `new`: `/api/admin/customers`

### ops / finance
- logistica reversa com excecao
  - files:
    - [app/api/internal/jobs/process-reverse-logistics/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/internal/jobs/process-reverse-logistics/route.ts)
    - [app/(admin)/admin/orders/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/orders/page.tsx)
- reconciliation drill-down
  - files:
    - [app/api/admin/finance/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/finance/route.ts)
    - [app/(admin)/admin/finance/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/finance/page.tsx)

## P2 60-90 dias

### home
- personalizacao plena
  - files:
    - [app/(public)/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/page.tsx)
    - [components/home/RecommendedProductsRail.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/home/RecommendedProductsRail.tsx)
    - [app/api/v1/products/recommendations/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/v1/products/recommendations/route.ts)
- social proof forte
  - files:
    - [app/(public)/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/page.tsx)
    - [app/(public)/produto/[slug]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/produto/[slug]/page.tsx)

### cliente
- wallet/beneficios
  - files:
    - [app/(client)/conta/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/page.tsx)
    - [app/account/wallet/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/account/wallet/page.tsx)
- timeline nivel Amazon
  - files:
    - [app/(client)/conta/pedidos/[id]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/pedidos/[id]/page.tsx)
    - [app/(client)/conta/rastreio/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/rastreio/page.tsx)

### lojista
- ads e promo engine
  - files:
    - [components/partner/PartnerPortal.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/partner/PartnerPortal.tsx)
    - [app/api/admin/campaigns](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin)
- catalogo avancado
  - files:
    - [app/api/partner/products/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/partner/products/route.ts)
    - schema de variantes a criar

### admin / finance / ops / checkout
- command center unificado
  - files:
    - [app/(admin)/admin/dashboard/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/dashboard/page.tsx)
- holdback dinamico e disputes
  - files:
    - [app/api/internal/jobs/refresh-risk-holdbacks/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/internal/jobs/refresh-risk-holdbacks/route.ts)
    - [app/api/finance/disputes/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/finance/disputes/route.ts)
- multi-carrier e etiqueta nativa
  - files:
    - [lib/shipping/melhorenvio.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/melhorenvio.ts)
    - camada multi-provider a criar
- antifraude robusto
  - files:
    - [app/api/stripe/payment-intent/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/payment-intent/route.ts)
    - [lib/checkout/paymentSessions.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/checkout/paymentSessions.ts)
    - [app/api/internal/jobs/refresh-risk-recon-t1/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/internal/jobs/refresh-risk-recon-t1/route.ts)
