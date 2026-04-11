-- Seed editorial/discovery surfaces for home and catalog deep-links.

insert into public.collections (
  slug,
  title,
  description,
  kind,
  cover_image,
  status,
  editorial_boost,
  trend_boost,
  published_at
)
values
  (
    'skincare-coreano',
    'Skincare coreano',
    'Camadas leves, brilho controlado e formulas pensadas para constancia diaria.',
    'trend',
    '/editorial/essencia-sensorial.svg',
    'published',
    18,
    24,
    now()
  ),
  (
    'clean-beauty-editorial',
    'Clean beauty',
    'Texturas limpas, pele confortavel e narrativas de formula mais objetivas.',
    'trend',
    '/editorial/presenca-diurna.svg',
    'published',
    15,
    22,
    now()
  ),
  (
    'ingredientes-raros',
    'Ingredientes raros',
    'Ativos de performance com narrativa sensorial e leitura editorial.',
    'trend',
    '/editorial/ritual-noturno.svg',
    'published',
    20,
    20,
    now()
  ),
  (
    'ritual-noturno-global',
    'Ritual noturno',
    'O fim do dia como experiencia: textura, aroma e recuperacao em camadas.',
    'trend',
    '/editorial/ritual-noturno.svg',
    'published',
    16,
    21,
    now()
  ),
  (
    'curadoria-bela-pop',
    'Curadoria BelaPop',
    'Selecao da editora com produtos que sustentam assinatura, textura e performance.',
    'curation',
    '/editorial/brasilidades.svg',
    'published',
    28,
    12,
    now()
  )
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  kind = excluded.kind,
  cover_image = excluded.cover_image,
  status = excluded.status,
  editorial_boost = excluded.editorial_boost,
  trend_boost = excluded.trend_boost,
  published_at = coalesce(public.collections.published_at, excluded.published_at),
  updated_at = now();

insert into public.origins (
  slug,
  name,
  country,
  description,
  cover_image,
  status
)
values
  (
    'franca',
    'Franca',
    'Franca',
    'Perfumaria classica, maquiagem de assinatura e acabamento sem excesso.',
    '/editorial/presenca-diurna.svg',
    'active'
  ),
  (
    'japao',
    'Japao',
    'Japao',
    'Skincare minimalista, pele calma e formulas com conforto imediato.',
    '/editorial/product-hero-skincare.svg',
    'active'
  ),
  (
    'coreia',
    'Coreia',
    'Coreia do Sul',
    'Inovacao cosmetica, camadas leves e rotina guiada por resultados.',
    '/editorial/essencia-sensorial.svg',
    'active'
  ),
  (
    'italia',
    'Italia',
    'Italia',
    'Fragrancias artesanais e rituais de corpo com gesto sofisticado.',
    '/editorial/product-hero-corpo.svg',
    'active'
  )
on conflict (slug) do update
set
  name = excluded.name,
  country = excluded.country,
  description = excluded.description,
  cover_image = excluded.cover_image,
  status = excluded.status,
  updated_at = now();

