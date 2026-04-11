# BelaPop Sprint 1 Execution Checklist

Date: 2026-03-12
Source references:
- `50-GO-LIVE-ROADMAP-EXECUTABLE.md`
- `51-TECHNICAL-BACKLOG-BY-FILE-ROUTE.md`
- `54-SPRINT-EXECUTION-PLAN.md`

Goal: fechar o P0 transacional e remover mascaramento operacional antes de chamar go-live serio.

## Sprint 1 scope
- Melhor Envio live em producao
- matriz real de meios de pagamento Stripe
- dashboard admin sem mock mascarando falha real
- endpoint legado de dashboard aposentado
- chargeback operacional validado
- export placeholder removido ou funcional
- promessas operacionais visiveis na home e PDP
- runbooks criticos publicados

## Owners por frente
- `checkout`: Payments / Platform
- `admin`: Marketplace Ops / BI
- `finance`: Finance Ops / Risk
- `ops`: Logistics / Support Ops
- `home`: Growth / Editorial Commerce

## Ordem de implementacao por dia

### Dia 1
- `checkout`: configurar Melhor Envio real em producao
- `checkout`: validar origem CEP por seller
- `checkout`: rerodar smoke ate `PaymentIntent`

### Dia 2
- `checkout`: alinhar matriz real de meios de pagamento Stripe
- `checkout`: remover qualquer oferta de metodo indisponivel na UI

### Dia 3
- `admin`: remover fallback `mockDashboard`
- `admin`: colocar estado degradado explicito
- `admin`: mapear e matar consumidores do endpoint legado

### Dia 4
- `finance`: validar chargeback, `commission_reversal` e `chargeback_fee`
- `finance`: trocar export placeholder por export real ou remover CTA

### Dia 5
- `ops/home`: publicar barra de confianca comercial na home
- `ops/home`: publicar promessas de frete/troca/suporte na PDP
- `ops`: publicar runbooks criticos

### Dia 6
- rerodar smoke consolidado de Sprint 1
- revisar checklist de aceite
- registrar evidencias em `docs/`

## Checklist tecnico executavel

### 1. Melhor Envio live em producao
- [ ] Definir `MELHORENVIO_TOKEN` real na Vercel
- [ ] Validar origem CEP por seller no banco
- [ ] Confirmar que nenhum seller ativo relevante esta sem CEP
- [ ] Confirmar que `/api/shipping/quote` sai de `503 SHIPPING_PROVIDER_NOT_CONFIGURED`
- [ ] Confirmar que `/api/stripe/payment-intent` chega ao `PaymentIntent`

Owner tecnico:
- Files / routes:
  - [app/api/stripe/payment-intent/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/payment-intent/route.ts)
  - [lib/checkout/serverCheckout.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/checkout/serverCheckout.ts)
  - [lib/shipping/melhorenvio.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/melhorenvio.ts)
  - [lib/shipping/calculateShippingForSeller.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/calculateShippingForSeller.ts)
  - [app/api/shipping/quote/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/shipping/quote/route.ts)

Smoke de aceite:
- `POST /api/shipping/quote` autenticado com CEP real -> `200`
- `POST /api/stripe/payment-intent` autenticado -> `200`
- sem stub

### 2. Matriz real de meios de pagamento Stripe
- [ ] Ler `payment_method_types` reais do `PaymentIntent`
- [ ] Remover da UI qualquer metodo nao suportado
- [ ] Validar conta/ambiente BRL
- [ ] Garantir coerencia entre `/checkout` e `/conta/pagamentos`

Owner tecnico:
- Files / routes:
  - [app/api/stripe/payment-intent/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/payment-intent/route.ts)
  - [app/checkout/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/checkout/page.tsx)
  - [components/StripeCheckoutDemo.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/StripeCheckoutDemo.tsx)
  - [components/customer/CustomerPaymentMethodsPanel.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/customer/CustomerPaymentMethodsPanel.tsx)

Smoke de aceite:
- checkout autenticado cria `PaymentIntent`
- UI so mostra metodos presentes em `payment_method_types`

### 3. Dashboard admin sem mock
- [ ] Remover `mockDashboard` do caminho principal
- [ ] Criar estado degradado explicito
- [ ] Logar e observar falha de fonte real
- [ ] Garantir que KPI nao inventa dado em incidente

