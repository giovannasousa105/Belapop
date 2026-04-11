# Wireframe ASCII + Mock Textual

## Home Enterprise (cada lojista envia)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR                                                                                       │
│ [Logo]  Home  Pedidos  Produtos  Estoque&Validade  Campanhas  Atendimento  Financeiro  ...   │
│ Search: [ Pedido, SKU, Produto, Cliente ]   [Alertas]   [Criar Promocao] [Adicionar Produto] │
│ Filters: Periodo [MTD] Canal [Todos] UF/Cidade [SP/Sao Paulo] Categoria [Todas]              │
│         Comparar [Periodo anterior]   [Salvar visao]   Atualizado ha: 3 min                  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR      │ MAIN (Grid 12 cols)                                                           │
│ ▸ Visao Geral│                                                                              │
│   Pedidos    │  STATUS DO NEGOCIO (cards clicaveis, abrem Drawer)                            │
│   Produtos   │  ┌───────────────┬───────────────┬───────────────┬───────────────┐          │
│   Estoque    │  │ SLA Hoje       │ Vencendo 24h  │ Tracking pend. │ Cancel. ruptura│         │
│   Campanhas  │  │ 96.2%  (+1.3)  │ 12 pedidos     │ 8 pedidos      │ 1.8%  (-0.2) │         │
│   Atendimento│  │ [Ver excecoes] │ [Despachar]   │ [Adicionar]    │ [Ver motivos]│         │
│   Financeiro │  └───────────────┴───────────────┴───────────────┴───────────────┘         │
│   Reputacao  │  ┌───────────────┬───────────────┬───────────────┬───────────────┐          │
│   Relatorios │  │ GMV (R$)       │ Receita liq.  │ Conversao      │ Validade critica│        │
│   Config     │  │ 128.540 (+8%)  │ 103.220 (+6%) │ 1.92% (-0.1)  │ 3 lotes <30d   │        │
│              │  │ [Detalhar]     │ [Conciliacao] │ [Ver funil]    │ [Criar queima] │        │
│              │  └───────────────┴───────────────┴───────────────┴───────────────┘         │
│              │                                                                              │
│              │  ┌───────────────────────────────────────┬─────────────────────────────────┐ │
│              │  │ FUNIL & SERIES (cols 1-8)              │ ATENCAO AGORA (cols 9-12)       │ │
│              │  │ [Aba: 30d] [Comparar]                  │ 1) 5 pedidos vencem em 2h       │ │
│              │  │ Linha: GMV + Pedidos                   │    Impacto: R$ 1.240             │ │
│              │  │ Funil: Sessoes->PDP->ATC->Checkout->Pago│   [Resolver] [Notificar cliente]│ │
│              │  │ Vazamento: ATC->Checkout (-18%)        │ 2) Tracking parado 4 dias        │ │
│              │  │ Sugestao: Ajustar frete/parcelamento   │    3 pedidos | [Abrir excecoes]  │ │
│              │  └───────────────────────────────────────┴─────────────────────────────────┘ │
│              │                                                                              │
│              │  ┌───────────────────────────────────┬──────────────────────────────────────┐│
│              │  │ PEDIDOS: EXCECOES (cols 1-6)      │ TOP SKUs EM RISCO (cols 7-12)        ││
│              │  │ Filtros: [Sem tracking] [Vence hoje]│ [Cobertura <7d] [Validade <60d]    ││
│              │  │ Acoes lote: [Gerar etiqueta] [Notificar] [Exportar CSV]                   ││
│              │  └───────────────────────────────────┴──────────────────────────────────────┘│
│              │                                                                              │
│              │  ┌───────────────────────────┬──────────────────────────┬───────────────────┐│
│              │  │ TRANSPORTADORAS            │ VALIDADE & LOTE          │ FINANCEIRO RAPIDO ││
│              │  │ Correios: atraso 12%       │ <90d: 120 un             │ Saldo a receber   ││
│              │  │ Jadlog: atraso 8%          │ <60d: 40 un              │ R$ 12.340         ││
│              │  │ [Ver relatorio]            │ <30d: 12 un              │ Prox. repasse     ││
│              │  │                            │ [Criar queima inteligente]│ [Ver extrato]    ││
│              │  └───────────────────────────┴──────────────────────────┴───────────────────┘│
└──────────────┴──────────────────────────────────────────────────────────────────────────────┘
```

## Labels / microcopy

### Cards
- SLA Hoje
- Pedidos vencendo em 24h
- Tracking pendente
- Cancelamento por ruptura
- Receita liquida
- Conversao (checkout)
- Validade critica
- Saldo a receber

### Atencao agora
- Impacto estimado
- Por que isso importa
- Resolver agora
- Criar regra
- Silenciar 24h
- Ver lista

### Pedidos: Excecoes
- Sem tracking
- Tracking parado
- Endereco incompleto
- Aguardando confirmacao
- Vence hoje
- Adicionar rastreio
- Gerar etiqueta
- Enviar mensagem
- Abrir disputa

### Validade
- Lote
- Validade
- Quantidade
- Risco de perda
- Criar queima inteligente
