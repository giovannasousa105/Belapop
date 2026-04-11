# Painel do Cliente - Contrato v1

## Objetivo
- Padronizar payloads de `ORDER`, `SUB_ORDER`, `TRACKING` e `TICKET`.
- Evitar status inconsistentes com derivacao de estado e transicoes validadas.
- Manter um contrato compativel com os JSONs de exemplo do painel do cliente.

## Payloads implementados em `/api/v1`

### `GET /api/v1/orders` e `GET /api/v1/orders/{order_id}`
- Retorna:
  - `order_id`, `order_number`, `created_at`, `currency`
  - `customer` (id, nome, cpf, email, phone_e164)
  - `payment` (status, method, paid_at, provider, provider_reference)
  - `delivery_address`
  - `totals` (items_subtotal, shipping_total, discount_total, grand_total)
  - `status` derivado dos subpedidos
  - `sub_orders[]` resumido por lojista

### `GET /api/v1/orders/{order_id}/sub-orders` e `GET /api/v1/sub-orders/{sub_order_id}`
- Retorna por subpedido:
  - `store`, `status`, `items[]`
  - `shipping` (carrier, tracking_code, posted_at, estimated_delivery_date)
  - `pricing`
  - `eligibility` (ticket/return)

### `GET /api/v1/tracking/by-order/{order_id}` e `GET /api/v1/tracking/by-sub-order/{sub_order_id}`
- Retorna timeline por lojista:
  - `sub_order_id`, `carrier`, `tracking_code`, `last_updated_at`, `current_status`
  - `events[]` com `status`, `label`, `occurred_at`, `location`
- Usa `shipments` + `shipment_events` quando existir.
- Se nao houver eventos reais, gera timeline fallback consistente.

### `GET|POST /api/v1/support/tickets`
- Lista retorna resumo com:
  - `ticket_id`, `protocol`, `order_id`, `sub_order_id`, `store_id`
  - `reason`, `desired_resolution`, `status`, `sla`, `description`
- Criacao grava ticket com status inicial `WAITING_STORE`.

### `GET|PATCH /api/v1/support/tickets/{ticket_id}`
- Retorna payload completo:
  - `protocol`, `sla`, `items`, `attachments`, `messages`
- `PATCH` valida transicoes de status (anti-bug).

### `GET|POST /api/v1/support/tickets/{ticket_id}/messages`
- Mensagens padronizadas:
  - `message_id`, `sender_type`, `text`, `attachment_ids`, `sent_at`

## Mapa de estados

### ORDER.status (derivado)
- `PAYMENT_PENDING` antes de pagamento.
- `PROCESSING` / `PARTIALLY_PROCESSING`.
- `SHIPPED` / `PARTIALLY_SHIPPED`.
- `DELIVERED` / `PARTIALLY_DELIVERED`.
- `REFUNDED` / `PARTIALLY_REFUNDED`.
- `CANCELLED`.

### SUB_ORDER.status (normalizado)
- `PROCESSING`, `READY_TO_SHIP`, `SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`
- `CANCELLED`
- `RETURN_REQUESTED`, `RETURN_IN_TRANSIT`, `RETURN_RECEIVED`, `REFUNDED`, `EXCHANGED`

### TICKET.status (transicao valida)
- `OPEN -> WAITING_STORE -> IN_REVIEW -> RESOLUTION_PROPOSED -> RESOLVED -> CLOSED`
- `WAITING_CUSTOMER -> IN_REVIEW`
- `ESCALATED` pode ser usado em casos criticos.
- `OPEN -> CANCELLED` permitido apenas sem acao da loja/suporte.

## Regras anti-bug
- `ORDER.status` nao depende de update manual, e sim da composicao dos `sub_orders`.
- Suporte sempre contextualizado por `sub_order_id` quando informado.
- Mensagem inicial do ticket guarda bootstrap do caso (reason, desired_resolution, itens, anexos).
- Status de ticket passa por validacao de transicao antes de persistir.
- Mensagem do cliente move automaticamente:
  - `WAITING_CUSTOMER -> WAITING_STORE`
  - `RESOLUTION_PROPOSED -> IN_REVIEW`

## State machine JSON
- Arquivo pronto para plugar no front/back:
  - `docs/codex-belapop-portal/36-CLIENT-STATE-MACHINES.json`
