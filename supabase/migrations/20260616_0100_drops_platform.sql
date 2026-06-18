-- ─── BelaPop Drops Platform ────────────────────────────────────────────────────
-- Drop "Glass Skin Starter" — limited-edition kit, sold via the platform.
--
-- Architecture:
--   drops       → marketing entity (title, schedule, status, channel)
--   drop_items  → product-level stock, linked to lotes for atomic reservation
--   lotes       → existing atomic stock system (SELECT FOR UPDATE)
--   lote_reservas → existing reservation rows (15–30 min TTL)
--
-- Reservation flow:
--   PDP → /api/drops/[slug]/checkout
--     → fn_reservar_lote (atomic, SELECT FOR UPDATE)
--     → stripe.paymentIntents.create
--     → lote_reservas.payment_intent_id = pi.id
--   Webhook payment_intent.succeeded
--     → fn_confirmar_venda_lote (existing, via stripeWebhookUtils)
--     → fn_confirmar_drop_venda (new — updates sold_quantity + gmv)
--
-- Down migration at the bottom of this file (commented).

-- ─── drops ────────────────────────────────────────────────────────────────────

create table if not exists public.drops (
  id            uuid        primary key default gen_random_uuid(),
  number        int         not null generated always as identity,
  slug          text        not null,
  title         text        not null,
  subtitle      text,
  description   text,
  opens_at      timestamptz,
  closes_at     timestamptz,
  status        text        not null default 'draft'
                              check (status in ('draft','scheduled','live','closed','sold_out','fulfilling','delivered')),
  sem_reposicao boolean     not null default true,
  canal         text        not null default 'site'
                              check (canal in ('site','circulo','ambos')),
  -- Cached stats: updated by fn_confirmar_drop_venda on each sale
  total_orders  int         not null default 0,
  gmv_cents     bigint      not null default 0,
  notes         text,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint drops_slug_unique   unique (slug),
  constraint drops_number_unique unique (number),
  constraint drops_datas_ok
    check (closes_at is null or opens_at is null or closes_at > opens_at),
  constraint drops_gmv_nonneg    check (gmv_cents >= 0),
  constraint drops_orders_nonneg check (total_orders >= 0)
);

comment on table  public.drops                is 'Editorial drop campaigns — limited edition product releases.';
comment on column public.drops.canal          is 'site = public; circulo = members only; ambos = both (circulo may get early access in phase 2).';
comment on column public.drops.sem_reposicao  is 'When true, stock will not be restocked after this drop closes.';
comment on column public.drops.total_orders   is 'Denormalised count; updated atomically by fn_confirmar_drop_venda.';
comment on column public.drops.gmv_cents      is 'Denormalised revenue; updated atomically by fn_confirmar_drop_venda.';

-- ─── drop_items ───────────────────────────────────────────────────────────────

create table if not exists public.drop_items (
  id                   uuid  primary key default gen_random_uuid(),
  drop_id              uuid  not null references public.drops(id) on delete cascade,
  product_id           uuid  references public.products(id),
  lote_id              uuid  references public.lotes(id),
  drop_price_cents     int   not null check (drop_price_cents > 0),
  max_quantity         int   not null check (max_quantity > 0),
  sold_quantity        int   not null default 0 check (sold_quantity >= 0),
  fulfillment_eta_days int   not null default 7,
  stripe_payment_link_url text,
  constraint drop_items_sold_lte_max check (sold_quantity <= max_quantity),
  constraint drop_items_drop_product_unique unique (drop_id, product_id)
);

comment on table  public.drop_items         is 'Individual products / SKUs inside a drop.';
comment on column public.drop_items.lote_id is 'References the lotes row that controls atomic stock via fn_reservar_lote.';

-- ─── drop_broadcasts ──────────────────────────────────────────────────────────

