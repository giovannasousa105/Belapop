# RBAC Seller Enterprise (ADMIN / OPERACAO / FINANCEIRO)

## Objetivo
- Velocidade com roles simples.
- Seguranca com granularidade apenas no que impacta dinheiro, LGPD e governanca.
- Auditabilidade em acoes criticas.

## Roles
- `ADMIN`: allow-all.
- `OPERACAO`: pedidos/SLA/tracking/estoque/atendimento.
- `FINANCEIRO`: repasses/conciliacao/disputas/export financeiro.

## Permissoes granulares (12)
- `finance.view_details`
- `finance.export`
- `finance.open_dispute`
- `finance.approve_adjustment`
- `promo.create`
- `promo.pause`
- `promo.max_discount_percent` (number)
- `ads.budget_change`
- `users.manage_roles`
- `audit.view`
- `settings.edit_store`
- `pii.view_full`

## Defaults de politica
- ADMIN: todas as permissoes.
- OPERACAO: `promo.create=true`, `promo.pause=true`, `ads.budget_change=true`, `promo.max_discount_percent=15`.
- FINANCEIRO: `finance.*=true`, `promo.max_discount_percent=0`, promo/ads desligado.

## Policy engine (implementado)
Arquivo:
- [sellerPolicy.ts](/c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/rbac/sellerPolicy.ts)

Regras:
1. `role=ADMIN` => permitido.
2. Demais roles: checagem por role de modulo.
3. Acoes criticas exigem permissao.
4. Permissao numerica valida limite (`promo.max_discount_percent`).
5. LGPD: se sem `pii.view_full`, mascarar email/telefone.

## Endpoints com check
- `GET /api/dashboard/home`
- `GET /api/orders`
- `POST /api/orders/{order_id}/add-tracking`
- `POST /api/shipments/{shipment_id}/update-tracking`
- `GET/POST /api/alert-rules`
- `GET /api/stores/{store_id}/logistics-score`
- `POST /api/lots/{lot_id}/create-queima`
- `GET /api/finance/reconciliation`
- `GET /api/finance/export`
- `POST /api/finance/disputes`
- `POST /api/promos/{id}/pause`
- `POST /api/users/{id}/role`
- `GET /api/audit/logs`
- `PATCH /api/store/settings`

## Auditoria obrigatoria (implementada)
Helper:
- [auditLog.ts](/c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/rbac/auditLog.ts)

Campos gravados:
- `actor_user_id` (`actor_id`)
- `role`
- `permission_used`
- `before_state`
- `after_state`
- `timestamp` (`created_at`)
- `ip_address`
- `user_agent`

## Migrations
- [20260303_0300_seller_rbac_permissions.sql](/c:/Users/Gleiser/Desktop/BELAPOPSITE/supabase/migrations/20260303_0300_seller_rbac_permissions.sql)
- [20260303_0310_seller_audit_log_hardening.sql](/c:/Users/Gleiser/Desktop/BELAPOPSITE/supabase/migrations/20260303_0310_seller_audit_log_hardening.sql)
