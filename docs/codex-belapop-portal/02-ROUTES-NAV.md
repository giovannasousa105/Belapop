# Rotas e Navegação (App Router)

## Público
- `/` (Home editorial)
- `/catalogo` (Catálogo)
- `/produto/[slug]` (PDP)
- `/diario` (Hub editorial)
- `/diario/[slug]` (Artigo)
- `/login` (Login com tabs Cliente/Parceiro)

## Cliente (logado)
- `/conta`
  - `/conta/pedidos`
  - `/conta/favoritos`
  - `/conta/dados`

## Parceiro (logado)
- `/parceiro`
  - `/parceiro/onboarding`
  - `/parceiro/produtos`
  - `/parceiro/pedidos`
  - `/parceiro/repasse`
  - `/parceiro/suporte`

## Admin (oculto)
- `/admin` (NÃO linkar em lugar nenhum)
  - `/admin/curadoria`
  - `/admin/parceiros` (aprovar/alterar role)
  - `/admin/produtos`
  - `/admin/pedidos`
  - `/admin/diario`
  - `/admin/config`

## Regras de UX
- Header público: nunca mostrar Admin.
- Login: tabs (Cliente/Parceiro). Admin loga por login normal e é redirecionado via guard.
- Redirecionamento pós-login:
  - `role=client` -> `/conta`
  - `role=partner` -> `/parceiro`
  - `role=admin` -> `/admin`
