﻿# BelaPop — Mini-marketplace editorial (MVP)

Projeto Next.js (App Router) com estética ultra luxo para curadoria de beleza.

## Rodar localmente (copiar e colar)

```bash
npm install
npm run dev
```

Ou, no PowerShell:

```powershell
$env:PORT=3001
npm run dev
```

Acesse `http://localhost:3001`.

## Onde editar conteúdo rápido

- Textos e seções: `app/page.tsx`
- Produtos e sellers: `data/products.ts`, `data/sellers.ts`
- Posts do diário: `data/posts.ts`
- Cores e tipografia: `tailwind.config.ts` e `styles/globals.css`
- Navbar/Rodapé: `components/Navbar.tsx`, `components/Footer.tsx`
- Widget de acessibilidade (accessiBe) habilitado.

## Portal do lojista

- Cadastro: `/seller/register`
- Login: `/seller/login`
- Dashboard: `/seller/dashboard`
- Produtos (CRUD): `/seller/products`
- Pedidos: `/seller/orders`
- Perfil da loja: `/seller/profile`

O portal do lojista é separado do login de cliente. Cada usuário possui `role`
(`customer` ou `seller`) e as rotas `/seller/*` ficam protegidas por role.
Crie uma conta de lojista em `/seller/register` para testar o CRUD.

Para ver pedidos, finalize um checkout no site e acesse `/seller/orders`. Os
pedidos são separados por lojista (`SubOrder`) e exibidos apenas para o seller logado.

> ### Centro de ativação do lojista
>
> O dashboard `/seller/dashboard` agora abre com um **Centro de ativação** que mostra o que falta para sua loja começar a vender. O card consome o endpoint `GET /api/seller/activation-status` (via cookie `sb-access-token`) e entrega:
>
> - **Checklist (5 itens)**: CEP de origem informado, pagamentos ativados, pelo menos um produto publicado, dimensões de frete completas e loja aprovada, com CTA dedicado para cada pendência.
> - **Progresso (%)**: barra elegante mais percentual numérico baseado em 20% por item concluído.
> - **Pendências inteligentes**: alertas com nível `blocker`, `warning` ou `info` sobre pagamentos, dimensões e curadoria, cada um com um botão rosa para resolver.
>
> A API também retorna `issues` com CTA e nível visual, o que facilita mostrar os botões LuxuryButton diretamente no dashboard.
>
> Para testar o centro:
>
> 1. Remova `postal_code` de `sellers` para fazer o checklist apontar o CEP em falta.
> 2. Retire `stripe_account_id` ou defina `sellers.status != 'active'` para ver o bloqueio de pagamentos.
> 3. Publique nenhum produto (`status != 'published'`) para zerar o progresso e mostrar o item de publicação.
> 4. Cadastre produtos com `weight_kg`, `width_cm`, `height_cm` ou `length_cm` nulos/zero para disparar o aviso de dimensões.
> 5. Marque produtos como `pending_review` ou `needs_adjustment` para gerar o alerta de curadoria.

## Admin do Diário

- Acesso: `/login` (selecione "Admin")
- Dashboard: `/admin/dashboard`
- Diário (CRUD): `/admin/diario`
- Lojistas: `/admin/sellers`
- Produtos: `/admin/products`
- Pedidos: `/admin/orders`
- Configurações: `/admin/settings`

Usuário admin padrão (mock):
- Email: `admin@belapop.com`
- Senha: `admin123`

### Criar o admin real no Supabase

- Use os valores de `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` definidos em `.env.local` para acessar a instância do Supabase usada pelo app.
- No painel da instância, abra **Authentication → Users** e clique em “Invite user” ou “New user” para criar o admin com o e-mail/senha desejados (por exemplo `admin@belapop.com` / `admin123`). O trigger `handle_new_user` já garante a criação de um registro em `public.profiles` quando o usuário é criado pelo Auth.
- Após a criação, abra o **SQL editor** e execute:

```sql
update public.profiles
set role = 'admin', full_name = 'Curadoria BelaPop'
where email = 'admin@belapop.com';
```

- Se preferir, ajuste outros campos (`created_at`, `metadata` etc.) ou insira um registro direto em `profiles`. Também é possível automatizar a criação com `supabase.auth.admin.createUser` via API.
- Confirme em **Authentication → Users** e na tabela `public.profiles` que o `role` foi atualizado.
- Depois disso, acesse `http://localhost:3001/adm/login` para autenticar na governança e acessar `/adm`.
- Se estiver rodando Supabase local via Docker, verifique que `public.profiles` tem o registro criado (o trigger só dispara quando um usuário é inserido em `auth.users`).
- Como alternativa, use `node scripts/make-admin.mjs` (de preferência com `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, e opcionalmente `ADMIN_EMAIL`/`ADMIN_FULL_NAME` no `.env.local`) para promover um usuário direto no Supabase.

O painel administrativo permite aprovar lojistas, produtos e acompanhar pedidos.
Produtos só aparecem no site quando o lojista está aprovado e o produto está publicado.

### Console administrativo completo

O espaço `/admin` concentra toda a governança do marketplace e exige `role="admin"` antes de renderizar qualquer tela (veja `app/admin/layout.tsx`). A validação usa o mock de autenticação para manter dados em `localStorage` via `lib/repositories/*`.

- `/admin/dashboard`: KPIs, listas de lojistas/produtos/operações e filtros com botões de acesso rápido (`app/admin/dashboard/page.tsx`).
- `/admin/sellers`: lista com status, data e ações (aprovar, pausar, detalhes) que gravam no `userRepository` (`app/admin/sellers/page.tsx`).
- `/admin/sellers/[id]`: painel do lojista com dados da loja, CEP de origem, produtos e subpedidos; permite aprovar, pausar ou reprovar o parceiro (`app/admin/sellers/[id]/page.tsx`).
- `/admin/products`: curadoria dos produtos com indicadores de status e ações administrativas (aprovar, pausar, destacar) que atualizam `productRepository` (`app/admin/products/page.tsx`).
- `/admin/products/[id]`: detalhe completo de um produto com botões para alterar status ou destaque (`app/admin/products/[id]/page.tsx`).
- `/admin/orders`: visão mestre/detalhada dos `Order` + `SubOrder`, incluindo lojas envolvidas, status e frete (`app/admin/orders/page.tsx`).
- `/admin/carts`: monitoramento de carrinhos ativos/abandonados/convertidos com itens e usuário/anon ID (`app/admin/carts/page.tsx`).
- `/admin/diario`: CRUD editorial com botões de publicar/despublicar, edição e preview (`app/admin/diario/*/page.tsx`, componente `DiaryPreview`).
- `/admin/settings`: ajustes globais de comissão, banner e mensagem institucional gravados em `localStorage` (`app/admin/settings/page.tsx`).

### Carrinhos abandonados (Supabase)

> **Obs:** os endpoints rodando em `/api/cart/*` usam o `SUPABASE_SERVICE_ROLE_KEY`, portanto garanta que essa variável esteja definida no `.env.local` juntamente com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- Crie a tabela no Supabase (a mesma instância usada pelo front) com o script abaixo:

```sql
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  anon_id text,
  status text not null default 'active',
  items jsonb not null default '[]',
  subtotal_cents int not null default 0,
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists carts_user_id_idx on public.carts(user_id) where user_id is not null;
create unique index if not exists carts_anon_id_idx on public.carts(anon_id) where anon_id is not null;

create or replace function public.update_cart_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_update_cart_timestamp on public.carts;
create trigger trg_update_cart_timestamp
before update on public.carts
for each row execute function public.update_cart_timestamp();
```

- Sincronize o carrinho com o endpoint `POST /api/cart/sync` (usado automaticamente pelo front). O payload inclui `items`, `subtotalCents`, `anonId`, `cartId` e opcionalmente `userId`. O servidor usa o `anonId` (cookie `belapop_anon_id`) para identificar visitantes anônimos e o `cartId` retornado para atualizar o mesmo registro depois.
- Ao finalizar um pedido via `/checkout`, o frontend chama `POST /api/cart/convert` com `{ cartId, anonId, orderId }` para marcar o carrinho como `converted`.
- Quando o admin acessa `/admin/carts`, o servidor dispara a rotina `GET /api/admin/carts/mark-abandoned` (que também pode ser chamada manualmente) para mover carrinhos `active` com `updated_at < now() - interval '2 hours'` para `abandoned`. O painel `/admin` oferece KPIs, monitor de pedidos/lojistas e lista completa de carrinhos ativos+abandonados+convertidos.
- A página `/admin/carts` exibe tabs (Active / Abandoned / Converted) com resumo de cada carrinho, itens e cliente (email ou anon ID) e um detalhe expandível para revisar o conteúdo.
- A dashboard `/admin` consome `GET /api/admin/summary` para obter as métricas (GMV, pedidos, lojistas ativos, produtos pendentes) e usa `GET /api/admin/carts/list?status=` para popular as abas de carrinhos com paginação e filtros por `anonId`.
- Para testar:
  1. Abra o site e adicione itens ao carrinho (sem login). O cookie `belapop_anon_id` será criado automaticamente.
 2. Verifique no Supabase a linha em `public.carts` com `status = active`.
 3. Espere 2 horas (ou ajuste manualmente a coluna `updated_at`) e abra `/admin/carts`: o backend marca como `abandoned`.
 4. Finalize um checkout e confirme que `POST /api/cart/convert` atualiza o status para `converted`.

### Exemplos de payloads

- `POST /api/cart/sync`
  ```json
  {
    "items": [{ "productId": "xxx", "quantity": 2, "sellerId": "seller-1" }],
    "subtotalCents": 25900,
    "anonId": "anon-uuid",
    "cartId": null,
    "userId": null
  }
  ```
- `POST /api/cart/convert`
  ```json
  {
    "cartId": "uuid",
    "anonId": "anon-uuid",
    "orderId": "order-uuid",
    "userId": "user-uuid"
  }
  ```
- Para as abas, a requisição `/api/admin/carts/list?status=active&limit=20` retorna `{ data: [...], count: 20 }`.

Esse fluxo garante rastreio completo (persistência, anonimato, conversão) e fornece visibilidade imediata no painel admin.

## Pagamentos e login (mock)

- O checkout é apenas UI/UX. Não há gateway real.
- O login e cadastro (cliente e lojista) são mockados com `localStorage`.
- O acesso admin do Diário também é mockado (localStorage).

## Split de pagamentos com Stripe Connect

- **Variáveis de ambiente necessárias**
  - `STRIPE_SECRET_KEY`: chave secreta do lado servidor.
  - `STRIPE_WEBHOOK_SECRET`: assinatura enviada pelo Stripe para `/api/stripe/webhook`.
  - `STRIPE_PLATFORM_FEE_PERCENT`: percentual da BelaPop (default 10%).
  - `STRIPE_CONNECT_REFRESH_URL` / `STRIPE_CONNECT_RETURN_URL`: URLs de retorno do onboarding.
  - `NEXT_PUBLIC_APP_URL` ou `APP_URL`: base usada pelo onboarding e webhooks locais.

- **Fluxo implementado**
  1. No painel do lojista (`/seller/dashboard`), o botão “Ativar pagamentos” chama `/api/stripe/connect/onboard`. O backend cria uma conta Express, gera o link, salva o `stripeAccountId` e retorna o redirecionamento autorizado.
  2. No checkout, o frontend agrupa os itens por lojista (usando `groupItemsBySeller`), envia `POST /api/stripe/payment-intent` com itens, fretes e identificadores. O backend calcula os totais, taxa da BelaPop e retorna o `paymentIntent`, incluindo o `sellerSplits` nos metadados e `transfer_group`.
  3. O webhook (`/api/stripe/webhook`) valida a assinatura e cria as `transfers` assim que `payment_intent.succeeded` chega; o evento `transfer.created` é apenas registrado para auditoria.
  4. Se algum lojista não estiver conectado ao Stripe, o endpoint responde com `SELLER_NOT_CONNECTED` e o checkout exibe o aviso “Ative pagamentos para vender”.

- **Persistência e dashboards**
  - `orderRepository`/`subOrders` agora armazenam `paymentIntentId`, `totalAmount`, `platformFee`, `sellerNetAmount` e `paymentStatus`.
  - O painel do lojista mostra pagamentos pendentes/pagos e recomenda ativar a conta quando estiver desconectado.
  - O admin visualiza comissões acumuladas e repasses por lojista em `/admin/orders` e `/admin/dashboard`.

Teste local: rode `stripe listen --forward-to http://localhost:3000/api/stripe/webhook` para receber `payment_intent.succeeded` e `transfer.created` durante testes com cartões de teste do Stripe.

## Frete por lojista (Melhor Envio)

O cálculo de frete soma envios por lojista (modelo A). Cada lojista possui
um CEP de origem e o checkout consolida tudo em um único pagamento.

### Configurar token e CEP padrão

Crie um arquivo `.env.local` na raiz do projeto:

```
MELHORENVIO_TOKEN=seu_token_aqui
MELHORENVIO_FROM_POSTAL_CODE=00000000
```

### CEP de origem por seller

- Edite `data/sellers.ts` e preencha `postalCode` para cada lojista.
- Novos lojistas cadastrados em `/seller/register` também salvam o CEP.
- Se um lojista não tiver CEP, o sistema usa o `MELHORENVIO_FROM_POSTAL_CODE`
  como fallback.

### Como funciona internamente

- O carrinho agrupa itens por `sellerId`.
- A API `/api/shipping/quote` calcula um frete por lojista.
- O total de frete é a soma de todos os envios.
- No checkout são criados:
  - 1 pedido principal (`Order`)
  - N subpedidos (`SubOrder`), um por lojista

## Como integrar pagamento depois

- Substitua a função `handleConfirm` em `app/checkout/page.tsx` por uma chamada ao Stripe.
- Mantenha o objeto `Order` para salvar o retorno da transação.

## Como integrar autenticação depois

- Troque as funções de `lib/AuthContext.tsx` por chamadas a um backend real (Supabase/Auth0 etc.).
- O `localStorage` é usado apenas como demo.

## Camada de dados (repositórios)

- `lib/repositories/userRepository.ts` e `lib/repositories/productRepository.ts`
  encapsulam o acesso a dados, facilitando trocar `localStorage` por banco.
- `lib/repositories/diaryRepository.ts` faz o mesmo para o Diário.
- `lib/orders/orderRepository.ts` centraliza gravação e leitura de pedidos.

## Estrutura principal

- `app/` rotas e páginas
- `components/` UI e layouts
- `data/` dados mock (produtos, sellers, posts)
- `lib/` contextos, tipos e helpers
- `styles/` estilos globais

## Observações

- Carrinho, sessão e pedidos são persistidos em `localStorage`.
- Produtos publicados ficam visíveis no catálogo público (`status = "published"`).
- Posts publicados ficam visíveis no Diário público (`status = "published"`).
- O layout segue direção editorial com microanimações (framer-motion).
