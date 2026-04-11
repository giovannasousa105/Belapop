# Templates de Notificacao (Texto Pronto)

## 1) Padroes

Variaveis (use `{{ }}`):
- `{{store_name}}`, `{{order_id}}`, `{{customer_city}}/{{customer_state}}`
- `{{sla_due_at}}`, `{{hours_remaining}}`
- `{{tracking_code}}`, `{{carrier}}`
- `{{product_title}}`, `{{sku}}`
- `{{lot_code}}`, `{{expiration_date}}`, `{{qty}}`
- `{{impact_amount}}`, `{{impact_orders}}`
- `{{dashboard_link}}`, `{{order_link}}`, `{{action_link}}`
- `{{support_link}}`

Tom: premium, direto, sem panico. Sempre com acao.

## 2) SLA vencendo hoje

### In-app (banner + item em Alertas)
- Titulo: `Pedido vencendo SLA hoje`
- Texto: `O pedido #{{order_id}} precisa ser postado ate {{sla_due_at}} (faltam {{hours_remaining}}h).`
- CTA primario: `Ver pedido`
- CTA secundario: `Marcar como pronto para envio`

### WhatsApp (curto)
`{{store_name}}, atencao: o pedido #{{order_id}} vence hoje as {{sla_due_at}} (faltam {{hours_remaining}}h).`
`Abra para despachar agora: {{order_link}}`

### Email
- Assunto: `{{store_name}} - Pedido #{{order_id}} vence hoje (SLA)`
- Corpo:

```text
Ola, {{store_name}}.
O pedido #{{order_id}} vence o SLA hoje as {{sla_due_at}} (faltam {{hours_remaining}}h).
Para evitar impacto na reputacao e no ranking, realize a postagem e registre o rastreio.

Acao recomendada: despachar agora

Ver pedido: {{order_link}}
Ver excecoes: {{dashboard_link}}
Se precisar de ajuda: {{support_link}}
```

## 3) Tracking pendente / ausente

### In-app
- Titulo: `Tracking pendente`
- Texto: `O pedido #{{order_id}} esta marcado como postado, mas ainda nao possui rastreio registrado.`
- CTA: `Adicionar rastreio`

### WhatsApp
`Pedido #{{order_id}} esta sem rastreio.`
`Cadastre o tracking para manter o SLA e evitar reclamacoes: {{order_link}}`

### Email
- Assunto: `{{store_name}} - Cadastre o rastreio do pedido #{{order_id}}`
- Corpo:

```text
Ola, {{store_name}}.
Identificamos que o pedido #{{order_id}} esta sem rastreio.
Cadastre o codigo para reduzir duvidas do cliente e evitar penalidades.

Adicionar rastreio: {{order_link}}
Ver pedidos sem rastreio: {{dashboard_link}}
```

## 4) Tracking parado (sem atualizacao)

### In-app
- Titulo: `Tracking sem atualizacao`
- Texto: `O rastreio {{tracking_code}} ({{carrier}}) do pedido #{{order_id}} esta sem movimento ha {{days_without_update}} dias.`
- CTA: `Abrir excecao`

### WhatsApp
`Rastreio parado: pedido #{{order_id}} ({{carrier}} / {{tracking_code}}) sem atualizacao ha {{days_without_update}} dias.`
`Veja e acione a transportadora: {{order_link}}`

### Email
- Assunto: `{{store_name}} - Tracking parado no pedido #{{order_id}}`
- Corpo:

```text
Ola, {{store_name}}.
O rastreio {{tracking_code}} ({{carrier}}) esta sem atualizacao ha {{days_without_update}} dias.
Recomendamos verificar com a transportadora para reduzir risco de devolucao/chargeback.

Ver pedido: {{order_link}}
Abrir excecoes: {{dashboard_link}}
```

## 5) Ruptura / risco de cancelamento por estoque

### In-app
- Titulo: `Estoque critico`
- Texto: `O SKU {{sku}} ({{product_title}}) esta com cobertura de {{days_coverage}} dias.`
- CTA: `Ajustar estoque`
- Secundario: `Pausar anuncios`

### WhatsApp
`Estoque critico: {{sku}} ({{product_title}}) com cobertura de {{days_coverage}} dias.`
`Evite cancelamentos: {{action_link}}`

### Email
- Assunto: `{{store_name}} - Estoque critico no SKU {{sku}}`
- Corpo:

```text
Ola, {{store_name}}.
O SKU {{sku}} ({{product_title}}) esta com cobertura de {{days_coverage}} dias.
Acao recomendada: repor estoque ou pausar campanhas para evitar cancelamentos.

Ver SKU: {{action_link}}
Ver painel de estoque: {{dashboard_link}}
```

## 6) Validade critica (cosmeticos)

### In-app
- Titulo: `Validade critica (lote)`
- Texto: `Lote {{lot_code}} do SKU {{sku}} vence em {{expiration_date}} ({{days_to_expire}} dias). Quantidade: {{qty}}.`
- CTA: `Criar queima inteligente`
- Secundario: `Pausar Ads do SKU`

### WhatsApp
`Validade critica: lote {{lot_code}} do SKU {{sku}} vence em {{days_to_expire}} dias ({{qty}} un).`
`Criar queima: {{action_link}}`

### Email
- Assunto: `{{store_name}} - Validade critica no lote {{lot_code}} ({{sku}})`
- Corpo:

```text
Ola, {{store_name}}.
O lote {{lot_code}} do SKU {{sku}} vence em {{expiration_date}} ({{days_to_expire}} dias). Quantidade: {{qty}}.

Recomendacao:
- Criar promocao de queima para reduzir perdas
- Evitar anunciar lote com validade curta

Criar queima: {{action_link}}
Ver lotes: {{dashboard_link}}
```

## 7) ROAS baixo / margem negativa (Ads)

### In-app
- Titulo: `Campanha com baixo retorno`
- Texto: `A campanha {{campaign_name}} esta com ROAS {{roas}} em {{window_days}} dias e margem pos-ads {{margin_after_ads}}.`
- CTA: `Revisar campanha`
- Secundario: `Pausar (com confirmacao)`

### WhatsApp
`Campanha {{campaign_name}} com ROAS {{roas}} e margem pos-ads {{margin_after_ads}}.`
`Revisar agora: {{action_link}}`

### Email
- Assunto: `{{store_name}} - Ajuste recomendado na campanha {{campaign_name}}`
- Corpo:

```text
Ola, {{store_name}}.
Detectamos baixo retorno na campanha {{campaign_name}}:
- ROAS: {{roas}} (janela: {{window_days}} dias)
- Margem pos-ads: {{margin_after_ads}}

Recomendacao: revisar segmentacao, orcamento ou pausar para evitar prejuizo.

Abrir campanha: {{action_link}}
Ver desempenho: {{dashboard_link}}
```

## 8) Repasse com divergencia

### In-app
- Titulo: `Divergencia no repasse`
- Texto: `Identificamos divergencia no repasse do periodo {{period_start}} a {{period_end}}.`
- CTA: `Ver conciliacao`
- Secundario: `Abrir disputa`

### WhatsApp
`Divergencia no repasse ({{period_start}}-{{period_end}}).`
`Ver detalhes e conciliar: {{action_link}}`

### Email
- Assunto: `{{store_name}} - Divergencia identificada no repasse`
- Corpo:

```text
Ola, {{store_name}}.
Identificamos uma divergencia no repasse do periodo {{period_start}} a {{period_end}}.
Recomendamos revisar a conciliacao por pedido e, se necessario, abrir disputa com evidencias.

Ver conciliacao: {{action_link}}
Abrir disputa: {{support_link}}
```
