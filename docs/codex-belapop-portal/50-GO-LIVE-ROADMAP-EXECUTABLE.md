# BelaPop Go-Live Roadmap Executable

Date: 2026-03-12
Scope: Home publica, painel cliente, painel lojista/parceiro, painel admin, checkout, ops e finance.

## Status legend
- `planned`: ainda nao iniciado
- `in_progress`: em execucao
- `blocked`: depende de credencial, integracao, dado ou decisao externa
- `done`: concluido e validado

## Donos por frente
- `home`: Growth / Editorial Commerce
- `cliente`: CX / Pos-venda
- `lojista`: Seller Ops / Seller Success
- `admin`: Marketplace Ops / BI
- `checkout`: Payments / Platform
- `ops`: Logistics / Support Ops
- `finance`: Finance Ops / Risk

## P0 Go-Live
| ID | Frente | Owner | Entrega | Status | Risco | Dependencias | Criterio de aceite |
|---|---|---|---|---|---|---|---|
| P0-01 | checkout | Payments / Platform | Melhor Envio real em producao | blocked | critico | `MELHORENVIO_TOKEN` valido, origem CEP por seller | checkout chega ao `PaymentIntent` real sem stub em producao |
| P0-02 | checkout | Payments / Platform | Matriz real de meios de pagamento Stripe | in_progress | alto | capabilities ativas na conta Stripe | UI exibe apenas metodos retornados pelo `PaymentIntent` |
| P0-03 | admin | Marketplace Ops / BI | Remover fallback mock do dashboard executivo | planned | alto | unificacao de fontes reais | dashboard nao usa `mockDashboard` em incidente; exibe degradacao explicita |
| P0-04 | admin | Marketplace Ops / BI | Desativar endpoint legado simplista de dashboard | planned | medio | migracao dos consumidores internos | existe uma unica narrativa de metricas admin |
| P0-05 | cliente | CX / Pos-venda | Recompra real por pedido/item | planned | alto | endpoint de reorder, carrinho server-side | CTA `Comprar de novo` recompra SKU real do pedido |
| P0-06 | cliente | CX / Pos-venda | ETA e timeline por lojista baseados em eventos | planned | alto | tracking completo por subpedido | pedido mostra milestones e excecoes reais |
| P0-07 | lojista | Seller Ops / Seller Success | Remover modulos proxy de reviews e trafego | planned | medio | eventos reais ou hide flags | nenhuma aba critica depende de proxy disfarcado |
| P0-08 | finance | Finance Ops / Risk | Validar chargeback, `commission_reversal` e `chargeback_fee` com fluxo operacional | in_progress | alto | staging com fluxo financeiro completo | ledger, reconciliation e admin mostram os tres tipos com dados reais |
| P0-09 | ops | Logistics / Support Ops | Promessa visivel de frete/troca/suporte na home e PDP | planned | medio | copy final e dados operacionais | usuario ve SLA, troca e suporte antes do checkout |
| P0-10 | ops | Logistics / Support Ops | Runbooks para checkout, frete, chargeback e reconciliation | planned | medio | docs e handoff operacional | incidentes P0/P1 possuem runbook publicado |
| P0-11 | home | Growth / Editorial Commerce | Barra de confianca comercial | planned | medio | copy e design final | home mostra frete, trocas, suporte e pagamentos |
| P0-12 | finance | Finance Ops / Risk | Remover/exportar CTAs placeholder | planned | baixo | endpoints/exportacao reais | nenhum CTA de export faz nada vazio |

