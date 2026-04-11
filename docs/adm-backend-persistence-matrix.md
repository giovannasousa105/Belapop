# ADM Backend Persistence Matrix

## Objetivo

Este documento registra o estado real da persistencia do ADM da BelaPop depois da introducao da camada Supabase em [`service.supabase.ts`](/c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/adm/actions/service.supabase.ts).

Ele responde quatro perguntas:

1. qual acao do ADM ja grava em tabela de dominio
2. qual acao ainda depende de overlay administrativo
3. qual tabela esta sendo usada como fallback
4. qual dominio deve sair primeiro de `adm_entity_states`

## Fonte de verdade tecnica

- Dispatcher principal: [`service.ts`](/c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/adm/actions/service.ts)
- Persistencia Supabase: [`service.supabase.ts`](/c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/adm/actions/service.supabase.ts)
- Resolucao de data source: [`source.ts`](/c:/Users/Gleiser/Desktop/BELAPOPSITE/lib/adm/repositories/source.ts)
- Overlay administrativo: [`20260410_0100_adm_entity_states.sql`](/c:/Users/Gleiser/Desktop/BELAPOPSITE/supabase/migrations/20260410_0100_adm_entity_states.sql)
- Status operacional canonico de envios: [`20260411_0200_shipments_operational_status.sql`](/c:/Users/Gleiser/Desktop/BELAPOPSITE/supabase/migrations/20260411_0200_shipments_operational_status.sql)
- Endpoint de mutacao: [`route.ts`](/c:/Users/Gleiser/Desktop/BELAPOPSITE/app/api/adm/actions/route.ts)

## Regra atual de operacao

- Se `ADM_DATA_SOURCE_MODE=mock`, o ADM continua em memoria.
- Se `ADM_DATA_SOURCE_MODE=supabase`, o ADM usa persistencia real.
- Se a env estiver vazia e `SUPABASE_SERVICE_ROLE_KEY` existir, o ADM sobe em modo Supabase por padrao.

## Matriz de persistencia atual

| Acao ADM | Entidade | Gravacao direta em dominio | Campos/tabelas alterados | Fallback em `adm_entity_states` | Auditoria | Leitura real atual | Observacao |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `product.approve` | produto | sim | `products.status`, `products.curated`, `products.is_featured`, `products.curation_feedback`, `products.review_notes`, `products.updated_at` | sim | `audit_log` | sim | hoje existe dual-write: dominio + overlay |
| `product.reject` | produto | sim | `products.status`, `products.curated`, `products.is_featured`, `products.curation_feedback`, `products.review_notes`, `products.updated_at` | sim | `audit_log` | sim | dual-write; bom candidato a remover overlay depois |
| `product.request-adjustment` | produto | sim | `products.status`, `products.curated`, `products.is_featured`, `products.curation_feedback`, `products.review_notes`, `products.updated_at` | sim | `audit_log` | sim | `review` no dominio ainda precisa de semantica mais clara |
| `seller.activate` | seller | sim | `sellers.status`, `sellers.updated_at`, `seller_risk_profiles.risk_tier`, `seller_risk_profiles.payouts_blocked`, `seller_risk_profiles.computed_at` | sim | `audit_log` | sim | dual-write para refletir estado visual premium/aprovado |
| `seller.deactivate` | seller | sim | `sellers.status`, `sellers.updated_at`, `seller_risk_profiles.*` via upsert | sim | `audit_log` | sim | dominio nao representa sozinho `alerta` visual |
| `seller.block` | seller | sim | `sellers.status`, `sellers.updated_at`, `seller_risk_profiles.risk_tier`, `seller_risk_profiles.payouts_blocked`, `seller_risk_profiles.computed_at` | sim | `audit_log` | sim | bloquear seller ainda depende de overlay para estado visual do ADM |
| `payout.approve` | repasse | sim | `seller_payouts.status`, `seller_payouts.updated_at`, `finance_ops_alerts.status` | nao | `audit_log` | sim | leitura visual agora deriva diretamente de `seller_payouts.status` |
| `payout.hold` | repasse | sim | `seller_payouts.status`, `seller_payouts.updated_at`, `finance_ops_alerts.status` | nao | `audit_log` | sim | `blocked` passa a ser suficiente para o estado visual do ADM |
| `refund.approve` | reembolso | sim | `return_requests.status`, `return_requests.updated_at`, `finance_ops_alerts.status` | nao | `audit_log` | sim | leitura visual agora deriva diretamente de `return_requests.status` |
| `refund.reject` | reembolso | sim | `return_requests.status`, `return_requests.updated_at`, `finance_ops_alerts.status` | nao | `audit_log` | sim | overlay removido; `rejected` fecha o estado visual do ADM |
| `shipment.update-status` | envio | sim | `shipments.operational_status`, `shipments.operational_notes`, `shipments.operational_updated_at`, `shipments.operational_updated_by`, `shipments.updated_at`, `logistics_exceptions.status`, `logistics_exceptions.resolved_at`, `logistics_exceptions.updated_at` | nao | `audit_log` | sim | status operacional canonico agora vive no dominio de `shipments` |
| `incident.register` | incidente | sim | `logistics_exceptions.order_id`, `sub_order_id`, `seller_id`, `exception_code`, `severity`, `status`, `source`, `payload`, `dedupe_key`, `detected_at`, `last_seen_at`, `sla_due_at`, `updated_at`, `shipments.operational_status`, `shipments.operational_notes`, `shipments.operational_updated_at`, `shipments.operational_updated_by`, `shipments.updated_at` | sim, para `incident` | `audit_log` | sim | incidente abre excecao real e tambem promove o envio para status operacional critico |
| `document.validate` | documento | sim | `compliance_documents.status`, `compliance_documents.review_notes`, `compliance_documents.reviewed_at`, `compliance_documents.reviewed_by`, `compliance_documents.metadata`, `compliance_documents.updated_at` | nao | `audit_log` | sim | dominio documental do ADM agora existe; fallback de leitura pode usar mock enquanto a tabela estiver vazia |
| `document.request-update` | documento | sim | `compliance_documents.status`, `compliance_documents.review_notes`, `compliance_documents.reviewed_at`, `compliance_documents.reviewed_by`, `compliance_documents.metadata`, `compliance_documents.updated_at` | nao | `audit_log` | sim | saiu de overlay total; primeira acao pode materializar documento na tabela |
| `review.approve` | review | sim | `product_reviews.is_hidden`, `product_reviews.moderation_status`, `product_reviews.moderation_notes`, `product_reviews.moderated_at`, `product_reviews.moderated_by`, `product_reviews.updated_at` | nao | `audit_log` | sim | a moderacao agora fica no dominio real de reviews |
| `review.hide` | review | sim | `product_reviews.is_hidden`, `product_reviews.moderation_status`, `product_reviews.moderation_notes`, `product_reviews.moderated_at`, `product_reviews.moderated_by`, `product_reviews.updated_at` | nao | `audit_log` | sim | reviews ocultadas tambem deixam de aparecer no endpoint publico e no rating agregado |

