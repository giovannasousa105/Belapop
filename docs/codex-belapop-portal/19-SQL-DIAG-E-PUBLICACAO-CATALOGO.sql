-- BelaPop - Diagnostico e publicacao de catalogo (com contagem real de updates)
-- Rode no Supabase SQL Editor.

begin;

-- 1) Diagnostico base
select count(*) as total_products from public.products;

select
  coalesce(status, '<null>') as status,
  count(*) as total
from public.products
group by coalesce(status, '<null>')
order by total desc;

-- 2) Publicar somente status de trabalho (ajuste conforme sua operacao)
with updated_status as (
  update public.products
  set status = 'published'
  where coalesce(lower(status), '') in ('draft', 'pending_review', 'needs_adjustment', 'review')
  returning id
)
select count(*) as rows_status_published from updated_status;

-- 3) Garantir estoque minimo para vitrine
with updated_stock as (
  update public.products
  set stock_quantity = greatest(coalesce(stock_quantity, 0), 10)
  where coalesce(lower(status), '') in ('active', 'published')
  returning id
)
select count(*) as rows_stock_updated from updated_stock;

-- 4) QA final para o catalogo
select
  count(*) as total_live,
  count(*) filter (where cardinality(coalesce(tags, '{}'::text[])) > 0) as tagged_live
from public.products
where coalesce(lower(status), '') in ('active', 'published');

select
  slug,
  coalesce(title, name) as product_name,
  status,
  stock_quantity,
  tags
from public.products
where coalesce(lower(status), '') in ('active', 'published')
order by created_at desc nulls last
limit 30;

commit;
