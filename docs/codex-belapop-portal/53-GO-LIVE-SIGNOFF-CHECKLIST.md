# BelaPop Go-Live Signoff Checklist

Date: 2026-03-12
Use this checklist for signoff before claiming marketplace-grade go-live.

## home — Growth / Editorial Commerce
- [ ] Home mostra frete, troca, suporte e pagamentos de forma explicita
- [ ] Home mostra marcas em destaque
- [ ] Home mostra vitrines por necessidade comercial
- [ ] Home mostra prova social acionavel
- [ ] PDP comunica confianca comercial antes do checkout
- Signoff owner:
- Signoff date:

## cliente — CX / Pos-venda
- [ ] Recompra real por pedido/item implementada
- [ ] Timeline/rastreio por lojista baseada em eventos reais
- [ ] Mensagens unificadas entre pedido, suporte e notificacoes
- [ ] Self-service de devolucao/reembolso funcional
- [ ] Pos-venda mostra refund/status sem depender de atendimento manual
- Signoff owner:
- Signoff date:

## lojista — Seller Ops / Seller Success
- [ ] Nao ha modulos proxy em areas criticas
- [ ] Bulk actions e CSV disponiveis
- [ ] Extrato financeiro real de ledger disponivel
- [ ] Reputacao, SLA, cancelamento e devolucao first-class
- [ ] Seller opera logistica sem workaround manual
- Signoff owner:
- Signoff date:

## admin — Marketplace Ops / BI
- [ ] Dashboard executivo sem `mockDashboard`
- [ ] Nao existe endpoint legado concorrendo com a camada principal
- [ ] Filas operacionais acionaveis no dashboard
- [ ] `/admin/customers` deixou de ser placeholder
- [ ] Curadoria, finance e evidence possuem drill-down real
- Signoff owner:
- Signoff date:

## checkout — Payments / Platform
- [ ] Frete live chega ao `PaymentIntent` real em producao
- [ ] UI exibe apenas meios de pagamento reais do Stripe
- [ ] Idempotencia e rate limit validados
- [ ] Antifraude basico ativo e auditavel
- [ ] Smoke de checkout sem stub verde
- Signoff owner:
- Signoff date:

## ops — Logistics / Support Ops
- [ ] Promessas de frete, troca e suporte visiveis para o usuario
- [ ] Logistica reversa com excecao e SLA operacional
- [ ] Runbooks de checkout, frete, chargeback e reconciliation publicados
- [ ] Time operacional consegue atuar sem SQL manual
- Signoff owner:
- Signoff date:

## finance — Finance Ops / Risk
- [ ] Ledger fecha e reconciliation roda sem discrepancia critica
- [ ] `chargeback`, `commission_reversal` e `chargeback_fee` validados operacionalmente
- [ ] Drill-down por provider e issue disponivel
- [ ] Exportacoes placeholder removidas ou substituidas por export real
- [ ] Holdbacks e payouts tem trilha auditavel
- Signoff owner:
- Signoff date:

## Final gate
- [ ] Checkout sem stub, com frete real e smoke verde ate `PaymentIntent`
- [ ] Admin sem mock disfarcado
- [ ] Lojista sem proxy em areas criticas
- [ ] Cliente com recompra, rastreio e pos-venda reais
- [ ] Finance com ledger, reconciliation e chargeback operacionalizados
- [ ] Ops com promessas e excecoes visiveis

Go-live approved by:
Date:
