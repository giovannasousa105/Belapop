-- ============================================================
-- BelaPop · Skin Digital Twin Schema (idempotente)
-- Migration: 20260516_0500_digital_twin_schema
-- Depende de: 20260516_0400_skin_scan_schema.sql (skin_scans)
-- ============================================================
--
-- INVARIANTE: score menor = condição melhorada = pele melhor
--   delta_global NEGATIVO = melhora geral
--   scores_baseline é IMUTÁVEL após criação — nunca atualizar
-- ============================================================

BEGIN;

-- ─── ENUMs ───────────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE twin_status AS ENUM (
  'SEM_DADOS',   -- twin criado, nenhum snapshot ainda
  'ATIVO',       -- pelo menos 1 snapshot, dentro do intervalo
  'PAUSADO'      -- mais de 120 dias sem novo scan
); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE trend_status AS ENUM (
  'MELHORANDO', 'ESTAVEL', 'PIORANDO', 'INSUFICIENTE'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE insight_tipo AS ENUM (
  'PRIMEIRO_SCAN',
  'PROGRESSO_POSITIVO',
  'ESTAVEL',
  'REGRESSAO_DETECTADA',
  'MARCO_ALCANCADO',
  'AJUSTE_ROTINA',
  'RETORNO_APOS_PAUSA'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE skin_marker AS ENUM (
  'acne', 'poros', 'textura', 'oleosidade',
  'pigmentacao', 'vermelhidao', 'ressecamento'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── skin_twins ───────────────────────────────────────────────────────────────
-- Um twin por usuário. scores_baseline é IMUTÁVEL — definido no primeiro scan.

CREATE TABLE IF NOT EXISTS skin_twins (
  id                         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_scans                int           NOT NULL DEFAULT 0,
  scores_baseline            jsonb         NOT NULL DEFAULT '{}',
  -- ^ IMUTÁVEL após o primeiro scan — nunca fazer UPDATE neste campo
  tipo_pele_atual            tipo_pele_enum,
  nivel_sensibilidade_atual  int           CHECK (nivel_sensibilidade_atual BETWEEN 1 AND 5),
  copilot_seed               jsonb,
  status                     twin_status   NOT NULL DEFAULT 'SEM_DADOS',
  primeiro_scan_em           timestamptz,
  ultimo_scan_em             timestamptz,
  criado_em                  timestamptz   NOT NULL DEFAULT now(),
  atualizado_em              timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ─── twin_snapshots ───────────────────────────────────────────────────────────
-- Um snapshot por scan concluído. Mantém a série histórica de scores.

CREATE TABLE IF NOT EXISTS twin_snapshots (
  id                    uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id               uuid           NOT NULL REFERENCES skin_twins(id) ON DELETE CASCADE,
  scan_id               uuid           NOT NULL REFERENCES skin_scans(id) ON DELETE CASCADE,
  scores_normalizados   jsonb          NOT NULL DEFAULT '{}',
  tipo_pele             tipo_pele_enum NOT NULL,
  nivel_sensibilidade   int            NOT NULL CHECK (nivel_sensibilidade BETWEEN 1 AND 5),
  focos_selecionados    text[]         NOT NULL DEFAULT '{}',
  numero_sequencia      int            NOT NULL,  -- 1, 2, 3, … dentro do twin
  criado_em             timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (twin_id, scan_id),
  UNIQUE (twin_id, numero_sequencia)
);

-- ─── twin_deltas ──────────────────────────────────────────────────────────────
-- Delta calculado entre dois snapshots consecutivos.
-- delta_global NEGATIVO = melhora geral (score menor = melhor).

CREATE TABLE IF NOT EXISTS twin_deltas (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id               uuid        NOT NULL REFERENCES skin_twins(id) ON DELETE CASCADE,
  snapshot_anterior_id  uuid        NOT NULL REFERENCES twin_snapshots(id) ON DELETE CASCADE,
  snapshot_atual_id     uuid        NOT NULL REFERENCES twin_snapshots(id) ON DELETE CASCADE,
  deltas_por_marcador   jsonb       NOT NULL DEFAULT '{}',
  delta_global          numeric(6,2) NOT NULL,
  -- ^ NEGATIVO = melhora, POSITIVO = piora
  melhora_percentual    numeric(5,1) NOT NULL DEFAULT 0,
  -- ^ Percentual de marcadores que melhoraram (0–100)
  criado_em             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_anterior_id, snapshot_atual_id)
);

-- ─── twin_trends ──────────────────────────────────────────────────────────────
-- Tendência de cada marcador na janela deslizante (3–5 snapshots).
-- Upsert por (twin_id, marcador) — mantém sempre o estado mais recente.

CREATE TABLE IF NOT EXISTS twin_trends (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id              uuid          NOT NULL REFERENCES skin_twins(id) ON DELETE CASCADE,
  snapshot_id          uuid          NOT NULL REFERENCES twin_snapshots(id) ON DELETE CASCADE,
  marcador             skin_marker   NOT NULL,
  status               trend_status  NOT NULL DEFAULT 'INSUFICIENTE',
  slope                numeric(8,4)  NOT NULL DEFAULT 0,
  velocidade_por_semana numeric(6,2) NOT NULL DEFAULT 0,
  snapshots_usados     int           NOT NULL DEFAULT 0,
  confianca            varchar(10)   NOT NULL DEFAULT 'BAIXA',
  calculado_em         timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (twin_id, marcador)
);

-- ─── twin_insights ────────────────────────────────────────────────────────────
-- Insights gerados (por template ou pelo Claude). Um por scan + tipo.

CREATE TABLE IF NOT EXISTS twin_insights (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id               uuid         NOT NULL REFERENCES skin_twins(id) ON DELETE CASCADE,
  snapshot_id           uuid         REFERENCES twin_snapshots(id) ON DELETE SET NULL,
  tipo                  insight_tipo NOT NULL,
  conteudo              text         NOT NULL,
  alerta_ativo          boolean      NOT NULL DEFAULT false,
  rotina_precisa_revisao boolean     NOT NULL DEFAULT false,
  criado_em             timestamptz  NOT NULL DEFAULT now()
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_twin_user       ON skin_twins(user_id);
CREATE INDEX IF NOT EXISTS idx_twin_status     ON skin_twins(status) WHERE status <> 'SEM_DADOS';
CREATE INDEX IF NOT EXISTS idx_snapshots_twin  ON twin_snapshots(twin_id, numero_sequencia DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_scan  ON twin_snapshots(scan_id);
CREATE INDEX IF NOT EXISTS idx_deltas_twin     ON twin_deltas(twin_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_trends_twin     ON twin_trends(twin_id);
CREATE INDEX IF NOT EXISTS idx_insights_twin   ON twin_insights(twin_id, criado_em DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE skin_twins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_deltas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_trends    ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_insights  ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas seu próprio twin
DO $$ BEGIN
  CREATE POLICY twin_proprio ON skin_twins FOR SELECT TO authenticated
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY twin_service ON skin_twins FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Snapshots e derivados: leitura via JOIN com skin_twins
DO $$ BEGIN
  CREATE POLICY snapshot_proprio ON twin_snapshots FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM skin_twins t WHERE t.id = twin_id AND t.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY snapshot_service ON twin_snapshots FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY delta_proprio ON twin_deltas FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM skin_twins t WHERE t.id = twin_id AND t.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY delta_service ON twin_deltas FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY trend_proprio ON twin_trends FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM skin_twins t WHERE t.id = twin_id AND t.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY trend_service ON twin_trends FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY insight_proprio ON twin_insights FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM skin_twins t WHERE t.id = twin_id AND t.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY insight_service ON twin_insights FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Comentários para documentação ───────────────────────────────────────────

COMMENT ON COLUMN skin_twins.scores_baseline IS
  'IMUTÁVEL após criação. Definido no primeiro scan. Nunca atualizar.';

COMMENT ON COLUMN twin_deltas.delta_global IS
  'NEGATIVO = melhora geral (score menor = pele melhor). POSITIVO = piora.';

COMMIT;
