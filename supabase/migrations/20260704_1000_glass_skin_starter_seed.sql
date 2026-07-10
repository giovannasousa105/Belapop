-- Glass Skin Starter — seed de produto para lançamento
-- status: draft até as imagens serem enviadas (mude para 'published' após upload)
-- Reversível: deletar pelo slug ou mudar status para 'draft'

INSERT INTO products (
  slug,
  title,
  name,
  description,
  price_cents,
  currency,
  status,
  seller_id,
  stock_quantity,
  category,
  editorial_reason,
  highlights,
  how_to_use,
  images,
  hero_image_url,
  gallery,
  is_featured,
  curated
)
VALUES (
  'glass-skin-starter',

  'Glass Skin Starter — Rotina Coreana de Pele de Vidro em 5 Passos',

  'Glass Skin Starter — Rotina Coreana de Pele de Vidro em 5 Passos',

  'Cinco produtos coreanos, uma rotina que se completa. O Glass Skin Starter tira a adivinhação da sua skincare: limpar sem agredir, hidratar em camadas, selar e proteger — na ordem certa, com curadoria científica. Sem promessa de milagre. Com método.',

  39900,   -- R$ 399,00

  'BRL',

  'draft',  -- ALTERAR PARA ''published'' APÓS UPLOAD DAS IMAGENS

  NULL,     -- produto da BelaPop (sem seller externo)

  10,       -- estoque inicial

  'skincare',

  'Na BelaPop, cada produto entra por evidência e sinergia — não por moda. Aqui a ciência testa antes de qualquer promessa. As afirmações referem-se a benefícios cosméticos (hidratação, viço, conforto e proteção UV). Produtos de skincare não substituem acompanhamento profissional.',

  '[
    "Hidratação em camadas de verdade — mucina de caracol + hialurônico 5D da superfície às camadas mais profundas.",
    "Barreira respeitada do primeiro passo — limpeza de pH baixo que não detona a proteção natural da pele.",
    "Acabamento leve, sem peso — texturas de rápida absorção, sem sensação pegajosa.",
    "Proteção que fecha a conta — SPF50+ PA++++ de amplo espectro.",
    "Curadoria científica — cada produto escolhido por evidência e sinergia, não por hype."
  ]'::jsonb,

  '[
    "1) Cleanser — pH baixo, 60 seg, enxágue com água fria",
    "2) Snail 96 Essence — pele úmida, patting suave até absorver",
    "3) Torriden Dive-In Serum — 3 gotas, pressionar (não esfregar)",
    "4) Snail 92 Cream — camada leve para selar",
    "5) Relief Sun SPF50+ — último passo, sempre (manhã)"
  ]'::jsonb,

  '[]'::jsonb,  -- imagens: adicionar URLs após upload

  NULL,          -- hero_image_url: preencher após upload

  '[]'::jsonb,  -- gallery: preencher após upload

  true,   -- is_featured

  true    -- curated
)
ON CONFLICT (slug) DO NOTHING;