insert into public.ingredients (
  slug,
  name,
  description,
  benefits,
  origin,
  cover_image,
  status
)
values
  (
    'niacinamida',
    'Niacinamida',
    'Ativo de rotina diaria para brilho controlado e uniformizacao visual.',
    'Luminosidade mais estavel e suporte de barreira.',
    'Rotinas de tratamento',
    '/editorial/product-hero-skincare.svg',
    'active'
  ),
  (
    'ceramidas',
    'Ceramidas',
    'Lipideos de suporte para formulas reparadoras e pele sensibilizada.',
    'Conforto, hidratacao profunda e reforco de barreira.',
    'Rotinas de reparacao',
    '/editorial/product-hero-skincare.svg',
    'active'
  ),
  (
    'acido-hialuronico',
    'Acido hialuronico',
    'Humectante classico para retenção de agua e acabamento mais preenchido.',
    'Hidratacao e pele com aspecto mais macio.',
    'Rotinas de hidratacao',
    '/editorial/ritual-noturno.svg',
    'active'
  ),
  (
    'centella-asiatica',
    'Centella asiatica',
    'Extrato botanico usado em formulas calmantes e de equilibrio.',
    'Calma visual, conforto e suporte a peles sensibilizadas.',
    'Skincare asiatico',
    '/editorial/product-hero-skincare.svg',
    'active'
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  benefits = excluded.benefits,
  origin = excluded.origin,
  cover_image = excluded.cover_image,
  status = excluded.status,
  updated_at = now();

insert into public.collection_products (
  collection_id,
  product_id,
  position,
  editorial_boost
)
select
  c.id,
  p.id,
  seed.position,
  seed.editorial_boost
from (
  values
    ('skincare-coreano', 'serum-radiance-01', 1, 18),
    ('skincare-coreano', 'creme-barrier-celeste', 2, 16),
    ('skincare-coreano', 'gel-limpeza-veludo', 3, 14),
    ('skincare-coreano', 'patch-olhos-aurora', 4, 12),
    ('clean-beauty-editorial', 'creme-barrier-celeste', 1, 16),
    ('clean-beauty-editorial', 'gel-limpeza-veludo', 2, 15),
    ('clean-beauty-editorial', 'cha-botanical-calm', 3, 10),
    ('clean-beauty-editorial', 'velas-calm-02', 4, 8),
    ('ingredientes-raros', 'serum-radiance-01', 1, 18),
    ('ingredientes-raros', 'patch-olhos-aurora', 2, 15),
    ('ingredientes-raros', 'creme-barrier-celeste', 3, 14),
    ('ingredientes-raros', 'body-mist-rosa-profundo', 4, 8),
    ('ritual-noturno-global', 'oleo-capilar-nuit', 1, 14),
    ('ritual-noturno-global', 'velas-calm-02', 2, 13),
    ('ritual-noturno-global', 'cha-botanical-calm', 3, 11),
    ('ritual-noturno-global', 'body-mist-rosa-profundo', 4, 9),
    ('curadoria-bela-pop', 'oleo-capilar-nuit', 1, 20),
    ('curadoria-bela-pop', 'blush-veu-rose', 2, 18),
    ('curadoria-bela-pop', 'creme-barrier-celeste', 3, 17),
    ('curadoria-bela-pop', 'serum-radiance-01', 4, 16)
) as seed(collection_slug, product_slug, position, editorial_boost)
join public.collections c on c.slug = seed.collection_slug
join public.products p on p.slug = seed.product_slug
on conflict (collection_id, product_id) do update
set
  position = excluded.position,
  editorial_boost = excluded.editorial_boost;

insert into public.product_origins (
  product_id,
  origin_id,
  is_primary
)
select
  p.id,
  o.id,
  seed.is_primary
from (
  values
    ('serum-radiance-01', 'coreia', true),
    ('patch-olhos-aurora', 'coreia', true),
    ('gel-limpeza-veludo', 'coreia', false),
    ('creme-barrier-celeste', 'japao', true),
    ('gel-limpeza-veludo', 'japao', true),
    ('escova-ritual-zen', 'japao', true),
    ('blush-veu-rose', 'franca', true),
    ('mascara-lumiere', 'franca', true),
    ('body-mist-rosa-profundo', 'franca', false),
    ('oleo-capilar-nuit', 'italia', true),
    ('lip-tint-atelier', 'italia', true),
    ('body-mist-rosa-profundo', 'italia', true)
) as seed(product_slug, origin_slug, is_primary)
join public.products p on p.slug = seed.product_slug
join public.origins o on o.slug = seed.origin_slug
on conflict (product_id, origin_id) do update
set
  is_primary = excluded.is_primary;

insert into public.product_ingredients (
  product_id,
  ingredient_id
)
select
  p.id,
  i.id
from (
  values
    ('serum-radiance-01', 'niacinamida'),
    ('creme-barrier-celeste', 'ceramidas'),
    ('patch-olhos-aurora', 'acido-hialuronico'),
    ('gel-limpeza-veludo', 'centella-asiatica')
) as seed(product_slug, ingredient_slug)
join public.products p on p.slug = seed.product_slug
join public.ingredients i on i.slug = seed.ingredient_slug
on conflict (product_id, ingredient_id) do nothing;
