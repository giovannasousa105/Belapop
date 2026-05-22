-- ─── Catálogo — busca avançada, wishlist e avaliações ────────────────────────
-- Additive e idempotente. Não toca em colunas existentes de products.
--
-- O que adiciona:
--   · Colunas de catálogo em products (universo, necessidades, métricas)
--   · search_vector GENERATED ALWAYS AS STORED com índice GIN
--   · Tabela wishlist_itens (catálogo — substitui wishlist_items legada)
--   · Tabela produto_avaliacoes (reviews com compatibilidade de pele)
--   · fn_buscar_produtos — FTS + filtros + scoring personalizado
--   · fn_atualizar_metricas_produtos — recalcula rating_medio, total_vendas_30d
--   · Trigger trg_wishlist_notify — Realtime para wishlist

-- ─── Colunas de catálogo em products ─────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS universo               TEXT,              -- rosto|corpo|cabelo|perfumaria|wellness
  ADD COLUMN IF NOT EXISTS necessidades           TEXT[]  DEFAULT '{}',  -- ['hidratacao','anti-idade',...]
  ADD COLUMN IF NOT EXISTS duracao_media_dias     INT     DEFAULT 60,
  ADD COLUMN IF NOT EXISTS total_vendas_30d       INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_medio           NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_avaliacoes       INT     DEFAULT 0;

-- search_vector: GENERATED ALWAYS exige todos os campos referenced já existam
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('portuguese', coalesce(name,  '')), 'A') ||
      setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('portuguese', coalesce(brand, '')), 'B') ||
      setweight(to_tsvector('portuguese', coalesce(description, '')), 'C') ||
      setweight(to_tsvector('portuguese', coalesce(category, '')), 'B') ||
      setweight(to_tsvector('portuguese', coalesce(universo, '')), 'B') ||
      setweight(to_tsvector('portuguese', coalesce(array_to_string(necessidades, ' '), '')), 'C')
    ) STORED;

-- ─── Índices para busca e filtros ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_products_universo
  ON products (universo)
  WHERE universo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_necessidades_gin
  ON products USING gin(necessidades);

CREATE INDEX IF NOT EXISTS idx_products_tipo_pele_gin
  ON products USING gin(tipo_pele_indicado);

CREATE INDEX IF NOT EXISTS idx_products_ranking
  ON products (total_vendas_30d DESC, rating_medio DESC, total_avaliacoes DESC);

-- ─── wishlist_itens ───────────────────────────────────────────────────────────
-- Tabela nova (catálogo) — diferente da wishlist_items legada (base.sql)

