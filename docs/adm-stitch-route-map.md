# ADM Stitch Route Map

Fonte visual de verdade:

- Projeto Stitch: `https://stitch.withgoogle.com/projects/10796214318099945338`
- Linguagem visual: `Velvet & Vellum`
- Tipografia: `Noto Serif` + `Inter`

## Leitura objetiva

O projeto Stitch nao descreve um unico shell generico. Ele combina varios frames independentes e multiplos prototipos:

- `BelaPop Premium Backoffice Prototype`
- `BelaPop Curator Admin Portal`
- `BelaPop Luxury Backoffice`
- `BelaPop Marketplace Admin Prototype`

Por isso, a regra correta para o `/adm` e:

1. cada rota precisa apontar para um frame especifico do Stitch
2. componentes genericos reutilizados entre modulos diferentes reduzem a fidelidade
3. cada modulo premium deve ter pagina dedicada, sem hub visual generico intermediario

## Rota -> frame -> componente atual

### Boa cobertura estrutural

Estas rotas ja possuem componente dedicado e podem ser refinadas tela a tela contra o Stitch:

| Rota | Frame do Stitch | Componente atual | Status |
| --- | --- | --- | --- |
| `/adm` | `BelaPop - Central de Operacao` | `ControlCenterPage` | Dedicado |
| `/adm/dashboard-executivo` | `BelaPop Dashboard Executivo` | `ExecutiveDashboardPage` | Dedicado |
| `/adm/qualidade-catalogo` | `BelaPop - Central de Qualidade do Catalogo` | `CatalogQualityHubPage` | Dedicado |
| `/adm/curadoria/produtos` | `BelaPop Curadoria de Produtos` | `ProductsPage` | Dedicado |
| `/adm/curadoria/documentos` | `BelaPop - Gestao de Documentos` | `DocumentsPage` | Dedicado |
| `/adm/curadoria/score` | `BelaPop - Score de Qualidade` | `QualityScorePage` | Dedicado |
| `/adm/curadoria/regras` | `BelaPop - Regras de Curadoria` | `CurationRulesPage` | Dedicado |
| `/adm/curadoria/historico-versoes` | `BelaPop - Log de Atividades` | `CurationHistoryPage` | Dedicado |
| `/adm/curadoria/monitoramento` | `BelaPop - Monitoramento de Qualidade` | `CurationMonitoringPage` | Dedicado |
| `/adm/curadoria/compliance` | `BelaPop - Gestao de Documentos` (base visual) | `CompliancePage` | Dedicado |
| `/adm/operacao/pedidos-criticos` | `BelaPop - Pedidos Criticos (Sidebar Completo)` | `CriticalOrdersPage` | Dedicado |
| `/adm/operacao/logistica` | `BelaPop - Logistica e Envios Premium` | `LogisticsPage` | Dedicado |
| `/adm/operacao/logistica/incidentes` | `BelaPop - Incidentes Logisticos` | `LogisticsIncidentsPage` | Dedicado |
| `/adm/operacao/logistica/envios/[shipmentId]` | `BelaPop - Detalhe de Envio` | `ShipmentDetailPage` | Dedicado |
| `/adm/operacao/parceiros` | `BelaPop Gestao de Parceiros` | `SellersPage` | Dedicado |
| `/adm/operacao/comunicacao-sellers` | `BelaPop - Comunicacao com Sellers` | `SellerCommunicationPage` | Dedicado |
| `/adm/relacionamento/clientes` | `BelaPop - Gestao de Clientes` | `CustomersPage` | Dedicado |
| `/adm/financeiro` | `BelaPop - Gestao Financeira Premium` | `FinanceOverviewPage` | Dedicado |
| `/adm/financeiro/repasses` | `BelaPop - Repasses para Sellers` | `PayoutsPage` | Dedicado |
| `/adm/financeiro/reembolsos` | `BelaPop - Gestao de Reembolsos` | `RefundsPage` | Dedicado |
| `/adm/financeiro/auditoria` | `BelaPop - Auditoria Financeira Premium` | `AuditPage` | Dedicado |
| `/adm/financeiro/risco` | `BelaPop - Risco e Antifraude` | `RiskPage` | Dedicado |
| `/adm/catalogo-marca/reviews` | `BelaPop - Avaliacoes e Reviews` | `ReviewsPage` | Dedicado |
| `/adm/catalogo-marca/inteligencia` | `BelaPop - Inteligencia de Catalogo` | `CatalogIntelligencePage` | Dedicado |
| `/adm/catalogo-marca/campanhas` | `BelaPop - Campanhas e Destaques` | `CampaignsPage` | Dedicado |
| `/adm/catalogo-marca/conteudo-vitrines` | `BelaPop - Campanhas e Destaques` (base visual) | `ContentShelvesPage` | Dedicado |
| `/adm/gestao/configuracoes` | `BelaPop - Configuracoes` | `SettingsPage` | Dedicado |
| `/adm/gestao/usuarios-internos` | `BelaPop - Gestao de Equipe Admin` | `InternalUsersPage` | Dedicado |
| `/adm/gestao/log-atividades` | `BelaPop - Log de Atividades` | `ActivityLogPage` | Dedicado |
| `/adm/gestao/relatorios` | `BelaPop - Relatorios e Performance` | `ReportsPage` | Dedicado |

## Estado estrutural atual

As rotas ativas do `/adm` ja nao dependem mais de `components/adm/pages/ModuleHubPage.tsx`.

## Prioridade de substituicao

Ordem recomendada para ganhar fidelidade mais rapido:

1. refinamento fino tela a tela contra screenshots/export do Stitch

## Regra operacional

Para manter fidelidade ao Stitch:

- nao reintroduzir hub generico para frames premium distintos
- cada frame com nome proprio no Stitch deve ter um componente de pagina proprio
- o shell compartilhado so deve continuar onde o Stitch realmente sugere shell igual