Owner tecnico:
- Files / routes:
  - [app/(admin)/admin/dashboard/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/dashboard/page.tsx)
  - [lib/admin/dashboardMetrics.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/admin/dashboardMetrics.ts)
  - [lib/admin/mock.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/admin/mock.ts)

Smoke de aceite:
- simular falha de fonte real
- `/admin/dashboard` continua renderizando com estado degradado, sem mock visual

### 4. Endpoint legado de dashboard aposentado
- [ ] Identificar consumidores reais
- [ ] Redirecionar ou remover consumo do endpoint antigo
- [ ] Marcar o endpoint antigo como deprecated ou remover

Owner tecnico:
- Files / routes:
  - [app/api/admin/dashboard/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/dashboard/route.ts)
  - [app/(admin)/admin/dashboard/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/dashboard/page.tsx)

Smoke de aceite:
- smoke admin passa sem depender do endpoint simplista

### 5. Chargeback operacional validado
- [ ] Gerar chargeback sintetico controlado em staging
- [ ] Verificar `chargeback`
- [ ] Verificar `commission_reversal`
- [ ] Verificar `chargeback_fee`
- [ ] Validar filtros dedicados em `/admin/finance`

Owner tecnico:
- Files / routes:
  - [app/api/stripe/webhook/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/webhook/route.ts)
  - [app/api/webhooks/payment/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/webhooks/payment/route.ts)
  - [app/api/admin/finance/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/admin/finance/route.ts)
  - [app/(admin)/admin/finance/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/finance/page.tsx)
  - [lib/finance/chargebacks.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/finance/chargebacks.ts)

Smoke de aceite:
- `npm run smoke:staging:chargeback`
- `/api/admin/finance?entryType=commission_reversal` -> `200`
- `/api/admin/finance?entryType=chargeback_fee` -> `200`

### 6. Export placeholder removido ou funcional
- [ ] Localizar CTAs `Exportar CSV` sem backend
- [ ] Ligar a export real ou remover CTA
- [ ] Garantir feedback de download/erro

Owner tecnico:
- Files / routes:
  - [app/(admin)/admin/finance/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/finance/page.tsx)
  - [app/api/finance/export/route.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/finance/export/route.ts)
  - [components/admin/dashboard/ShippingMonitorSection.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/components/admin/dashboard/ShippingMonitorSection.tsx)

Smoke de aceite:
- CTA dispara export real ou nao existe mais

### 7. Promessas operacionais visiveis na home e PDP
- [ ] Adicionar service bar na home
- [ ] Adicionar bloco de promessa na PDP
- [ ] Revisar copy legal/comercial

Owner tecnico:
- Files / routes:
  - [app/(public)/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/page.tsx)
  - [app/(public)/produto/[slug]/page.tsx](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(public)/produto/[slug]/page.tsx)

Smoke de aceite:
- `/` e `/produto/[slug]` exibem frete, troca, suporte e pagamentos visivelmente

### 8. Runbooks criticos publicados
- [ ] Runbook checkout
- [ ] Runbook shipping
- [ ] Runbook chargeback
- [ ] Runbook reconciliation

Owner tecnico:
- Files:
  - `new`: `docs/codex-belapop-portal/55A-RUNBOOK-CHECKOUT.md`
  - `new`: `docs/codex-belapop-portal/55B-RUNBOOK-SHIPPING.md`
  - `new`: `docs/codex-belapop-portal/55C-RUNBOOK-CHARGEBACK.md`
  - `new`: `docs/codex-belapop-portal/55D-RUNBOOK-RECONCILIATION.md`

Smoke de aceite:
- links publicados no indice de docs
- procedimento executavel sem ambiguidade

## Dependencias entre squads
- `checkout` -> `ops`
  - frete real depende de politica/logistica valida
- `finance` -> `checkout`
  - sem fluxo live consistente, chargeback operacional vira simulacao eterna
- `admin` -> `finance`
  - dashboard sem mock depende de metricas confiaveis e degradacao desenhada
- `home` -> `ops`
  - promessa comercial so deve ser publicada com operacao sustentando

## Gate de aceite da Sprint 1
- [ ] frete live funcionando em producao
- [ ] checkout chega ao `PaymentIntent` real sem stub
- [ ] dashboard admin sem `mockDashboard`
- [ ] endpoint legado simplista aposentado
- [ ] chargeback operacional validado
- [ ] export placeholder removido ou funcional
- [ ] home e PDP com promessas operacionais visiveis
- [ ] runbooks publicados

Sprint 1 approved by:
Date:
