# Roles & Acesso (Supabase)

## Roles
- `client`: comprador (default para contas criadas pelo público)
- `partner`: lojista/parceiro (criado/aprovado pela BelaPop)
- `admin`: somente usuários internos autorizados

## Onde armazenar role (padrão recomendado)
Tabela: `public.profiles`
- `id` (uuid, pk) -> `auth.users.id`
- `role` (text) -> `'client' | 'partner' | 'admin'`
- `full_name` (text)
- `phone` (text)
- `created_at` (timestamptz)

## Regras
1. Todo usuário novo entra como `role='client'` (trigger).
2. Partner só vira `partner` após aprovação (admin altera role).
3. Admin exige `role='admin'` + bloqueio de UI + guard no servidor.
4. Admin não aparece em menu público; rota protegida com:
   - autenticação
   - `role=admin`
   - opcional: path interno + `robots` noindex

## Matriz de acesso
- Público: Home, Catálogo, PDP, Diário
- Cliente (`auth`): `/conta` (perfil, pedidos, favoritos)
- Parceiro (`auth`): `/parceiro` (produtos, pedidos, repasses, suporte)
- Admin (`auth + role`): `/admin` (curadoria, aprovações, conteúdo, operações)

## Não negociável
- Nunca confiar em role apenas no client.
- Toda validação de acesso sensível deve ocorrer no servidor.
