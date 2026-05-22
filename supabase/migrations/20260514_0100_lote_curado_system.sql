-- Lote Curado: editorial inventory control with reservation and waitlist.
-- Provides atomic stock reservation (SELECT FOR UPDATE via PL/pgSQL),
-- automatic status transitions, and expiry-based release job support.

-- ─── ENUMs ────────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lote_status') then
    create type public.lote_status as enum (
      'ABERTO',
      'EM_ESGOTAMENTO',
      'ENCERRADO',
      'REPOSICAO_PREVISTA',
      'SUSPENSO'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'reserva_status') then
    create type public.reserva_status as enum (
      'ATIVA',
      'CONFIRMADA',
      'EXPIRADA',
      'CANCELADA'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'evento_tipo') then
    create type public.evento_tipo as enum (
      'VENDA',
      'RESERVA',
      'LIBERACAO',
      'TRANSICAO'
    );
  end if;
end
$$;

-- ─── TABLES ───────────────────────────────────────────────────────────────────

create table if not exists public.lotes (
  id                uuid        primary key default gen_random_uuid(),
  produto_id        uuid        not null,
  seller_id         uuid        not null,
  sku_externo       varchar(255),
  qtd_total         int         not null check (qtd_total > 0),
  qtd_disponivel    int         not null check (qtd_disponivel >= 0),
  qtd_reservada     int         not null default 0 check (qtd_reservada >= 0),
  limiar_alerta_pct int         not null default 20 check (limiar_alerta_pct between 1 and 100),
  status            public.lote_status not null default 'ABERTO',
  verificado_em     timestamptz,
  aberto_em         timestamptz not null default now(),
  encerrado_em      timestamptz,
  data_reposicao    date,
  notas_internas    text,
  criado_em         timestamptz not null default now(),
  constraint lotes_qtd_consistente check (qtd_disponivel + qtd_reservada <= qtd_total)
);

create table if not exists public.lote_reservas (
  id          uuid            primary key default gen_random_uuid(),
  lote_id     uuid            not null references public.lotes(id) on delete cascade,
  session_id  varchar(255)    not null,
  user_id     uuid,
  quantidade  int             not null check (quantidade > 0),
  expira_em   timestamptz     not null,
  status      public.reserva_status not null default 'ATIVA',
  pedido_id   uuid,
  criado_em   timestamptz     not null default now()
);

create table if not exists public.lote_lista_espera (
  id             uuid        primary key default gen_random_uuid(),
  lote_id        uuid        not null references public.lotes(id) on delete cascade,
  produto_id     uuid        not null,
  email          varchar(320) not null,
  user_id        uuid,
  notificado_em  timestamptz,
  origem         varchar(100) not null default 'pdp',
  criado_em      timestamptz not null default now(),
  constraint lote_lista_espera_unique_email_produto unique (email, produto_id)
);

