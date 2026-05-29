-- =============================================================================
-- BelaPop — Círculo BelaPop + Drops
-- Migration: 20260528_circulo_drops.sql
-- Executar no painel Supabase: SQL Editor → Run
-- =============================================================================

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE skin_concern_enum AS ENUM (
    'acne', 'spots', 'barrier', 'aging', 'shine', 'unsure'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE spend_range_enum AS ENUM (
    'lt150', '150_300', '300_600', 'gt600'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE drop_status_enum AS ENUM (
    'draft', 'live', 'closed', 'fulfilling', 'delivered'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE broadcast_channel_enum AS ENUM (
    'email', 'whatsapp'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── circulo_members ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS circulo_members (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  email                     TEXT NOT NULL,
  whatsapp_e164             TEXT NOT NULL,
  skin_concern              skin_concern_enum NOT NULL,
  spend_range               spend_range_enum NOT NULL,
  source                    TEXT NOT NULL DEFAULT 'website_footer_form',
  welcome_email_sent_at     TIMESTAMPTZ,
  welcome_whatsapp_sent_at  TIMESTAMPTZ,
  consent_lgpd              BOOLEAN NOT NULL DEFAULT TRUE,
  consent_marketing         BOOLEAN NOT NULL DEFAULT TRUE,
  consent_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at           TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: um e-mail só pode ter um registro ativo
CREATE UNIQUE INDEX IF NOT EXISTS circulo_members_email_unique
  ON circulo_members (LOWER(email));

-- Índices de busca
CREATE INDEX IF NOT EXISTS circulo_members_whatsapp_idx ON circulo_members (whatsapp_e164);
CREATE INDEX IF NOT EXISTS circulo_members_concern_idx  ON circulo_members (skin_concern);
CREATE INDEX IF NOT EXISTS circulo_members_consent_idx  ON circulo_members (consent_marketing) WHERE consent_marketing = TRUE;
CREATE INDEX IF NOT EXISTS circulo_members_created_idx  ON circulo_members (created_at DESC);

-- Auto-update de updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS circulo_members_updated_at ON circulo_members;
CREATE TRIGGER circulo_members_updated_at
  BEFORE UPDATE ON circulo_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: somente service role pode ler/escrever (nunca expor ao browser)
ALTER TABLE circulo_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON circulo_members
  USING (auth.role() = 'service_role');

-- ── drops ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number        SERIAL UNIQUE NOT NULL,     -- nº legível: Drop #1, #2...
  title         TEXT NOT NULL,
  opens_at      TIMESTAMPTZ NOT NULL,
  closes_at     TIMESTAMPTZ NOT NULL,
  status        drop_status_enum NOT NULL DEFAULT 'draft',
  total_orders  INT NOT NULL DEFAULT 0,
  gmv_cents     BIGINT NOT NULL DEFAULT 0,
  notes         TEXT,                        -- notas internas
  created_by    TEXT,                        -- ID do usuário ADM que criou
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS drops_status_idx    ON drops (status);
CREATE INDEX IF NOT EXISTS drops_opens_at_idx  ON drops (opens_at DESC);

DROP TRIGGER IF EXISTS drops_updated_at ON drops;
CREATE TRIGGER drops_updated_at
  BEFORE UPDATE ON drops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON drops
  USING (auth.role() = 'service_role');

-- ── drop_items ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drop_items (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id                    UUID NOT NULL REFERENCES drops (id) ON DELETE CASCADE,
  product_id                 UUID NOT NULL REFERENCES products (id),
  drop_price_cents           INT NOT NULL CHECK (drop_price_cents > 0),
  max_quantity               INT NOT NULL DEFAULT 50 CHECK (max_quantity > 0),
  sold_quantity              INT NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  stripe_payment_link_url    TEXT,
  stripe_payment_link_id     TEXT,
  fulfillment_eta_days       INT NOT NULL DEFAULT 7,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (drop_id, product_id)
);

CREATE INDEX IF NOT EXISTS drop_items_drop_idx ON drop_items (drop_id);

DROP TRIGGER IF EXISTS drop_items_updated_at ON drop_items;
CREATE TRIGGER drop_items_updated_at
  BEFORE UPDATE ON drop_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE drop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON drop_items
  USING (auth.role() = 'service_role');

-- ── drop_broadcasts ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS drop_broadcasts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id           UUID NOT NULL REFERENCES drops (id) ON DELETE CASCADE,
  channel           broadcast_channel_enum NOT NULL,
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipients_count  INT NOT NULL DEFAULT 0,
  error_log         TEXT,
  triggered_by      TEXT      -- ID do usuário ADM que disparou
);

CREATE INDEX IF NOT EXISTS drop_broadcasts_drop_idx ON drop_broadcasts (drop_id);

ALTER TABLE drop_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON drop_broadcasts
  USING (auth.role() = 'service_role');

-- ── Comentários de documentação ───────────────────────────────────────────────

COMMENT ON TABLE circulo_members IS 'Membros inscritos no Círculo BelaPop via form do site';
COMMENT ON TABLE drops            IS 'Drops quinzenais de skincare coreano';
COMMENT ON TABLE drop_items       IS 'SKUs de cada drop com preço e link Stripe';
COMMENT ON TABLE drop_broadcasts  IS 'Audit log de broadcasts de email/WhatsApp por drop';