create table if not exists public.drop_broadcasts (
  id               uuid        primary key default gen_random_uuid(),
  drop_id          uuid        not null references public.drops(id) on delete cascade,
  channel          text        not null, -- 'email', 'whatsapp', 'push'
  sent_at          timestamptz,
  recipients_count int,
  error_log        text,
  created_at       timestamptz not null default now()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.drops             enable row level security;
alter table public.drop_items        enable row level security;
alter table public.drop_broadcasts   enable row level security;

-- Public can read live and upcoming drops (not drafts)
drop policy if exists drops_public_read on public.drops;
create policy drops_public_read
  on public.drops for select to public
  using (status not in ('draft'));

-- Public can read items of readable drops
drop policy if exists drop_items_public_read on public.drop_items;
create policy drop_items_public_read
  on public.drop_items for select to public
  using (exists (
    select 1 from public.drops d
    where d.id = drop_items.drop_id
      and d.status not in ('draft')
  ));

-- Broadcasts: service_role only (no public access)
-- Full access for admin operations goes through service_role (bypasses RLS)

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

create index if not exists idx_drops_slug        on public.drops (slug);
create index if not exists idx_drops_status      on public.drops (status);
create index if not exists idx_drops_canal       on public.drops (canal);
create index if not exists idx_drops_opens_at    on public.drops (opens_at) where status = 'scheduled';
create index if not exists idx_drop_items_drop   on public.drop_items (drop_id);
create index if not exists idx_drop_items_lote   on public.drop_items (lote_id);
create index if not exists idx_drop_broadcasts   on public.drop_broadcasts (drop_id, sent_at desc);

-- ─── TRIGGER: updated_at ──────────────────────────────────────────────────────

create or replace function public.fn_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_drops_updated_at on public.drops;
create trigger trg_drops_updated_at
  before update on public.drops
  for each row execute function public.fn_set_updated_at();

-- ─── fn_confirmar_drop_venda ──────────────────────────────────────────────────
-- Called by webhook after payment_intent.succeeded (after fn_confirmar_venda_lote).
-- Increments drop_items.sold_quantity and updates denormalised drop stats.
-- Idempotent: guarded by the caller's checkAndMarkIdempotency.

create or replace function public.fn_confirmar_drop_venda(
  p_drop_id         uuid,
  p_drop_item_id    uuid,
  p_price_cents     int
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_item public.drop_items%rowtype;
begin
  -- Lock item row
  select * into v_item
  from public.drop_items
  where id = p_drop_item_id and drop_id = p_drop_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'drop_item_not_found');
  end if;

  if v_item.sold_quantity >= v_item.max_quantity then
    return jsonb_build_object('ok', false, 'error', 'already_sold_out');
  end if;

  -- Increment item sold count
  update public.drop_items
  set sold_quantity = sold_quantity + 1
  where id = p_drop_item_id;

  -- Update drop denormalised stats + auto-transition to sold_out
  update public.drops
  set
    total_orders = total_orders + 1,
    gmv_cents    = gmv_cents + p_price_cents,
    status = case
      when status = 'live'
        and (select sold_quantity + 1 from public.drop_items where id = p_drop_item_id) >= v_item.max_quantity
      then 'sold_out'
      else status
    end
  where id = p_drop_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.fn_confirmar_drop_venda to service_role;

-- ─── fn_abrir_drops_agendados ─────────────────────────────────────────────────
-- Called by the scheduled→live cron (release-drops endpoint).
-- Transitions 'scheduled' drops whose opens_at has passed to 'live'.
-- Also transitions 'live' drops past closes_at to 'closed'.

create or replace function public.fn_sincronizar_status_drops()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_abertos   int := 0;
  v_fechados  int := 0;
begin
  -- scheduled → live
  update public.drops
  set status = 'live', updated_at = now()
  where status = 'scheduled'
    and opens_at is not null
    and opens_at <= now()
    and (closes_at is null or closes_at > now());

  get diagnostics v_abertos = row_count;

  -- live → closed (window passed)
  update public.drops
  set status = 'closed', updated_at = now()
  where status = 'live'
    and closes_at is not null
    and closes_at <= now();

  get diagnostics v_fechados = row_count;

  return jsonb_build_object(
    'ok', true,
    'abertos', v_abertos,
    'fechados', v_fechados
  );
end;
$$;

grant execute on function public.fn_sincronizar_status_drops to service_role;

-- ─── SEED: Glass Skin Starter Drop ────────────────────────────────────────────
-- Creates the first BelaPop platform drop as a draft.
-- Admin activates it via the panel when ready.

do $$
declare
  v_platform_seller_id uuid := '00000000-0000-0000-0000-belapop000001'::uuid;
  v_product_id         uuid;
  v_lote_id            uuid;
  v_drop_id            uuid;
  v_item_id            uuid;
begin
  -- Upsert: platform seller account (minimal, for FK compliance)
  insert into public.sellers (id, user_id, brand_name, status, created_at)
  values (
    v_platform_seller_id,
    v_platform_seller_id,
    'BelaPop Platform',
    'approved',
    now()
  )
  on conflict (id) do nothing;

  -- Upsert: Glass Skin Starter product
  insert into public.products (
    seller_id, name, description, category, price_cents,
    stock_quantity, status, is_featured, curated
  ) values (
    v_platform_seller_id,
    'Glass Skin Starter',
    'Kit de iniciação para rotina glass skin: limpeza enzimática, tônico hidratante e sérum de niacinamida. Formulação clínica, lote rastreado, sem reposição.',
    'kits',
    39700,
    0,   -- stock managed by lote
    'published',
    true,
    true
  )
  on conflict do nothing
  returning id into v_product_id;

  -- If product already existed, fetch its id
  if v_product_id is null then
    select id into v_product_id from public.products
    where seller_id = v_platform_seller_id and name = 'Glass Skin Starter'
    limit 1;
  end if;

  if v_product_id is null then
    raise notice 'Glass Skin Starter product not seeded — skipping lote + drop';
    return;
  end if;

  -- Upsert: lote (starts SUSPENSO — admin opens the drop when ready)
  insert into public.lotes (
    produto_id, seller_id, sku_externo,
    qtd_total, qtd_disponivel, qtd_reservada,
    limiar_alerta_pct, status, notas_internas
  ) values (
    v_product_id,
    v_platform_seller_id,
    'GSS-2026-LOTE-01',
    50,   -- total units
    50,   -- all available at start
    0,
    20,
    'SUSPENSO',
    'Lote 01 Glass Skin Starter — lançamento plataforma BelaPop'
  )
  on conflict do nothing
  returning id into v_lote_id;

  if v_lote_id is null then
    select l.id into v_lote_id
    from public.lotes l
    where l.produto_id = v_product_id and l.seller_id = v_platform_seller_id
    limit 1;
  end if;

  -- Upsert: drop
  insert into public.drops (
    slug, title, subtitle, description,
    status, canal, sem_reposicao,
    notes, created_at, updated_at
  ) values (
    'glass-skin-starter',
    'Glass Skin Starter',
    'Kit de iniciação glass skin — 50 unidades, sem reposição',
    E'Três produtos formulados para funcionar juntos:\n\n**Gel Limpeza Veludo** — surfactante suave que remove impurezas sem comprometer a barreira lipídica.\n\n**Tônico Nuvem de Rosa** — prepara a pele para absorção, com ácido hialurônico de múltiplos pesos moleculares.\n\n**Sérum Radiance 01** — niacinamida 10% + vitamina C estabilizada. Age em manchas, poros e uniformidade.\n\nLote rastreado, formulação verificada, sem reposição.',
    'draft',
    'ambos',
    true,
    'Drop de lançamento da plataforma. Lote 01.',
    now(),
    now()
  )
  on conflict (slug) do nothing
  returning id into v_drop_id;

  if v_drop_id is null then
    select id into v_drop_id from public.drops where slug = 'glass-skin-starter' limit 1;
  end if;

  -- Upsert: drop_item
  if v_drop_id is not null and v_lote_id is not null then
    insert into public.drop_items (
      drop_id, product_id, lote_id,
      drop_price_cents, max_quantity, sold_quantity,
      fulfillment_eta_days
    ) values (
      v_drop_id, v_product_id, v_lote_id,
      39700, -- R$ 397,00
      50,    -- matches lote qtd_total
      0,
      5
    )
    on conflict (drop_id, product_id) do nothing;
  end if;

  raise notice 'Glass Skin Starter seeded: product=% lote=% drop=%',
    v_product_id, v_lote_id, v_drop_id;
end;
$$;

-- ─── DOWN MIGRATION ────────────────────────────────────────────────────────────
-- Run this to revert. Does NOT remove the seeded lote / product (they may have orders).
--
-- drop function if exists public.fn_confirmar_drop_venda(uuid, uuid, int);
-- drop function if exists public.fn_sincronizar_status_drops();
-- drop function if exists public.fn_set_updated_at();
-- drop table if exists public.drop_broadcasts;
-- drop table if exists public.drop_items;
-- drop table if exists public.drops;
