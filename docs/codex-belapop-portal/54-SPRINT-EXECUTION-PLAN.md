# BelaPop Sprint Execution Plan

Date: 2026-03-12
Source references:
- `50-GO-LIVE-ROADMAP-EXECUTABLE.md`
- `51-TECHNICAL-BACKLOG-BY-FILE-ROUTE.md`
- `52-OPERATIONS-BOARD.md`
- `53-GO-LIVE-SIGNOFF-CHECKLIST.md`

## Squads
- `home` — Growth / Editorial Commerce
- `cliente` — CX / Pos-venda
- `lojista` — Seller Ops / Seller Success
- `admin` — Marketplace Ops / BI
- `checkout` — Payments / Platform
- `ops` — Logistics / Support Ops
- `finance` — Finance Ops / Risk

## Sprint 1
Goal: fechar o P0 transacional e retirar mascaramento operacional do produto.

### checkout
- Entregaveis:
  - Melhor Envio live em producao
  - matriz real de meios de pagamento Stripe
  - smoke de checkout ate `PaymentIntent`
- Files / routes:
  - [app/api/stripe/payment-intent/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/payment-intent/route.ts)
  - [lib/checkout/serverCheckout.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/checkout/serverCheckout.ts)
  - [lib/shipping/melhorenvio.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/melhorenvio.ts)
  - [lib/shipping/calculateShippingForSeller.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/calculateShippingForSeller.ts)
  - [app/api/shipping/quote/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/shipping/quote/route.ts)
  - [app/checkout/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/checkout/page.tsx)
  - [components/StripeCheckoutDemo.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/StripeCheckoutDemo.tsx)
- Acceptance:
  - checkout chega ao `PaymentIntent` real
  - UI nao mostra metodo Stripe indisponivel

### admin
- Entregaveis:
  - remover fallback `mockDashboard`
  - aposentar endpoint legado de dashboard
- Files / routes:
  - [app/(admin)/admin/dashboard/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/dashboard/page.tsx)
  - [app/api/admin/dashboard/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/dashboard/route.ts)
  - [lib/admin/dashboardMetrics.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/admin/dashboardMetrics.ts)
  - [lib/admin/mock.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/admin/mock.ts)
- Acceptance:
  - painel exibe degradacao observavel em falha real
  - nao existe consumo dependente do endpoint simplista

### finance
- Entregaveis:
  - checklist operacional de chargeback
  - validacao final de `chargeback`, `commission_reversal`, `chargeback_fee`
  - remover CTA placeholder de exportacao ou plugar export real
- Files / routes:
  - [app/api/admin/finance/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/finance/route.ts)
  - [app/(admin)/admin/finance/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/finance/page.tsx)
  - [app/api/stripe/webhook/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/webhook/route.ts)
  - [lib/finance/chargebacks.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/finance/chargebacks.ts)
- Acceptance:
  - fluxo validado em staging
  - export placeholder removido ou funcional

### ops / home
- Entregaveis:
  - barra de confianca comercial na home
  - promessas visiveis na PDP
  - runbooks de checkout, frete, chargeback e reconciliation
- Files / routes:
  - [app/(public)/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/page.tsx)
  - [app/(public)/produto/[slug]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/produto/[slug]/page.tsx)
  - `docs/codex-belapop-portal/*RUNBOOK*.md`
- Acceptance:
  - usuario ve confianca comercial antes do checkout
  - time interno tem runbooks publicados

### Dependencies between squads
- `checkout` depends on `ops`
  - sem frete real, nao existe smoke ate `PaymentIntent`
- `finance` depends on `checkout`
  - chargeback operacional exige fluxo transacional estavel
- `home` depends on `ops`
  - promessas so devem aparecer com SLA e politica validados
- `admin` depends on `finance`
  - sem fontes reais maduras, remover mock vira regressao sem plano de degradacao

## Sprint 2
Goal: fechar os fluxos centrais de cliente e seller com profundidade operacional real.

### cliente
- Entregaveis:
  - recompra real por pedido/item
  - timeline/rastreio por lojista baseada em eventos
  - central unica de mensagens
  - self-service de devolucao/reembolso
- Files / routes:
  - [app/(client)/conta/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/page.tsx)
  - [app/(client)/conta/pedidos/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/pedidos/page.tsx)
  - [app/(client)/conta/pedidos/[id]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/pedidos/[id]/page.tsx)
  - [app/(client)/conta/rastreio/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/rastreio/page.tsx)
  - [app/(client)/conta/mensagens/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/mensagens/page.tsx)
  - [app/(client)/conta/trocas-e-devolucoes/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/trocas-e-devolucoes/page.tsx)
  - `new`: `/api/v1/orders/{id}/reorder`
- Acceptance:
  - pos-venda real, sem atalho para catalogo generico

### lojista
- Entregaveis:
  - bulk actions
  - CSV
  - extrato real de ledger
  - reputacao first-class
  - reviews/trafego reais ou superficies ocultas
