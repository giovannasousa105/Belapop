-- =============================================================================
-- Migration: 20260620_0200_drops_slug_platform.sql
--
-- Adds missing platform columns to drops (slug, sem_reposicao, canal),
-- converts drop status from enum to text (adds 'scheduled' / 'sold_out'),
-- adds lote_id to drop_items, creates RLS public-read policies,
-- platform PG functions, and backfills slug from title.
--
-- Idempotent: all DDL uses IF NOT EXISTS / DO $$ / USING guards.
-- =============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ── drops: status column — enum → text with check constraint ─────────────────
-- The original 20260528 migration created status as drop_status_enum which
-- lacks 'scheduled' and 'sold_out'. Convert to text to safely add values.

ALTER TABLE public.drops
  ALTER COLUMN status TYPE text USING status::text;

ALTER TABLE public.drops
  ALTER COLUMN status SET DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'drops_status_check'
      AND conrelid = 'public.drops'::regclass
  ) THEN
    ALTER TABLE public.drops ADD CONSTRAINT drops_status_check CHECK (
      status IN ('draft','scheduled','live','closed','sold_out','fulfilling','delivered')
    );
  END IF;
END $$;

-- ── drops: add missing platform columns ──────────────────────────────────────

ALTER TABLE public.drops
  ADD COLUMN IF NOT EXISTS slug          text,
  ADD COLUMN IF NOT EXISTS sem_reposicao boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS canal         text    NOT NULL DEFAULT 'ambos';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'drops_slug_unique'
      AND conrelid = 'public.drops'::regclass
  ) THEN
    ALTER TABLE public.drops ADD CONSTRAINT drops_slug_unique UNIQUE (slug);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'drops_canal_check'
      AND conrelid = 'public.drops'::regclass
  ) THEN
    ALTER TABLE public.drops ADD CONSTRAINT drops_canal_check
      CHECK (canal IN ('site','circulo','ambos'));
  END IF;
END $$;

-- ── drop_items: create (if missing) or patch existing ────────────────────────
-- If the table already exists from 20260528 it won't be recreated, but the
-- ADD COLUMN below ensures lote_id is present regardless.

CREATE TABLE IF NOT EXISTS public.drop_items (
  id                      uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id                 uuid  NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  product_id              uuid  REFERENCES public.products(id),
  lote_id                 uuid  REFERENCES public.lotes(id),
  drop_price_cents        int   NOT NULL CHECK (drop_price_cents > 0),
  max_quantity            int   NOT NULL CHECK (max_quantity > 0),
  sold_quantity           int   NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  fulfillment_eta_days    int   NOT NULL DEFAULT 7,
  stripe_payment_link_url text,
  stripe_payment_link_id  text,
  CONSTRAINT drop_items_sold_lte_max          CHECK (sold_quantity <= max_quantity),
  CONSTRAINT drop_items_drop_product_unique   UNIQUE (drop_id, product_id)
);

ALTER TABLE public.drop_items
  ADD COLUMN IF NOT EXISTS lote_id uuid REFERENCES public.lotes(id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.drops      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS drops_public_read      ON public.drops;
CREATE POLICY drops_public_read
  ON public.drops FOR SELECT TO public
  USING (status NOT IN ('draft'));

DROP POLICY IF EXISTS drop_items_public_read ON public.drop_items;
CREATE POLICY drop_items_public_read
  ON public.drop_items FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.drops d
    WHERE d.id = drop_items.drop_id
      AND d.status NOT IN ('draft')
  ));

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_drops_slug        ON public.drops (slug);
CREATE INDEX IF NOT EXISTS idx_drops_status      ON public.drops (status);
CREATE INDEX IF NOT EXISTS idx_drops_canal       ON public.drops (canal);
CREATE INDEX IF NOT EXISTS idx_drop_items_drop   ON public.drop_items (drop_id);
CREATE INDEX IF NOT EXISTS idx_drop_items_lote   ON public.drop_items (lote_id);
CREATE INDEX IF NOT EXISTS idx_drops_opens_sched ON public.drops (opens_at) WHERE status = 'scheduled';

-- ── Trigger: updated_at ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_drops_updated_at ON public.drops;
CREATE TRIGGER trg_drops_updated_at
  BEFORE UPDATE ON public.drops
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ── fn_confirmar_drop_venda ───────────────────────────────────────────────────
-- Called after payment_intent.succeeded webhook.
-- Increments sold_quantity, updates drop stats, auto-transitions to sold_out.

CREATE OR REPLACE FUNCTION public.fn_confirmar_drop_venda(
  p_drop_id         uuid,
  p_drop_item_id    uuid,
  p_price_cents     int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item     public.drop_items%rowtype;
  v_new_sold int;
BEGIN
  SELECT * INTO v_item
  FROM public.drop_items
  WHERE id = p_drop_item_id AND drop_id = p_drop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'drop_item_not_found');
  END IF;

  IF v_item.sold_quantity >= v_item.max_quantity THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_sold_out');
  END IF;

  UPDATE public.drop_items
    SET sold_quantity = sold_quantity + 1
  WHERE id = p_drop_item_id
  RETURNING sold_quantity INTO v_new_sold;

  UPDATE public.drops
  SET
    total_orders = total_orders + 1,
    gmv_cents    = gmv_cents + p_price_cents,
    status       = CASE
                     WHEN status = 'live' AND v_new_sold >= v_item.max_quantity
                     THEN 'sold_out'
                     ELSE status
                   END
  WHERE id = p_drop_id;

  RETURN jsonb_build_object('ok', true, 'sold_quantity', v_new_sold);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_confirmar_drop_venda TO service_role;

-- ── fn_sincronizar_status_drops ───────────────────────────────────────────────
-- scheduled → live when opens_at has passed.
-- live → closed when closes_at has passed.

CREATE OR REPLACE FUNCTION public.fn_sincronizar_status_drops()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_abertos  int := 0;
  v_fechados int := 0;
BEGIN
  UPDATE public.drops
    SET status = 'live', updated_at = NOW()
  WHERE status = 'scheduled'
    AND opens_at  IS NOT NULL
    AND opens_at  <= NOW()
    AND (closes_at IS NULL OR closes_at > NOW());
  GET DIAGNOSTICS v_abertos = ROW_COUNT;

  UPDATE public.drops
    SET status = 'closed', updated_at = NOW()
  WHERE status = 'live'
    AND closes_at IS NOT NULL
    AND closes_at <= NOW();
  GET DIAGNOSTICS v_fechados = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok',      true,
    'abertos', v_abertos,
    'fechados', v_fechados
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_sincronizar_status_drops TO service_role;

-- ── Backfill slug for existing drops ─────────────────────────────────────────

UPDATE public.drops
SET slug = regexp_replace(
  lower(unaccent(trim(title))),
  '[^a-z0-9]+', '-', 'g'
)
WHERE slug IS NULL;
