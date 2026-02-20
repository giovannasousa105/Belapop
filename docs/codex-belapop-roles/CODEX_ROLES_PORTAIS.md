# CÓDEX — Roles e Portais BelaPop

## Objetivo
Definir acesso por perfil (`client`, `partner`, `admin`) com guard server-side e RLS no Supabase.

## Roles
- `client`: comprador padrão.
- `partner`: lojista aprovado.
- `admin`: acesso interno (oculto na UI pública).

## Fontes de role (ordem de resolução no server)
1. `public.profiles.role`
2. `public.user_roles.role`
3. fallback por existência de seller (`sellers`/`seller_profiles`) => `partner`
4. fallback final => `client`

Implementação: `lib/auth/portalRole.ts`.

## Rotas por portal
- Público: `/`, `/catalogo`, `/produto/[slug]`, `/diario`, `/diario/[slug]`, `/login`
- Cliente: `/conta`, `/conta/pedidos`, `/conta/favoritos`, `/conta/dados`
- Parceiro: `/parceiro`, `/parceiro/onboarding`, `/parceiro/produtos`, `/parceiro/pedidos`, `/parceiro/repasse`, `/parceiro/suporte`
- Admin (oculto): `/admin/*`

## Guards ativos
- `app/conta/layout.tsx`
  - sem sessão => `/login?tab=customer`
  - `partner` => `/parceiro`
  - `admin` => `/admin`
- `app/parceiro/layout.tsx`
  - onboarding aberto
  - demais páginas exigem partner/admin via `getPartnerPortalAccess`
- `app/(admin)/admin/layout.tsx`
  - exige `requireRole("admin")`
  - `robots` noindex/nofollow

## Redirecionamento pós-login
Implementação: `app/auth/redirect/page.tsx`
- `admin` => `/admin`
- `partner` => `/parceiro`
- tab parceiro sem role partner => `/parceiro/onboarding?status=pending`
- default => `/conta`

## Supabase (P0)
Migration: `supabase/migrations/202602202130_p0_portal_guards_rls.sql`

Inclui:
- trigger `on_auth_user_created` com `public.handle_new_user()`
- bootstrap em `profiles` com role padrão `customer` (equivalente a client)
- RLS base:
  - `products`: público lê apenas `active|published` (admin bypass)
  - `orders`: usuário vê apenas próprios pedidos (admin bypass)
  - `profiles`: usuário lê/edita apenas o próprio perfil (admin bypass)
  - `articles` (se existir): público lê apenas `published` (admin bypass)

## Regras de segurança
- Não exibir links de admin em header/footer/login público.
- Manter `/admin/*` com noindex.
- Não confiar em role do client para autorização de rota/API.
- Sempre validar role no servidor.

## Checklist rápido
- [x] Guard server-side em cliente/parceiro/admin
- [x] Admin oculto na navegação pública
- [x] Redirect por role após login
- [x] Trigger de profile padrão
- [x] RLS base para entidades públicas e de conta