- Files / routes:
  - [components/partner/PartnerPortal.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/partner/PartnerPortal.tsx)
  - [app/api/partner/orders/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/partner/orders/route.ts)
  - [app/api/partner/products/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/partner/products/route.ts)
  - [app/api/partner/payouts/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/partner/payouts/route.ts)
  - `new`: `/api/partner/ledger`
  - `new`: `/api/partner/reviews`
  - `new`: `/api/partner/traffic`
- Acceptance:
  - seller opera pedidos, catalogo e caixa sem workaround

### admin
- Entregaveis:
  - filas operacionais acionaveis
  - modulo de clientes real
- Files / routes:
  - [app/(admin)/admin/dashboard/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/dashboard/page.tsx)
  - [app/(admin)/admin/customers/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/customers/page.tsx)
  - [app/api/admin/summary/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/summary/route.ts)
  - `new`: `/api/admin/customers`
- Acceptance:
  - admin atua por fila e enxerga cliente como entidade operacional

### ops / finance
- Entregaveis:
  - logistica reversa com excecao e SLA
  - reconciliation com drill-down por provider e issue
- Files / routes:
  - [app/api/internal/jobs/process-reverse-logistics/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/internal/jobs/process-reverse-logistics/route.ts)
  - [app/(admin)/admin/orders/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/orders/page.tsx)
  - [app/api/admin/finance/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/finance/route.ts)
  - [app/(admin)/admin/finance/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/finance/page.tsx)
- Acceptance:
  - issue operacional resolvida sem SQL manual

### Dependencies between squads
- `cliente` depends on `ops`
  - timeline e devolucao exigem eventos e reverse logistics consistentes
- `lojista` depends on `finance`
  - extrato real depende de ledger seller-safe
- `admin` depends on `cliente` and `lojista`
  - filas boas exigem dados reais de cliente, suporte e seller ops

## Sprint 3
Goal: elevar de marketplace funcional para marketplace com densidade comercial e inteligencia.

### home
- Entregaveis:
  - bloco de marcas em destaque
  - vitrines por necessidade
  - personalizacao plena
  - social proof forte
- Files / routes:
  - [app/(public)/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/page.tsx)
  - [app/(public)/catalogo/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/catalogo/page.tsx)
  - [components/home/RecommendedProductsRail.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/home/RecommendedProductsRail.tsx)
  - [app/api/v1/products/recommendations/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/v1/products/recommendations/route.ts)
  - [lib/queries/discovery.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/queries/discovery.ts)
- Acceptance:
  - home mistura descoberta editorial e conversao comercial com prova social

### cliente
- Entregaveis:
  - wallet / creditos / beneficios
  - reposicao e rotina recorrente
  - timeline nivel Amazon
- Files / routes:
  - [app/(client)/conta/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/page.tsx)
  - [app/account/wallet/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/account/wallet/page.tsx)
  - [app/(client)/conta/pedidos/[id]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(client)/conta/pedidos/[id]/page.tsx)
- Acceptance:
  - cliente retorna por valor, nao so por compra pontual

### lojista
- Entregaveis:
  - ads / campanhas
  - promo engine
  - catalogo avancado com variacoes e kits
- Files / routes:
  - [components/partner/PartnerPortal.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/partner/PartnerPortal.tsx)
  - [app/api/admin/campaigns](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin)
  - [app/api/partner/products/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/partner/products/route.ts)
- Acceptance:
  - seller cresce dentro da plataforma, nao so opera

### admin / finance / ops / checkout
- Entregaveis:
  - command center unificado
  - holdback dinamico e dispute workflow
  - multi-carrier
  - antifraude robusto
- Files / routes:
  - [app/(admin)/admin/dashboard/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/dashboard/page.tsx)
  - [app/api/internal/jobs/refresh-risk-holdbacks/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/internal/jobs/refresh-risk-holdbacks/route.ts)
  - [app/api/finance/disputes/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/finance/disputes/route.ts)
  - [lib/shipping/melhorenvio.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/melhorenvio.ts)
  - [app/api/stripe/payment-intent/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/payment-intent/route.ts)
  - [lib/checkout/paymentSessions.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/checkout/paymentSessions.ts)
- Acceptance:
  - risco, operacao e pagamentos funcionam em escala sem remendo manual

### Dependencies between squads
- `home` depends on `cliente`
  - personalizacao forte precisa de sinais melhores de lifecycle e recompra
- `lojista` depends on `home`
  - ads e promo engine dependem de vitrines e atribuicao
- `checkout` depends on `finance`
  - antifraude forte precisa de dados de dispute, holdback e reconciliation
- `admin` depends on all squads
  - command center so faz sentido com dominios maduros

## Delivery sequencing
1. Sprint 1 precisa fechar antes de chamar go-live serio.
2. Sprint 2 fecha operacao e pos-venda.
3. Sprint 3 aumenta escala, monetizacao e inteligencia.

## Release gate
- Sprint 1 verde: pode falar em go-live controlado
- Sprint 2 verde: pode falar em operacao madura
- Sprint 3 verde: pode falar em padrao marketplace grande
