# P0 Incident Execution Checklists

Date: 2026-03-15
Scope: transformar os runbooks P0 em checklists operacionais executaveis por incidente.

Use este arquivo junto com:
- [56-P0-RUNBOOKS-CHECKOUT-FRETE-CHARGEBACK-RECONCILIACAO.md](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/56-P0-RUNBOOKS-CHECKOUT-FRETE-CHARGEBACK-RECONCILIACAO.md)
- [58-P0-INCIDENT-RECORD-TEMPLATES.md](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/58-P0-INCIDENT-RECORD-TEMPLATES.md)

## Como usar
1. abrir o incidente e registrar `owner`, `inicio`, `ambiente` e `severidade`
2. seguir o checklist do tipo correto
3. anexar evidencias minimas
4. fechar apenas com os criterios de encerramento marcados

## 1. Checkout

### Cabecalho do incidente
- [ ] `owner` definido
- [ ] `inicio` registrado
- [ ] ambiente registrado: `production` ou `staging`
- [ ] impacto registrado: `falha total`, `degradacao`, `metodo indisponivel`

### Diagnostico
- [ ] validar logs de [payment-intent route](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/payment-intent/route.ts)
- [ ] rodar `npm run smoke:checkout:hardening`
- [ ] verificar se a falha ocorre antes do Stripe ou depois do Stripe
- [ ] verificar `MELHORENVIO_TOKEN`
- [ ] verificar origem CEP por seller
- [ ] verificar `payment_method_types` retornados pelo `PaymentIntent`
- [ ] verificar se houve bloqueio por `429`, antifraude ou idempotencia

### Contencao
- [ ] se frete falhou: manter bloqueio antes do Stripe
- [ ] se metodo falhou: esconder metodo indisponivel na UI
- [ ] se abuso/volume: manter `429` e revisar sinais de risco
- [ ] registrar mensagem operacional exibida ao usuario

### Evidencia minima
- [ ] print ou log do erro principal
- [ ] resultado do smoke
- [ ] status final do `PaymentIntent` ou motivo de bloqueio antes dele

### Encerramento
- [ ] `npm run smoke:checkout:hardening` verde
- [ ] checkout volta a criar sessao/pedido pendente corretamente
- [ ] sem aumento anormal de `500/503` por 30 minutos

## 2. Frete

### Cabecalho do incidente
- [ ] `owner` definido
- [ ] `inicio` registrado
- [ ] seller(s) afetados registrados
- [ ] CEP(s) de teste registrados

### Diagnostico
- [ ] validar logs de `/api/shipping/quote`
- [ ] revisar [melhorenvio.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/melhorenvio.ts)
- [ ] revisar [calculateShippingForSeller.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/shipping/calculateShippingForSeller.ts)
- [ ] confirmar credencial do Melhor Envio no ambiente
- [ ] confirmar origem postal do seller
- [ ] confirmar peso e dimensoes do produto
- [ ] identificar se a falha esta no provider ou no preparo da cotacao

### Contencao
- [ ] nao degradar para frete vindo do navegador
- [ ] manter resposta explicita: `SHIPPING_PROVIDER_NOT_CONFIGURED`, `SHIPPING_QUOTE_FAILED` ou equivalente
- [ ] registrar seller e SKU usados no teste

### Evidencia minima
- [ ] 1 cotacao falha capturada
- [ ] 1 cotacao valida capturada, se houver recuperacao
- [ ] comparacao do total de frete antes/depois do fix

### Encerramento
- [ ] cotacao bem-sucedida para pelo menos 3 sellers reais
- [ ] checkout volta a chegar ao `PaymentIntent`
- [ ] sem `503` de frete por 30 minutos

## 3. Chargeback

### Cabecalho do incidente
- [ ] `owner` definido
- [ ] `inicio` registrado
- [ ] `payment_intent_id` registrado
- [ ] `order_id` registrado
- [ ] `seller_id` registrado

### Diagnostico
- [ ] revisar [stripe webhook](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/stripe/webhook/route.ts)
- [ ] revisar [payment webhook](c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/webhooks/payment/route.ts)
- [ ] revisar [chargebacks.ts](c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/finance/chargebacks.ts)
- [ ] confirmar journals:
  - [ ] `chargeback`
  - [ ] `chargeback_fee`
  - [ ] `commission_reversal`
- [ ] confirmar impacto em `marketplace_ledger_entries`
- [ ] confirmar impacto em `ledger_transactions`
- [ ] confirmar reflexo em `/api/admin/finance?entryType=commission_reversal`
- [ ] confirmar reflexo em `/api/admin/finance?entryType=chargeback_fee`

### Contencao
- [ ] se journal falhou: reprocessar sem recriar pedido
- [ ] nao corrigir por metadata do Stripe
- [ ] corrigir sempre por snapshot/ledger persistido

### Evidencia minima
- [ ] ids dos journals gerados
- [ ] drill-down admin com os tipos corretos
- [ ] journal balanceado

### Encerramento
- [ ] admin exibe `chargeback`, `chargeback_fee` e `commission_reversal`
- [ ] staging validado com `npm run smoke:staging:chargeback`
- [ ] checklist operacional arquivado no incidente

## 4. Reconciliacao

### Cabecalho do incidente
- [ ] `owner` definido
- [ ] `inicio` registrado
- [ ] provider registrado
- [ ] data-base do desvio registrada

### Diagnostico
- [ ] rodar `select public.run_reconciliation(current_date, 'stripe');`
- [ ] revisar `reconciliation_reports`
- [ ] revisar `reconciliation_issues`
- [ ] revisar `marketplace_ledger_entries`
- [ ] revisar `ledger_transactions`
- [ ] medir:
  - [ ] `cash_delta_cents`
  - [ ] `ledger_net_delta_cents`
  - [ ] `payout_delta_cents`
- [ ] classificar a origem: evento nao ingerido, journal ausente ou payout fora do snapshot

### Contencao
- [ ] congelar export/manual closeout se houver delta critico
- [ ] abrir issue operacional com provider, data e referencia
- [ ] nao mascarar com ajuste manual fora do ledger

### Evidencia minima
- [ ] report anterior com desvio
- [ ] report posterior ao fix
- [ ] lista de `reconciliation_issues` resolvidas ou justificadas

### Encerramento
- [ ] report em `ok`
- [ ] dashboard admin refletindo estado saudavel
- [ ] incidente registrado com causa raiz e acao permanente
