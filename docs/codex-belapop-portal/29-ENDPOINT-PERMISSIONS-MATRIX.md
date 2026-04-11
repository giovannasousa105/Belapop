# Mapa de Permissoes por Endpoint

## Roles
- Admin: acesso total (regras, export sensivel, score, configuracoes).
- Operacao: pedidos, envios, tracking, excecoes, estoque operacional.
- Financeiro: repasses, conciliacao, disputas, export financeiro.

Observacao:
- No estado atual do projeto, `user_roles` usa `customer|seller|admin`.
- `operation` e `finance` podem ser introduzidos por migration de roles ou mapeados por escopos internos.

## Matriz

### Dashboard
`GET /dashboard/home`
- Admin: ✅
- Operacao: ✅ (opcional mascarar valores financeiros)
- Financeiro: ✅

### Pedidos / Envios
`GET /orders`
- Admin: ✅
- Operacao: ✅
- Financeiro: ✅ (somente leitura quando aplicavel)

`POST /orders/{order_id}/add-tracking`
- Admin: ✅
- Operacao: ✅
- Financeiro: ❌

`POST /shipments/{shipment_id}/update-tracking`
- Admin: ✅
- Operacao: ✅
- Financeiro: ❌

### Regras / Alertas
`GET /alert-rules`
- Admin: ✅
- Operacao: ✅ (leitura)
- Financeiro: ✅ (leitura)

`POST /alert-rules`
- Admin: ✅
- Operacao: ✅ (regras operacionais)
- Financeiro: ✅ (regras financeiras, se habilitado)

### Score / Ranking
`GET /stores/{store_id}/logistics-score`
- Admin: ✅
- Operacao: ✅
- Financeiro: ✅

### Estoque / Lotes
`POST /lots/{lot_id}/create-queima`
- Admin: ✅
- Operacao: ✅ (se permitido pelo negocio)
- Financeiro: opcional (governanca de desconto)

### Webhooks (publicos com assinatura)
`POST /webhooks/payment`
- Publico: ✅ (`X-Signature` + `X-Timestamp` obrigatorios)

`POST /webhooks/carrier`
- Publico: ✅ (`X-Signature` + `X-Timestamp` obrigatorios)

## Politica recomendada
- Operacao cria regras de SLA/tracking/estoque.
- Financeiro cria regras de repasse/divergencia.
- Alteracoes de desconto/campanha: Admin (ou Admin + Marketing).