CREATE TABLE IF NOT EXISTS wishlist_itens (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id      uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- snapshot de compatibilidade no momento do coração
  compat_score    SMALLINT    CHECK (compat_score >= 0 AND compat_score <= 100),
  tipo_pele       TEXT,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_itens_user
  ON wishlist_itens (user_id, criado_em DESC);

-- ─── produto_avaliacoes ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS produto_avaliacoes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota            SMALLINT    NOT NULL CHECK (nota >= 1 AND nota <= 5),
  titulo          TEXT,
  texto           TEXT,
  -- dados de pele no momento da avaliação (para analytics de compatibilidade)
  tipo_pele       TEXT,
  compat_score    SMALLINT    CHECK (compat_score >= 0 AND compat_score <= 100),
  aprovada        BOOLEAN     NOT NULL DEFAULT false,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_product
  ON produto_avaliacoes (product_id, aprovada, criado_em DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE wishlist_itens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_avaliacoes ENABLE ROW LEVEL SECURITY;

-- wishlist_itens: usuário vê e modifica apenas os seus
DO $$ BEGIN
  CREATE POLICY "wishlist_itens_self"
    ON wishlist_itens FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "wishlist_itens_service"
    ON wishlist_itens FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- produto_avaliacoes: usuário vê as próprias + todas aprovadas
DO $$ BEGIN
  CREATE POLICY "avaliacoes_read_public"
    ON produto_avaliacoes FOR SELECT TO authenticated
    USING (aprovada = true OR user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "avaliacoes_insert_self"
    ON produto_avaliacoes FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "avaliacoes_service"
    ON produto_avaliacoes FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── fn_atualizar_metricas_produtos ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_atualizar_metricas_produtos(p_product_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products p
  SET
    rating_medio     = sub.rating_medio,
    total_avaliacoes = sub.total_avaliacoes
  FROM (
    SELECT
      product_id,
      ROUND(AVG(nota)::numeric, 2)        AS rating_medio,
      COUNT(*)                             AS total_avaliacoes
    FROM produto_avaliacoes
    WHERE aprovada = true
      AND (p_product_id IS NULL OR product_id = p_product_id)
    GROUP BY product_id
  ) sub
  WHERE p.id = sub.product_id
    AND (p_product_id IS NULL OR p.id = p_product_id);

  -- total_vendas_30d: contagem de order_items nos últimos 30 dias
  UPDATE products p
  SET total_vendas_30d = sub.cnt
  FROM (
    SELECT
      oi.product_id,
      COALESCE(SUM(oi.quantity), 0) AS cnt
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at >= now() - interval '30 days'
      AND o.status NOT IN ('cancelled', 'refunded')
      AND (p_product_id IS NULL OR oi.product_id = p_product_id)
    GROUP BY oi.product_id
  ) sub
  WHERE p.id = sub.product_id
    AND (p_product_id IS NULL OR p.id = p_product_id);
END;
$$;

-- ─── fn_buscar_produtos ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_buscar_produtos(
  p_query              TEXT        DEFAULT NULL,
  p_universo           TEXT        DEFAULT NULL,
  p_necessidades       TEXT[]      DEFAULT NULL,
  p_tipo_pele          TEXT[]      DEFAULT NULL,
  p_sensibilidade_max  INT         DEFAULT NULL,
  p_passo_rotina       TEXT        DEFAULT NULL,
  p_periodo            TEXT        DEFAULT NULL,
  p_preco_min          INT         DEFAULT NULL,
  p_preco_max          INT         DEFAULT NULL,
  p_curated            BOOLEAN     DEFAULT NULL,
  p_user_id            uuid        DEFAULT NULL,
  p_compat_scores      jsonb       DEFAULT NULL,  -- {"product_id": score, ...}
  p_limit              INT         DEFAULT 24,
  p_offset             INT         DEFAULT 0,
  p_sort               TEXT        DEFAULT 'relevancia'  -- relevancia|preco_asc|preco_desc|mais_vendidos|melhor_avaliados
)
RETURNS TABLE (
  id                  uuid,
  name                TEXT,
  brand               TEXT,
  price_cents         INT,
  images              jsonb,
  universo            TEXT,
  necessidades        TEXT[],
  tipo_pele_indicado  TEXT[],
  nivel_sensibilidade_max INT,
  passo_rotina        TEXT,
  periodo             TEXT,
  total_vendas_30d    INT,
  rating_medio        NUMERIC,
  total_avaliacoes    INT,
  curated             BOOLEAN,
  is_featured         BOOLEAN,
  stock_quantity      INT,
  compat_score        SMALLINT,
  na_wishlist         BOOLEAN,
  rank_score          DOUBLE PRECISION,
  total_count         BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tsquery tsquery;
BEGIN
  -- Converter query em tsquery se fornecida
  IF p_query IS NOT NULL AND p_query <> '' THEN
    BEGIN
      v_tsquery := websearch_to_tsquery('portuguese', p_query);
    EXCEPTION WHEN OTHERS THEN
      v_tsquery := NULL;
    END;
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      pr.id,
      pr.name::TEXT,
      pr.brand::TEXT,
      pr.price_cents,
      pr.images,
      pr.universo,
      pr.necessidades,
      pr.tipo_pele_indicado,
      pr.nivel_sensibilidade_max,
      pr.passo_rotina,
      pr.periodo,
      pr.total_vendas_30d,
      pr.rating_medio,
      pr.total_avaliacoes,
      pr.curated,
      pr.is_featured,
      pr.stock_quantity,
      (p_compat_scores->>pr.id::text)::smallint AS compat_score,
      (
        p_user_id IS NOT NULL AND
        EXISTS (SELECT 1 FROM wishlist_itens wi WHERE wi.user_id = p_user_id AND wi.product_id = pr.id)
      ) AS na_wishlist
    FROM products pr
    WHERE pr.status = 'published'
      AND pr.stock_quantity > 0
      AND pr.price_cents > 0
      -- FTS
      AND (v_tsquery IS NULL OR pr.search_vector @@ v_tsquery)
      -- Filtros dimensionais
      AND (p_universo           IS NULL OR pr.universo = p_universo)
      AND (p_necessidades       IS NULL OR pr.necessidades && p_necessidades)
      AND (p_tipo_pele          IS NULL OR pr.tipo_pele_indicado && p_tipo_pele)
      AND (p_sensibilidade_max  IS NULL OR pr.nivel_sensibilidade_max >= p_sensibilidade_max)
      AND (p_passo_rotina       IS NULL OR pr.passo_rotina = p_passo_rotina)
      AND (p_periodo            IS NULL OR pr.periodo = p_periodo OR pr.periodo = 'ambos')
      AND (p_preco_min          IS NULL OR pr.price_cents >= p_preco_min)
      AND (p_preco_max          IS NULL OR pr.price_cents <= p_preco_max)
      AND (p_curated            IS NULL OR pr.curated = p_curated)
  ),
  scored AS (
    SELECT
      b.*,
      CASE p_sort
        WHEN 'relevancia' THEN (
          -- FTS rank base
          COALESCE(ts_rank(
            (SELECT search_vector FROM products WHERE id = b.id),
            COALESCE(v_tsquery, to_tsquery('portuguese', 'bela'))
          ), 0)::float8 * 10
          -- boost editorial
          + CASE WHEN b.is_featured THEN 8.0 ELSE 0.0 END
          + CASE WHEN b.curated     THEN 5.0 ELSE 0.0 END
          -- boost compatibilidade (compat_score 0-100 → 0-7)
          + COALESCE(b.compat_score, 0)::float8 / 100.0 * 7.0
          -- boost vendas recentes (log)
          + ln(1 + b.total_vendas_30d)
          -- boost rating
          + b.rating_medio::float8
        )
        WHEN 'mais_vendidos'   THEN b.total_vendas_30d::float8
        WHEN 'melhor_avaliados' THEN (b.rating_medio * ln(1 + b.total_avaliacoes))::float8
        WHEN 'preco_asc'       THEN (1000000.0 - b.price_cents)::float8
        WHEN 'preco_desc'      THEN b.price_cents::float8
        ELSE 0.0
      END AS rank_score
    FROM base b
  ),
  counted AS (
    SELECT *, COUNT(*) OVER () AS total_count
    FROM scored
    ORDER BY rank_score DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT
    c.id, c.name, c.brand, c.price_cents, c.images,
    c.universo, c.necessidades, c.tipo_pele_indicado,
    c.nivel_sensibilidade_max, c.passo_rotina, c.periodo,
    c.total_vendas_30d, c.rating_medio, c.total_avaliacoes,
    c.curated, c.is_featured, c.stock_quantity,
    c.compat_score, c.na_wishlist, c.rank_score, c.total_count
  FROM counted c;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_buscar_produtos TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION fn_atualizar_metricas_produtos TO service_role;

-- ─── Trigger: atualizar métricas após nova avaliação aprovada ────────────────

CREATE OR REPLACE FUNCTION _trg_metricas_apos_avaliacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.aprovada = true THEN
    PERFORM fn_atualizar_metricas_produtos(NEW.product_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_metricas_apos_avaliacao ON produto_avaliacoes;
CREATE TRIGGER trg_metricas_apos_avaliacao
  AFTER INSERT OR UPDATE OF aprovada ON produto_avaliacoes
  FOR EACH ROW EXECUTE FUNCTION _trg_metricas_apos_avaliacao();

-- ─── Trigger: Realtime para wishlist ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION _trg_wishlist_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_notify(
    'wishlist_changed',
    json_build_object(
      'user_id',    COALESCE(NEW.user_id, OLD.user_id),
      'product_id', COALESCE(NEW.product_id, OLD.product_id),
      'op',         TG_OP
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_wishlist_notify ON wishlist_itens;
CREATE TRIGGER trg_wishlist_notify
  AFTER INSERT OR DELETE ON wishlist_itens
  FOR EACH ROW EXECUTE FUNCTION _trg_wishlist_notify();
