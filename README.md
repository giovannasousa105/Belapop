<<<<<<< HEAD
# BelaPop — Mini-marketplace editorial (MVP)

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


## Portal do lojista


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


Usuário admin padrão (mock):

### Criar o admin real no Supabase


```sql
update public.profiles
set role = 'admin', full_name = 'Curadoria BelaPop'
where email = 'admin@belapop.com';
```


O painel administrativo permite aprovar lojistas, produtos e acompanhar pedidos.
Produtos só aparecem no site quando o lojista está aprovado e o produto está publicado.

### Console administrativo completo

O espaço `/admin` concentra toda a governança do marketplace e exige `role="admin"` antes de renderizar qualquer tela (veja `app/admin/layout.tsx`). A validação usa o mock de autenticação para manter dados em `localStorage` via `lib/repositories/*`.


### Carrinhos abandonados (Supabase)

> **Obs:** os endpoints rodando em `/api/cart/*` usam o `SUPABASE_SERVICE_ROLE_KEY`, portanto garanta que essa variável esteja definida no `.env.local` juntamente com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.


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

  1. Abra o site e adicione itens ao carrinho (sem login). O cookie `belapop_anon_id` será criado automaticamente.
 2. Verifique no Supabase a linha em `public.carts` com `status = active`.
 3. Espere 2 horas (ou ajuste manualmente a coluna `updated_at`) e abra `/admin/carts`: o backend marca como `abandoned`.
 4. Finalize um checkout e confirme que `POST /api/cart/convert` atualiza o status para `converted`.

### Exemplos de payloads

  ```json
  {
    "items": [{ "productId": "xxx", "quantity": 2, "sellerId": "seller-1" }],
    "subtotalCents": 25900,
    "anonId": "anon-uuid",
    "cartId": null,
    "userId": null
  }
  ```
  ```json
  {
    "cartId": "uuid",
    "anonId": "anon-uuid",
    "orderId": "order-uuid",
    "userId": "user-uuid"
  }
  ```

Esse fluxo garante rastreio completo (persistência, anonimato, conversão) e fornece visibilidade imediata no painel admin.

## Pagamentos e login (mock)


## Split de pagamentos com Stripe Connect

  - `STRIPE_SECRET_KEY`: chave secreta do lado servidor.
  - `STRIPE_WEBHOOK_SECRET`: assinatura enviada pelo Stripe para `/api/stripe/webhook`.
  - `STRIPE_PLATFORM_FEE_PERCENT`: percentual da BelaPop (default 10%).
  - `STRIPE_CONNECT_REFRESH_URL` / `STRIPE_CONNECT_RETURN_URL`: URLs de retorno do onboarding.
  - `NEXT_PUBLIC_APP_URL` ou `APP_URL`: base usada pelo onboarding e webhooks locais.

  1. No painel do lojista (`/seller/dashboard`), o botão “Ativar pagamentos” chama `/api/stripe/connect/onboard`. O backend cria uma conta Express, gera o link, salva o `stripeAccountId` e retorna o redirecionamento autorizado.
  2. No checkout, o frontend agrupa os itens por lojista (usando `groupItemsBySeller`), envia `POST /api/stripe/payment-intent` com itens, fretes e identificadores. O backend calcula os totais, taxa da BelaPop e retorna o `paymentIntent`, incluindo o `sellerSplits` nos metadados e `transfer_group`.
  3. O webhook (`/api/stripe/webhook`) valida a assinatura e cria as `transfers` assim que `payment_intent.succeeded` chega; o evento `transfer.created` é apenas registrado para auditoria.
  4. Se algum lojista não estiver conectado ao Stripe, o endpoint responde com `SELLER_NOT_CONNECTED` e o checkout exibe o aviso “Ative pagamentos para vender”.

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

  como fallback.

### Como funciona internamente

  - 1 pedido principal (`Order`)
  - N subpedidos (`SubOrder`), um por lojista

## Como integrar pagamento depois


## Como integrar autenticação depois


## Camada de dados (repositórios)

  encapsulam o acesso a dados, facilitando trocar `localStorage` por banco.

## Estrutura principal


## Observações

=======
# Belapop
>>>>>>> ea9c41534ef02ac0e72cafa0a114e12c09d54152
