# Eventos, Webhooks e Automations (Exemplos)

## 1) Webhook de pagamento aprovado

`POST /webhooks/payment`

```json
{
  "event": "payment.approved",
  "event_id": "pay_9f3b0c0a-7e2f-4b10-9a65-8d6e2c2a2f50",
  "occurred_at": "2026-03-03T10:12:08-03:00",
  "data": {
    "order_id": "9d7b9f1a-3acb-4e7c-9d56-0b2c0cf3c9b1",
    "store_id": "d0ccf6fa-4f7c-4f19-8f77-88f4a394a95e",
    "amount": 129.90,
    "currency": "BRL",
    "payment_method": "pix",
    "provider": "your_gateway",
    "provider_reference": "GW-883920193"
  }
}
```

Acoes internas esperadas:
- `orders.status = paid`
- `orders.payment_approved_at = now()`
- calcular `sla_due_at` com `store_settings` (cutoff + business days)
- emitir `order.payment.approved` em `order_events`

## 2) Webhook de tracking update

`POST /webhooks/carrier`

```json
{
  "event": "shipment.tracking.updated",
  "event_id": "trk_3c2f54c1-95d7-4f77-9c10-0b9e2a2d9f0e",
  "occurred_at": "2026-03-03T18:55:03-03:00",
  "data": {
    "shipment_id": "0c4f651a-63ae-4bfb-83a8-3fe2ff2f9659",
    "order_id": "9d7b9f1a-3acb-4e7c-9d56-0b2c0cf3c9b1",
    "carrier": "Jadlog",
    "tracking_code": "JD123456789BR",
    "status": "in_transit",
    "status_details": "Objeto em transferencia",
    "location": "Sao Paulo/SP",
    "occurred_at": "2026-03-03T18:40:00-03:00",
    "raw": {
      "provider": "melhor_envio",
      "provider_status_code": "IT"
    }
  }
}
```

Acoes internas:
- inserir em `shipment_events`
- atualizar `shipments.current_status` e `shipments.last_status_at`
- transicionar `orders.operational_status` para `em_transito` quando aplicavel
- avaliar alerta de tracking parado via scheduler

## 3) Evento interno de SLA vencendo

```json
{
  "event": "order.sla.due",
  "event_id": "sla_0c9f2a11-36d8-4a33-8f0f-2c1b9ed5d0b2",
  "occurred_at": "2026-03-03T09:00:00-03:00",
  "data": {
    "order_id": "9d7b9f1a-3acb-4e7c-9d56-0b2c0cf3c9b1",
    "store_id": "d0ccf6fa-4f7c-4f19-8f77-88f4a394a95e",
    "sla_due_at": "2026-03-03T14:00:00-03:00",
    "hours_remaining": 5,
    "current_operational_status": "separando"
  }
}
```

Acoes:
- criar `alerts` com `severity=warning` e `type=sla_due`
- notificar por canais configurados (in-app/email/whatsapp)

## 4) Automation rule: pedido sem tracking

Condition:

```json
{
  "type": "tracking_missing",
  "criteria": {
    "operational_status": "postado",
    "missing_tracking_for_hours": 12
  }
}
```

Action:

```json
{
  "type": "notify_and_create_alert",
  "channels": ["in_app", "email"],
  "severity": "critical",
  "template": "tracking_missing_critical",
  "cooldown_minutes": 180
}
```

## 5) Automation: validade < 30 dias

Condition:

```json
{
  "type": "lot_expiration_risk",
  "criteria": {
    "days_to_expire_lte": 30,
    "min_quantity_gte": 10
  }
}
```

Action:

```json
{
  "type": "recommend_campaign",
  "campaign_template": "queima_inteligente",
  "defaults": {
    "discount_percent": 20,
    "duration_days": 5,
    "placement": ["search_boost", "vitrine"]
  }
}
```

## 6) Automation: ROAS baixo + margem negativa

Condition:

```json
{
  "type": "ads_underperforming",
  "criteria": {
    "window_days": 3,
    "roas_lte": 1.2,
    "margin_after_ads_lte": 0
  }
}
```

Action:

```json
{
  "type": "pause_ads_with_confirmation",
  "channels": ["in_app"],
  "requires_confirmation": true,
  "message": "Campanha com ROAS baixo e margem negativa. Pausar para evitar prejuizo?"
}
```