create table if not exists public.lote_eventos (
  id              uuid            primary key default gen_random_uuid(),
  lote_id         uuid            not null references public.lotes(id) on delete cascade,
  tipo            public.evento_tipo not null,
  status_anterior public.lote_status,
  status_novo     public.lote_status,
  delta_qtd       int             not null default 0,
  actor_id        uuid,
  metadata        jsonb           not null default '{}',
  criado_em       timestamptz     not null default now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

create index if not exists idx_lotes_produto_status
  on public.lotes (produto_id, status);

create index if not exists idx_lotes_seller
  on public.lotes (seller_id);

create index if not exists idx_lote_reservas_lote_status
  on public.lote_reservas (lote_id, status);

create index if not exists idx_lote_reservas_expira_ativa
  on public.lote_reservas (expira_em, status)
  where status = 'ATIVA';

create index if not exists idx_lote_reservas_session
  on public.lote_reservas (session_id);

create index if not exists idx_lote_lista_espera_lote
  on public.lote_lista_espera (lote_id);

create index if not exists idx_lote_eventos_lote_criado
  on public.lote_eventos (lote_id, criado_em desc);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.lotes             enable row level security;
alter table public.lote_reservas     enable row level security;
alter table public.lote_lista_espera enable row level security;
alter table public.lote_eventos      enable row level security;

-- Public can read active lotes (for PDP display)
drop policy if exists lotes_public_read_abertos on public.lotes;
create policy lotes_public_read_abertos
  on public.lotes for select to public
  using (status not in ('SUSPENSO'));

-- Reservas: owner (by session match not possible in RLS — use admin client in API)
-- Full access via service_role (admin client bypasses RLS)

-- Lista espera: public insert, read own
drop policy if exists lote_lista_espera_public_insert on public.lote_lista_espera;
create policy lote_lista_espera_public_insert
  on public.lote_lista_espera for insert to public
  with check (true);

drop policy if exists lote_lista_espera_own_read on public.lote_lista_espera;
create policy lote_lista_espera_own_read
  on public.lote_lista_espera for select to public
  using (user_id = auth.uid());

-- ─── ATOMIC RESERVATION FUNCTION (SELECT FOR UPDATE) ─────────────────────────

create or replace function public.fn_reservar_lote(
  p_lote_id        uuid,
  p_session_id     varchar,
  p_quantidade     int,
  p_user_id        uuid    default null,
  p_expira_minutos int     default 15
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_lote           public.lotes%rowtype;
  v_reserva_id     uuid;
  v_expira_em      timestamptz;
  v_status_ant     public.lote_status;
  v_status_novo    public.lote_status;
  v_new_disponivel int;
begin
  -- Lock row to prevent concurrent over-reservation
  select * into v_lote
  from public.lotes
  where id = p_lote_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'lote_not_found');
  end if;

  if v_lote.status in ('ENCERRADO', 'SUSPENSO') then
    return jsonb_build_object(
      'ok', false,
      'error', 'lote_not_available',
      'status', v_lote.status::text
    );
  end if;

  if v_lote.qtd_disponivel < p_quantidade then
    return jsonb_build_object(
      'ok', false,
      'error', 'quantidade_insuficiente',
      'disponivel', v_lote.qtd_disponivel
    );
  end if;

  v_reserva_id     := gen_random_uuid();
  v_expira_em      := now() + (p_expira_minutos || ' minutes')::interval;
  v_status_ant     := v_lote.status;
  v_new_disponivel := v_lote.qtd_disponivel - p_quantidade;

  -- Create reservation record
  insert into public.lote_reservas
    (id, lote_id, session_id, user_id, quantidade, expira_em, status, criado_em)
  values
    (v_reserva_id, p_lote_id, p_session_id, p_user_id, p_quantidade, v_expira_em, 'ATIVA', now());

  -- Decrement disponivel, increment reservada
  update public.lotes
  set
    qtd_disponivel = qtd_disponivel - p_quantidade,
    qtd_reservada  = qtd_reservada  + p_quantidade
  where id = p_lote_id;

  -- Auto status transition
  v_status_novo := v_status_ant;

  if v_new_disponivel = 0 and v_status_ant != 'ENCERRADO' then
    v_status_novo := 'ENCERRADO';
    update public.lotes
    set status = 'ENCERRADO', encerrado_em = now()
    where id = p_lote_id;

  elsif v_new_disponivel <= (v_lote.qtd_total * v_lote.limiar_alerta_pct / 100)
    and v_status_ant = 'ABERTO'
  then
    v_status_novo := 'EM_ESGOTAMENTO';
    update public.lotes
    set status = 'EM_ESGOTAMENTO'
    where id = p_lote_id;
  end if;

  -- Log RESERVA event
  insert into public.lote_eventos
    (id, lote_id, tipo, status_anterior, status_novo, delta_qtd, actor_id, metadata, criado_em)
  values (
    gen_random_uuid(), p_lote_id, 'RESERVA',
    v_status_ant, v_status_novo,
    -p_quantidade, p_user_id,
    jsonb_build_object('session_id', p_session_id, 'reserva_id', v_reserva_id),
    now()
  );

  -- Log TRANSICAO event if status changed
  if v_status_novo != v_status_ant then
    insert into public.lote_eventos
      (id, lote_id, tipo, status_anterior, status_novo, delta_qtd, actor_id, metadata, criado_em)
    values (
      gen_random_uuid(), p_lote_id, 'TRANSICAO',
      v_status_ant, v_status_novo,
      0, p_user_id,
      jsonb_build_object('trigger', 'reserva_automatica'),
      now()
    );
  end if;

  return jsonb_build_object(
    'ok',          true,
    'reserva_id',  v_reserva_id,
    'expira_em',   v_expira_em,
    'qtd_disponivel', v_new_disponivel
  );
end;
$$;

-- ─── EXPIRY RELEASE FUNCTION (called by cron job) ─────────────────────────────

create or replace function public.fn_liberar_reservas_expiradas(
  p_limite int default 500
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_reserva   record;
  v_lote      public.lotes%rowtype;
  v_status_ant  public.lote_status;
  v_status_novo public.lote_status;
  v_liberadas   int := 0;
begin
  for v_reserva in
    select id, lote_id, quantidade, user_id
    from public.lote_reservas
    where status = 'ATIVA'
      and expira_em < now()
    order by expira_em
    limit p_limite
    for update skip locked
  loop
    -- Mark reservation as expired
    update public.lote_reservas
    set status = 'EXPIRADA'
    where id = v_reserva.id;

    -- Lock and update the lote atomically
    select * into v_lote
    from public.lotes
    where id = v_reserva.lote_id
    for update;

    if not found then
      continue;
    end if;

    v_status_ant  := v_lote.status;
    v_status_novo := v_lote.status;

    update public.lotes
    set
      qtd_disponivel = qtd_disponivel + v_reserva.quantidade,
      qtd_reservada  = greatest(0, qtd_reservada - v_reserva.quantidade)
    where id = v_reserva.lote_id;

    -- Recalculate status after restoring qty
    select * into v_lote from public.lotes where id = v_reserva.lote_id;

    if v_lote.status = 'ENCERRADO' and v_lote.qtd_disponivel > 0 then
      if v_lote.qtd_disponivel <= (v_lote.qtd_total * v_lote.limiar_alerta_pct / 100) then
        v_status_novo := 'EM_ESGOTAMENTO';
      else
        v_status_novo := 'ABERTO';
      end if;
      update public.lotes set status = v_status_novo where id = v_reserva.lote_id;
    elsif v_lote.status = 'EM_ESGOTAMENTO'
      and v_lote.qtd_disponivel > (v_lote.qtd_total * v_lote.limiar_alerta_pct / 100)
    then
      v_status_novo := 'ABERTO';
      update public.lotes set status = 'ABERTO' where id = v_reserva.lote_id;
    end if;

    -- Log LIBERACAO
    insert into public.lote_eventos
      (id, lote_id, tipo, status_anterior, status_novo, delta_qtd, actor_id, metadata, criado_em)
    values (
      gen_random_uuid(), v_reserva.lote_id, 'LIBERACAO',
      v_status_ant, v_status_novo,
      v_reserva.quantidade, v_reserva.user_id,
      jsonb_build_object('reserva_id', v_reserva.id, 'motivo', 'expiracao'),
      now()
    );

    if v_status_novo != v_status_ant then
      insert into public.lote_eventos
        (id, lote_id, tipo, status_anterior, status_novo, delta_qtd, actor_id, metadata, criado_em)
      values (
        gen_random_uuid(), v_reserva.lote_id, 'TRANSICAO',
        v_status_ant, v_status_novo,
        0, null,
        jsonb_build_object('trigger', 'liberacao_expiracao'),
        now()
      );
    end if;

    v_liberadas := v_liberadas + 1;
  end loop;

  return jsonb_build_object('ok', true, 'liberadas', v_liberadas);
end;
$$;

-- ─── RESTORE QTY FUNCTION (used by cancellation and confirmation routes) ──────

create or replace function public.fn_restaurar_qtd_lote(
  p_lote_id   uuid,
  p_quantidade int,
  p_actor_id  uuid    default null,
  p_reserva_id uuid   default null,
  p_motivo    varchar default 'liberacao'
)
returns void
language plpgsql
security definer
as $$
declare
  v_lote      public.lotes%rowtype;
  v_status_ant  public.lote_status;
  v_status_novo public.lote_status;
begin
  select * into v_lote from public.lotes where id = p_lote_id for update;
  if not found then return; end if;

  v_status_ant  := v_lote.status;
  v_status_novo := v_lote.status;

  update public.lotes
  set
    qtd_disponivel = qtd_disponivel + p_quantidade,
    qtd_reservada  = greatest(0, qtd_reservada - p_quantidade)
  where id = p_lote_id;

  -- Re-read after update
  select * into v_lote from public.lotes where id = p_lote_id;

  if v_lote.status = 'ENCERRADO' and v_lote.qtd_disponivel > 0 then
    v_status_novo :=
      case when v_lote.qtd_disponivel <= (v_lote.qtd_total * v_lote.limiar_alerta_pct / 100)
        then 'EM_ESGOTAMENTO'::public.lote_status
        else 'ABERTO'::public.lote_status
      end;
    update public.lotes set status = v_status_novo where id = p_lote_id;
  elsif v_lote.status = 'EM_ESGOTAMENTO'
    and v_lote.qtd_disponivel > (v_lote.qtd_total * v_lote.limiar_alerta_pct / 100)
  then
    v_status_novo := 'ABERTO';
    update public.lotes set status = 'ABERTO', encerrado_em = null where id = p_lote_id;
  end if;

  insert into public.lote_eventos
    (id, lote_id, tipo, status_anterior, status_novo, delta_qtd, actor_id, metadata, criado_em)
  values (
    gen_random_uuid(), p_lote_id, 'LIBERACAO',
    v_status_ant, v_status_novo,
    p_quantidade, p_actor_id,
    jsonb_build_object(
      'reserva_id', p_reserva_id,
      'motivo', p_motivo
    ),
    now()
  );

  if v_status_novo != v_status_ant then
    insert into public.lote_eventos
      (id, lote_id, tipo, status_anterior, status_novo, delta_qtd, actor_id, metadata, criado_em)
    values (
      gen_random_uuid(), p_lote_id, 'TRANSICAO',
      v_status_ant, v_status_novo,
      0, p_actor_id,
      jsonb_build_object('trigger', p_motivo),
      now()
    );
  end if;
end;
$$;

-- ─── CONFIRM SALE FUNCTION (called on Stripe webhook) ─────────────────────────

create or replace function public.fn_confirmar_venda_lote(
  p_lote_id    uuid,
  p_reserva_id uuid,
  p_pedido_id  uuid,
  p_actor_id   uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_reserva public.lote_reservas%rowtype;
begin
  select * into v_reserva
  from public.lote_reservas
  where id = p_reserva_id and lote_id = p_lote_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'reserva_not_found');
  end if;

  if v_reserva.status = 'CONFIRMADA' then
    return jsonb_build_object('ok', true, 'idempotent', true);
  end if;

  if v_reserva.status != 'ATIVA' then
    return jsonb_build_object('ok', false, 'error', 'reserva_not_active', 'status', v_reserva.status::text);
  end if;

  -- Confirm: decrement qtd_reservada definitively (qtd_disponivel already decremented on reserve)
  update public.lote_reservas
  set status = 'CONFIRMADA', pedido_id = p_pedido_id
  where id = p_reserva_id;

  update public.lotes
  set qtd_reservada = greatest(0, qtd_reservada - v_reserva.quantidade)
  where id = p_lote_id;

  insert into public.lote_eventos
    (id, lote_id, tipo, status_anterior, status_novo, delta_qtd, actor_id, metadata, criado_em)
  values (
    gen_random_uuid(), p_lote_id, 'VENDA',
    null, null,
    -v_reserva.quantidade, p_actor_id,
    jsonb_build_object('reserva_id', p_reserva_id, 'pedido_id', p_pedido_id),
    now()
  );

  return jsonb_build_object('ok', true);
end;
$$;

-- Grant execute to service_role (used by admin client in API routes)
grant execute on function public.fn_reservar_lote to service_role;
grant execute on function public.fn_liberar_reservas_expiradas to service_role;
grant execute on function public.fn_restaurar_qtd_lote to service_role;
grant execute on function public.fn_confirmar_venda_lote to service_role;