## P1 30 dias
| ID | Frente | Owner | Entrega | Status | Risco | Dependencias | Criterio de aceite |
|---|---|---|---|---|---|---|---|
| P1-01 | home | Growth / Editorial Commerce | Bloco de marcas em destaque | planned | baixo | curation de brands | home mostra marcas com pagina/vitrine navegavel |
| P1-02 | home | Growth / Editorial Commerce | Vitrines por necessidade comercial | planned | medio | tags/collections bem mapeadas | acne, barreira, manchas, sensibilidade e perfumes com entrada clara |
| P1-03 | cliente | CX / Pos-venda | Central unica de mensagens | planned | medio | consolidacao de notificacoes e tickets | usuario acompanha pedido, suporte e mensagens em um fluxo so |
| P1-04 | cliente | CX / Pos-venda | Self-service de devolucao/reembolso | planned | alto | returns state machine, finance status | cliente acompanha devolucao e refund sem depender de atendimento |
| P1-05 | cliente | CX / Pos-venda | Recompra recorrente e rotina | planned | medio | rotina/carrinho assinavel | rotina e historico permitem recompra em lote |
| P1-06 | lojista | Seller Ops / Seller Success | Bulk actions e CSV | planned | alto | endpoints batch, validacao | seller atualiza estoque/preco/status em lote |
| P1-07 | lojista | Seller Ops / Seller Success | Extrato financeiro de ledger | planned | alto | views financeiras seller-safe | seller ve extrato, filtros e conciliacao por lancamento |
| P1-08 | lojista | Seller Ops / Seller Success | Reputacao first-class | planned | medio | score, SLA, devolucao, reviews reais | seller entende score, causa e impacto na exposicao |
| P1-09 | admin | Marketplace Ops / BI | Filas operacionais acionaveis | planned | alto | fontes reais por dominio | admin opera pedidos, sellers, catalogo e suporte por fila |
| P1-10 | admin | Marketplace Ops / BI | Modulo de clientes real | planned | medio | dados de cliente, pedidos, suporte, risco | `/admin/customers` deixa de ser placeholder |
| P1-11 | ops | Logistics / Support Ops | Logistica reversa com excecao e SLA | in_progress | alto | reverse logistics, support ops | devolucao tem fila, excecao, SLA e historico |
| P1-12 | finance | Finance Ops / Risk | Drill-down de reconciliation por provider e issue | in_progress | medio | reports/issues ja aplicados | time financeiro resolve issue sem consultar SQL bruto |

## P2 60-90 dias
| ID | Frente | Owner | Entrega | Status | Risco | Dependencias | Criterio de aceite |
|---|---|---|---|---|---|---|---|
| P2-01 | home | Growth / Editorial Commerce | Personalizacao plena na home | in_progress | medio | discovery engine, events, collections | cada usuario ve vitrines personalizadas com relevancia real |
| P2-02 | home | Growth / Editorial Commerce | Social proof forte | planned | medio | reviews e best sellers reais | home mostra prova social acionavel |
| P2-03 | cliente | CX / Pos-venda | Wallet, beneficios e fidelidade | planned | medio | regra comercial e finance | cliente ve creditos, saldo e beneficios |
| P2-04 | cliente | CX / Pos-venda | Timeline nivel Amazon | planned | alto | eventos logisticos completos | tentativa de entrega, excecao, refund e suporte em uma timeline |
| P2-05 | lojista | Seller Ops / Seller Success | Ads e promo engine | planned | medio | campanhas, atribuicao, billing | seller cria campanha e mede retorno |
| P2-06 | lojista | Seller Ops / Seller Success | Catalogo avancado com variacoes e kits | planned | alto | schema de variantes, media, taxonomia | seller publica SKU complexo sem workaround |
| P2-07 | admin | Marketplace Ops / BI | Command center unificado | planned | medio | unificacao de monitoracao e filas | risco, ops, finance e suporte cabem em uma superficie executiva |
| P2-08 | finance | Finance Ops / Risk | Holdback dinamico e disputes | in_progress | alto | antifraude, reconciliation, ledger | payout reage a risco e disputa com trilha auditavel |
| P2-09 | ops | Logistics / Support Ops | Multi-carrier + etiqueta nativa + automacoes | planned | alto | parceiros logisticos | operacao cria etiqueta, excecao e reversa em escala |
| P2-10 | checkout | Payments / Platform | Antifraude mais robusto | in_progress | alto | signals de device, velocity, abuse | endpoint de pagamento bloqueia abuso com score adaptativo |

## Gate de go-live marketplace grande
O produto so deve ser considerado em nivel `Amazon / Sephora / Mercado Livre` quando estes gates estiverem verdes:

1. Checkout live chega ao `PaymentIntent` real com frete real e smoke verde.
2. Dashboard admin nao cai para mock quando a fonte real falha.
3. Painel lojista nao depende de proxy em areas criticas (`reviews`, `trafego`, `financeiro`).
4. Painel cliente tem recompra real, rastreio por lojista e autosservico de devolucao.
5. Ledger, reconciliation e chargeback estao operacionalizados ponta a ponta.
6. Home e PDP comunicam claramente confianca comercial, nao so discovery editorial.

## Sequencia de execucao recomendada
1. Fechar P0-01 a P0-04
2. Fechar P0-05 a P0-09
3. Validar smoke funcional de go-live
4. Entrar no ciclo de P1
5. Tratar P2 como aceleradores de escala, nao como pre-requisito do primeiro go-live
