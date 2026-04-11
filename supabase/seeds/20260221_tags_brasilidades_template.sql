-- BelaPop - Seed template de tags Brasilidades/Editorial
-- Preencha os slugs abaixo e rode no SQL Editor do Supabase.

begin;

with seed(slug, tags) as (
  values
    -- EXEMPLOS (trocar pelos slugs reais):
    -- ('protetor-solar-invisivel-x', array['no_white_cast','bp_curated','sensitive_skin']::text[]),
    -- ('base-liquida-y', array['no_gray_cast','high_pigment','skin_tone_deep','bp_curated']::text[]),
    -- ('creme-pentear-z', array['hair_cacheado','hair_crespo','hair_transicao','sensory']::text[])
    ('__slug_aqui__', array['bp_curated']::text[])
)
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || s.tags) as t
)
from seed s
where p.slug = s.slug
  and s.slug <> '__slug_aqui__';

commit;

