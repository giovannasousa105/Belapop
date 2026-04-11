alter table public.product_reviews
  add column if not exists is_hidden boolean not null default false;

alter table public.product_reviews
  add column if not exists moderation_status text;

alter table public.product_reviews
  add column if not exists moderation_notes text;

alter table public.product_reviews
  add column if not exists moderated_at timestamptz;

alter table public.product_reviews
  add column if not exists moderated_by text;

alter table public.product_reviews
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_reviews_moderation_status_check'
      and conrelid = 'public.product_reviews'::regclass
  ) then
    alter table public.product_reviews
      add constraint product_reviews_moderation_status_check
      check (
        moderation_status is null
        or moderation_status in (
          'aprovado',
          'em-revisao',
          'pendente',
          'reprovado',
          'critico',
          'alerta',
          'resolvido',
          'bloqueado',
          'premium',
          'destaque'
        )
      );
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc
    where proname = 'set_updated_at'
      and pg_function_is_visible(oid)
  ) then
    execute 'drop trigger if exists trg_product_reviews_updated on public.product_reviews';
    execute 'create trigger trg_product_reviews_updated before update on public.product_reviews for each row execute function public.set_updated_at()';
  end if;
end
$$;

create index if not exists idx_product_reviews_visibility_status_created
  on public.product_reviews (is_hidden, moderation_status, created_at desc);
