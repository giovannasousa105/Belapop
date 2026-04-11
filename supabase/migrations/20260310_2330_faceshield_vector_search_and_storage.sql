-- =========================================================
-- FaceShield Vector Search + Storage
-- =========================================================

create extension if not exists vector with schema extensions;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'skin-scans',
  'skin-scans',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.dermatology_documents
  add column if not exists embedding extensions.vector(128),
  add column if not exists embedding_version text not null default 'semantic_v1';

create index if not exists idx_skin_embeddings_embedding
  on public.skin_embeddings
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 50);

create index if not exists idx_dermatology_documents_embedding
  on public.dermatology_documents
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 50);

create or replace function public.search_dermatology_documents(
  p_query_embedding extensions.vector(128),
  p_limit integer default 4,
  p_topic_slug text default null
)
returns table (
  id uuid,
  slug text,
  title text,
  topic_slug text,
  body text,
  source_label text,
  source_url text,
  similarity numeric
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select
    dd.id,
    dd.slug,
    dd.title,
    dd.topic_slug,
    dd.body,
    dd.source_label,
    dd.source_url,
    round(greatest(0::numeric, (1 - (dd.embedding <=> p_query_embedding))::numeric), 4) as similarity
  from public.dermatology_documents dd
  where dd.embedding is not null
    and (
      p_topic_slug is null
      or dd.topic_slug = p_topic_slug
      or dd.topic_slug = 'general'
    )
  order by dd.embedding <=> p_query_embedding asc, dd.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 4), 8));
$$;

grant execute on function public.search_dermatology_documents(extensions.vector, integer, text)
  to authenticated, service_role;
