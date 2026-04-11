# P0 Runbooks: Checkout, Frete, Chargeback e Reconciliação

## Objetivo
Padronizar a resposta operacional para os quatro incidentes que hoje mais impactam receita, confiança e liquidação:
- checkout
- frete
- chargeback
- reconciliação

## Checklist executavel
Use junto com:
- [57-P0-INCIDENT-EXECUTION-CHECKLISTS.md](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/57-P0-INCIDENT-EXECUTION-CHECKLISTS.md)
- [58-P0-INCIDENT-RECORD-TEMPLATES.md](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/58-P0-INCIDENT-RECORD-TEMPLATES.md)

## 1. Checkout

Checklist:
- [57-P0-INCIDENT-EXECUTION-CHECKLISTS.md#1-checkout](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/57-P0-INCIDENT-EXECUTION-CHECKLISTS.md)

### Gatilhos
- `POST /api/stripe/payment-intent` acima de 5% de erro em 15 minutos
- erro concentrado em `401`, `429`, `503` ou `500`
- queda brusca de conversão entre carrinho e intent

### Sinais primários
- Vercel function logs de [payment-intent route](C:\Users\Gleiser\Desktop\BELAPOPSITE\app\api\stripe\payment-intent\route.ts)
- smoke: `npm run smoke:checkout:hardening`
- Stripe dashboard:
  - `payment_intent.created`
  - `payment_intent.payment_failed`
  - `requires_action`

### Diagnóstico rápido
1. verificar `MELHORENVIO_TOKEN`
2. verificar `MELHORENVIO_FROM_POSTAL_CODE` e origem por seller
3. validar se a resposta está parando antes do Stripe com `SHIPPING_PROVIDER_NOT_CONFIGURED` ou `SHIPPING_QUOTE_FAILED`
4. validar se houve bloqueio por rate limit ou antifraude
5. confirmar se os `payment_method_types` retornados pelo Stripe batem com a UI

### Contenção
- se o problema for frete, manter o bloqueio antes do Stripe e expor mensagem operacional clara
- se o problema for método de pagamento, esconder o método indisponível na UI
- se o problema for volume/abuso, manter rate limit e revisar `idempotency`

### Critério de encerramento
- `npm run smoke:checkout:hardening` verde
- intent criado com payload real
- sem aumento anormal de `500/503` por 30 minutos

## 2. Frete

Checklist:
- [57-P0-INCIDENT-EXECUTION-CHECKLISTS.md#2-frete](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/57-P0-INCIDENT-EXECUTION-CHECKLISTS.md)

### Gatilhos
- `/api/shipping/quote` acima de 5% de erro em 15 minutos
- aumento de `SHIPPING_PROVIDER_NOT_CONFIGURED`
- divergência entre cotação do seller e total do checkout

### Sinais primários
- [melhorenvio.ts](C:\Users\Gleiser\Desktop\BELAPOPSITE\lib\shipping\melhorenvio.ts)
- [calculateShippingForSeller.ts](C:\Users\Gleiser\Desktop\BELAPOPSITE\lib\shipping\calculateShippingForSeller.ts)
- logs de `/api/shipping/quote`
- smoke manual com CEP real

### Diagnóstico rápido
1. validar credencial do Melhor Envio no ambiente
2. validar seller com origem postal preenchida
3. validar produto com peso/dimensões suficientes
4. confirmar se o erro está no provider ou na preparação da cotação

### Contenção
- não degradar para frete vindo do navegador
- falhar com código explícito e mensagem clara
- manter cotação apenas server-side

### Critério de encerramento
- cotação bem-sucedida para pelo menos 3 sellers reais
- checkout chegando ao `PaymentIntent`
- sem `503` do frete por 30 minutos

## 3. Chargeback

Checklist:
- [57-P0-INCIDENT-EXECUTION-CHECKLISTS.md#3-chargeback](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/57-P0-INCIDENT-EXECUTION-CHECKLISTS.md)

### Gatilhos
- evento Stripe de disputa/chargeback
- lançamento inconsistente no ledger
- ausência de `commission_reversal` ou `chargeback_fee` no drill-down

### Sinais primários
- [stripe webhook](C:\Users\Gleiser\Desktop\BELAPOPSITE\app\api\stripe\webhook\route.ts)
- [payment webhook](C:\Users\Gleiser\Desktop\BELAPOPSITE\app\api\webhooks\payment\route.ts)
- [chargebacks.ts](C:\Users\Gleiser\Desktop\BELAPOPSITE\lib\finance\chargebacks.ts)
- `/api/admin/finance?entryType=commission_reversal`
- `/api/admin/finance?entryType=chargeback_fee`

### Diagnóstico rápido
1. localizar `payment_intent_id`, `order_id` e `seller_id`
2. validar journals criados:
   - `chargeback`
   - `chargeback_fee`
   - `commission_reversal`
3. validar impacto em:
   - `marketplace_ledger_entries`
   - `ledger_transactions`
4. confirmar refletido no dashboard admin

### Contenção
- se o evento chegou mas o posting falhou, reprocessar o journal sem recriar pedido
- não corrigir por metadata do Stripe
- corrigir sempre a partir de snapshot/ledger persistido

### Critério de encerramento
- drill-down admin exibindo os tipos corretos
- journal balanceado
- staging validado com smoke de chargeback

## 4. Reconciliação

Checklist:
- [57-P0-INCIDENT-EXECUTION-CHECKLISTS.md#4-reconciliacao](c:/Users/Gleiser/Desktop/BELAPOPSITE/docs/codex-belapop-portal/57-P0-INCIDENT-EXECUTION-CHECKLISTS.md)

### Gatilhos
- `reconciliation_reports.status = warn|critical`
- diferença entre caixa, ledger e payout
- `reconciliation_issues` abertas

### Sinais primários
- SQL: `select public.run_reconciliation(current_date, 'stripe');`
- tabelas:
  - `reconciliation_reports`
  - `reconciliation_issues`
  - `marketplace_ledger_entries`
  - `ledger_transactions`
- `/api/admin/finance`

### Diagnóstico rápido
1. identificar provider e data do desvio
2. medir:
   - `cash_delta_cents`
   - `ledger_net_delta_cents`
   - `payout_delta_cents`
3. separar se o problema está em:
   - evento não ingerido
   - journal não criado
   - payout fora do snapshot

### Contenção
- congelar export/manual closeout se houver delta crítico
- abrir issue operacional com provider, data e referência
- não mascarar com ajuste manual fora do ledger

### Critério de encerramento
- report em `ok`
- `reconciliation_issues` resolvidas ou justificadas
- dashboard admin refletindo estado saudável

## Checklist de comunicação
- registrar incidente em `docs/codex-belapop-portal/`
- anotar:
  - janela do incidente
  - causa raiz
  - contenção
  - correção permanente
  - evidência de smoke pós-fix

## Smokes recomendados
- `npm run smoke:checkout:hardening`
- `npm run smoke:routes:auth`
- `npm run smoke:admin:prod`
- `npm run smoke:staging:chargeback`