## Leitura por dominio hoje

### Ja conectados a tabelas reais

- Reembolsos: `return_requests`
- Incidentes logisticos: `logistics_exceptions`
- Alertas financeiros: `finance_ops_alerts`
- Repasses: `seller_payouts`
- Sellers: `sellers` e `seller_risk_profiles`
- Produtos: `products`
- Documentos: `compliance_documents`
- Reviews: `product_reviews`

### Ainda resolvidos principalmente por overlay administrativo

- Parte do status visual de sellers e produtos
- Parte do status visual dos incidentes logisticos

## Onde `adm_entity_states` e necessario hoje

`adm_entity_states` e necessario porque existem fluxos do ADM que nao possuem coluna canonica no schema atual. Hoje ele cobre:

- estados visuais do backoffice que nao cabem 1:1 no dominio
- composicao de status para cards e tabelas do `/adm`

Sem essa tabela, o ADM volta a ficar preso em mutacao em memoria ou passa a perder estados operacionais entre telas.

## Prioridade de migracao por dominio

### Prioridade 1

#### Sellers e produtos

Motivo:
- esses dominios ja gravam em tabelas reais
- overlay ainda existe mais por necessidade de apresentacao e compatibilidade visual do ADM

Destino recomendado:
 - Implementar Database Views (ex: `vw_adm_seller_status`) para derivar o status visual premium do domínio real.
 - Eliminar chamadas ao `adm_entity_states` nas actions de aprovação.
 - Centralizar logs de auditoria pesados via Triggers para manter as tabelas de domínio performáticas.

### Prioridade 2

#### Incidentes logisticos

Motivo:
- `logistics_exceptions` ja e a fonte de negocio, mas o ADM ainda usa overlay para parte do status visual do incidente

Destino recomendado:
- fechar o mapeamento visual do incidente no read model
- reduzir `adm_entity_states` para casos realmente editoriais

## Estado desejado

Meta de backend:

- dominio grava seu proprio estado canonico
- `adm_entity_states` guarda apenas estado editorial/transversal
- `audit_log` segue como trilha de auditoria
- o read model do ADM compoe UI a partir de tabelas reais + overlay minimo

## Decisao sobre `/admin`

O legado `/admin` deve permanecer somente como camada de compatibilidade e redirecionamento para `/adm`, nao como segundo backoffice vivo.

Referencia: [`layout.tsx`](/c:/Users/Gleiser/Desktop/BELAPOPSITE/app/(admin)/admin/layout.tsx)

## Checklist operacional para fechar a migracao

1. Aplicar [`20260410_0100_adm_entity_states.sql`](/c:/Users/Gleiser/Desktop/BELAPOPSITE/supabase/migrations/20260410_0100_adm_entity_states.sql) no ambiente alvo.
2. Subir `ADM_DATA_SOURCE_MODE=supabase`.
3. Rodar `npm run smoke:adm:auth` contra preview ou staging.
4. Reduzir dual-write de sellers e produtos.
5. Depois disso, limpar o overlay residual dos incidentes logisticos.
