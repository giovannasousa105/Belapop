-- ============================================================
-- BelaPop · Skin Scan Pipeline Schema (idempotente)
-- Migration: 20260516_0400_skin_scan_schema
-- Complementa 20260515_0300_skin_scan_pipeline.sql
-- ============================================================

BEGIN;

DO $$ BEGIN CREATE TYPE scan_status AS ENUM (
  'AGUARDANDO', 'PROCESSANDO_CV', 'SCORING',
  'RECOMENDANDO', 'CONCLUIDO', 'ERRO', 'REJEITADO'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE tipo_pele_enum AS ENUM (
  'SECA', 'MISTA', 'OLEOSA', 'NORMAL', 'SENSIVEL'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── skin_scans ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skin_scans (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  session_bp            varchar(128),
  skin_id               varchar(12)  UNIQUE,
  focos_selecionados    text[]       NOT NULL DEFAULT '{}',
  imagem_hash           varchar(64),
  imagem_deletada_em    timestamptz,
  fototipo_fitzpatrick  int          CHECK (fototipo_fitzpatrick BETWEEN 1 AND 6),
  status                scan_status  NOT NULL DEFAULT 'AGUARDANDO',
  job_id                varchar(128),
  erro_mensagem         text,
  duracao_ms            int,
  consentimento_dado_em timestamptz  NOT NULL DEFAULT now(),
  criado_em             timestamptz  NOT NULL DEFAULT now(),
  atualizado_em         timestamptz  NOT NULL DEFAULT now()
);

-- Colunas novas (ADD COLUMN IF NOT EXISTS — seguro em bancos já existentes)
ALTER TABLE skin_scans ADD COLUMN IF NOT EXISTS focos_selecionados    text[]       DEFAULT '{}';
ALTER TABLE skin_scans ADD COLUMN IF NOT EXISTS imagem_hash           varchar(64);
ALTER TABLE skin_scans ADD COLUMN IF NOT EXISTS imagem_deletada_em    timestamptz;
ALTER TABLE skin_scans ADD COLUMN IF NOT EXISTS fototipo_fitzpatrick  int;
ALTER TABLE skin_scans ADD COLUMN IF NOT EXISTS job_id                varchar(128);
ALTER TABLE skin_scans ADD COLUMN IF NOT EXISTS erro_mensagem         text;
ALTER TABLE skin_scans ADD COLUMN IF NOT EXISTS consentimento_dado_em timestamptz;
ALTER TABLE skin_scans ADD COLUMN IF NOT EXISTS atualizado_em         timestamptz;

-- ─── scan_cv_results ─────────────────────────────────────────────────────────
-- Armazena o SkinFeatureVector completo como JSONB + métrica de duração

CREATE TABLE IF NOT EXISTS scan_cv_results (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_scan_id     uuid        NOT NULL REFERENCES skin_scans(id) ON DELETE CASCADE,
  feature_vector   jsonb       NOT NULL DEFAULT '{}',
  face_detectada   boolean     NOT NULL DEFAULT false,
  duracao_cv_ms    int,
  modelo_versao    varchar(30),
  UNIQUE(skin_scan_id)
);

ALTER TABLE scan_cv_results ADD COLUMN IF NOT EXISTS feature_vector   jsonb       DEFAULT '{}';
ALTER TABLE scan_cv_results ADD COLUMN IF NOT EXISTS face_detectada   boolean     DEFAULT false;
ALTER TABLE scan_cv_results ADD COLUMN IF NOT EXISTS duracao_cv_ms    int;
ALTER TABLE scan_cv_results ADD COLUMN IF NOT EXISTS modelo_versao    varchar(30);

-- ─── scan_skin_profiles ──────────────────────────────────────────────────────
-- SkinProfile completo como JSONB + narrativa Claude

CREATE TABLE IF NOT EXISTS scan_skin_profiles (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_scan_id     uuid    NOT NULL REFERENCES skin_scans(id) ON DELETE CASCADE,
  skin_profile     jsonb   NOT NULL DEFAULT '{}',
  perfil_resumo    text,
  UNIQUE(skin_scan_id)
);

ALTER TABLE scan_skin_profiles ADD COLUMN IF NOT EXISTS skin_profile  jsonb  DEFAULT '{}';
ALTER TABLE scan_skin_profiles ADD COLUMN IF NOT EXISTS perfil_resumo text;

-- ─── scan_rotinas ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_rotinas (
  id               uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_scan_id     uuid       NOT NULL REFERENCES skin_scans(id) ON DELETE CASCADE,
  periodo          varchar(6) NOT NULL CHECK (periodo IN ('manha','noite')),
  rotina           jsonb      NOT NULL DEFAULT '{}',
  UNIQUE(skin_scan_id, periodo)
);

ALTER TABLE scan_rotinas ADD COLUMN IF NOT EXISTS rotina jsonb DEFAULT '{}';

-- ─── scan_eventos ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_eventos (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_scan_id uuid    NOT NULL REFERENCES skin_scans(id) ON DELETE CASCADE,
  etapa        varchar(40) NOT NULL,
  duracao_ms   int,
  metadata     jsonb   DEFAULT '{}',
  criado_em    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scan_eventos ADD COLUMN IF NOT EXISTS duracao_ms int;
ALTER TABLE scan_eventos ADD COLUMN IF NOT EXISTS metadata   jsonb DEFAULT '{}';

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_scans_user      ON skin_scans(user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_scans_session   ON skin_scans(session_bp, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_scans_status    ON skin_scans(status) WHERE status NOT IN ('CONCLUIDO','ERRO');
CREATE INDEX IF NOT EXISTS idx_scans_skin_id   ON skin_scans(skin_id) WHERE skin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scans_hash      ON skin_scans(imagem_hash, criado_em DESC) WHERE imagem_hash IS NOT NULL;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE skin_scans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_cv_results    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_skin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_rotinas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_eventos       ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY scans_proprio ON skin_scans FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR session_bp = current_setting('app.session_id', true));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY scans_anonimo ON skin_scans FOR SELECT TO anon
    USING (session_bp = current_setting('app.session_id', true));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY scans_service ON skin_scans FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY profile_service ON scan_skin_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY rotina_proprio ON scan_rotinas FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM skin_scans s WHERE s.id = skin_scan_id AND s.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY rotina_service ON scan_rotinas FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY cv_service ON scan_cv_results FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY eventos_service ON scan_eventos FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMIT;
