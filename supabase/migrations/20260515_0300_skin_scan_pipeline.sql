-- Pipeline de análise do Skin Scan BelaPop
-- Tabelas criadas nesta migração:
--   skin_scans       — registro central de cada scan
--   scan_cv_results  — saída bruta do serviço Python CV
--   scan_skin_profiles — perfil clínico calculado + narrativa Claude
--   scan_rotinas     — rotinas manhã e noite recomendadas
--   scan_eventos     — log de duração por etapa (SLA monitoring)

-- ── skin_scans ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skin_scans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_id             VARCHAR(20) UNIQUE,      -- 'BP-XXXXXX' gerado ao final
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_bp          VARCHAR(255),            -- anonymous session identifier
  status              TEXT NOT NULL DEFAULT 'AGUARDANDO',
  -- AGUARDANDO | PROCESSANDO_CV | SCORING | RECOMENDANDO | CONCLUIDO | ERRO
  focos               TEXT[] NOT NULL DEFAULT '{}',
  erro_mensagem       TEXT,
  duracao_ms          INT,
  imagem_deletada_em  TIMESTAMPTZ,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skin_scans_user_id ON skin_scans (user_id);
CREATE INDEX IF NOT EXISTS idx_skin_scans_status ON skin_scans (status);
CREATE INDEX IF NOT EXISTS idx_skin_scans_session_bp ON skin_scans (session_bp);

-- ── scan_cv_results ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_cv_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_scan_id    UUID NOT NULL REFERENCES skin_scans(id) ON DELETE CASCADE,
  feature_vector  JSONB NOT NULL,   -- SkinFeatureVector completo
  duracao_cv_ms   INT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_cv_results_scan_id
  ON scan_cv_results (skin_scan_id);

-- ── scan_skin_profiles ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_skin_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_scan_id     UUID NOT NULL REFERENCES skin_scans(id) ON DELETE CASCADE,
  skin_profile     JSONB NOT NULL,   -- SkinProfile completo
  perfil_resumo    TEXT,             -- narrativa gerada pelo Claude
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scan_skin_profiles_scan_id
  ON scan_skin_profiles (skin_scan_id);

-- ── scan_rotinas ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_rotinas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_scan_id    UUID NOT NULL REFERENCES skin_scans(id) ON DELETE CASCADE,
  periodo         TEXT NOT NULL CHECK (periodo IN ('manha', 'noite')),
  rotina          JSONB NOT NULL,   -- RotinaResult completo
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (skin_scan_id, periodo)
);

-- ── scan_eventos ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scan_eventos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_scan_id    UUID NOT NULL REFERENCES skin_scans(id) ON DELETE CASCADE,
  etapa           TEXT NOT NULL,    -- 'cv' | 'scoring' | 'recommendation' | 'narrativa'
  duracao_ms      INT,
  metadata        JSONB,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_eventos_scan_id
  ON scan_eventos (skin_scan_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Usuário autenticado vê apenas seus próprios scans.
-- Service role (worker) bypassa RLS.

ALTER TABLE skin_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_cv_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_skin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_rotinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprios_scans" ON skin_scans
  FOR SELECT USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND session_bp = current_setting('request.headers', true)::json->>'x-session-bp')
  );

CREATE POLICY "service_role_full_access_skin_scans"
  ON skin_scans FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "usuario_ve_proprios_cv_results" ON scan_cv_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM skin_scans s WHERE s.id = scan_cv_results.skin_scan_id AND s.user_id = auth.uid())
  );

CREATE POLICY "service_role_full_access_cv_results"
  ON scan_cv_results FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "usuario_ve_proprios_profiles" ON scan_skin_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM skin_scans s WHERE s.id = scan_skin_profiles.skin_scan_id AND s.user_id = auth.uid())
  );

CREATE POLICY "service_role_full_access_profiles"
  ON scan_skin_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "usuario_ve_proprias_rotinas" ON scan_rotinas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM skin_scans s WHERE s.id = scan_rotinas.skin_scan_id AND s.user_id = auth.uid())
  );

CREATE POLICY "service_role_full_access_rotinas"
  ON scan_rotinas FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access_eventos"
  ON scan_eventos FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── produtos — colunas de compatibilidade (se ainda não existirem) ───────────

ALTER TABLE products ADD COLUMN IF NOT EXISTS ativos_principais       TEXT[]  DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tipo_pele_indicado      TEXT[]  DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS nivel_sensibilidade_max INT     DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS passo_rotina            TEXT;   -- limpeza|toner|serum|hidratante|fps|tratamento|olhos
ALTER TABLE products ADD COLUMN IF NOT EXISTS periodo                 TEXT;   -- manha|noite|ambos
