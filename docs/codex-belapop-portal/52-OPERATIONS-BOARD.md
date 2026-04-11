# BelaPop Operations Board

Date: 2026-03-12
Statuses: `planned`, `in_progress`, `blocked`, `done`

## Planned
- `home` bloco de marcas em destaque
- `home` vitrines por necessidade comercial
- `cliente` central unica de mensagens
- `cliente` self-service de devolucao/reembolso
- `cliente` reposicao/assinatura
- `lojista` bulk actions e CSV
- `lojista` extrato financeiro real de ledger
- `lojista` reputacao first-class
- `admin` filas operacionais acionaveis
- `admin` modulo de clientes real
- `home` social proof forte
- `cliente` wallet/beneficios
- `cliente` timeline nivel Amazon
- `lojista` ads e promo engine
- `lojista` catalogo avancado
- `admin` command center unificado
- `ops` multi-carrier e etiqueta nativa

## In Progress
- `checkout` matriz real de meios de pagamento Stripe
- `finance` validacao operacional de chargeback, `commission_reversal` e `chargeback_fee`
- `ops` logistica reversa com excecao e SLA
- `finance` drill-down de reconciliation por provider e issue
- `home` personalizacao plena na home
- `finance` holdback dinamico e disputes
- `checkout` antifraude mais robusto

## Blocked
- `checkout` Melhor Envio real em producao
  - blocker: credencial operacional valida e origem de frete por seller

## Done
- `checkout` fluxo server-side sem precificacao confiada ao navegador
- `checkout` transfers saindo de snapshot persistido
- `checkout` idempotencia e rate limit basico
- `checkout` promessa operacional visivel no checkout
- `finance` ledger, reconciliation e postings explicitos de chargeback
- `finance` remocao de CTAs placeholder de export
- `admin` dashboard sem `mockDashboard` silencioso
- `admin` endpoint legado principal de dashboard desativado/unificado
- `admin` curadoria ligada a `collections` e `collection_products`
- `admin` evidence admin do SkinGPT
- `cliente` recompra real por pedido/item
- `cliente` ETA e timeline por lojista baseados em eventos
- `cliente` skincare routine builder + Skin Twin + FaceShield
- `lojista` remocao de modulos proxy de reviews e trafego
- `ops` promessa visivel de frete/troca/suporte na home e PDP
- `ops` runbooks de incidente
- `ops` checklists executaveis de incidente
- `ops` templates preenchiveis de incidente P0
- `home` discovery layer editorial (`collections`, `origins`, `ingredients`, trending)

## Executive note
O board deve ser atualizado sempre que uma entrega mudar de `planned` para `in_progress`, `blocked` ou `done`.
