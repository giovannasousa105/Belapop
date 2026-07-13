-- Histórico longitudinal do usuário e dataset coletivo pseudoanonimizado
--
-- Separação intencional por dois propósitos legais distintos:
--   scan_history       — execução de contrato / interesse legítimo (Skin Digital Twin)
--                        vinculado a user_id; deletável a pedido (art. 18 LGPD)
--   scan_contributions — aprimoramento coletivo do modelo (consent_data_sharing)
--                        sem user_id direto; pseudonym_id = SHA-256(salt || user_id)
--                        matematicamente irreversível sem o salt interno do servidor

-- ─── scan_history ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_history (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_vector jsonb       NOT NULL,  -- UploadableFeatures (whitelist — sem imagem)
  model_version  text        NOT NULL,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_user
  ON scan_history (user_id, created_at DESC);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Usuário lê o próprio histórico
CREATE POLICY history_own_read ON scan_history
  FOR SELECT USING (auth.uid() = user_id);

-- Escrita apenas via service_role (backend valida consentimento antes de inserir)
CREATE POLICY history_service_all ON scan_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE scan_history IS
  'Histórico longitudinal de leituras de pele por usuário (Skin Digital Twin). '
  'Vinculado a user_id — deletável via DELETE /api/scan/data (art. 18 LGPD). '
  'feature_vector contém apenas UploadableFeatures: índices derivados, sem imagem ou landmarks. '
  'Escrita exclusiva via service_role após validação de consent_scan.';

-- ─── scan_contributions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_contributions (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  pseudonym_id   text        NOT NULL,  -- SHA-256(CONTRIBUTION_SALT || user_id)
  feature_vector jsonb       NOT NULL,  -- UploadableFeatures
  model_version  text        NOT NULL,
  created_at     timestamptz DEFAULT now()
);

-- Índice por pseudônimo (análise longitudinal de tendências do modelo — sem user_id)
CREATE INDEX IF NOT EXISTS idx_scan_contributions_pseudonym
  ON scan_contributions (pseudonym_id, created_at DESC);

ALTER TABLE scan_contributions ENABLE ROW LEVEL SECURITY;

-- NENHUMA política de leitura ou escrita client-side: tabela opaca para clientes
-- Service role: escrita (backend após consent_data_sharing) e leitura (pipeline de treino)
CREATE POLICY contributions_service_all ON scan_contributions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE scan_contributions IS
  'Dataset coletivo pseudoanonimizado para aprimoramento do modelo. '
  'pseudonym_id = SHA-256(CONTRIBUTION_SALT || user_id): '
  'sem o salt interno do servidor não é possível reidentificar o titular. '
  'SEM coluna user_id: contribuições passadas não são removíveis mesmo a pedido (by design). '
  'Nenhuma política de leitura para clientes — tabela opaca ao usuário final. '
  'Requer consent_data_sharing ativo para inserção; validado pelo backend antes de cada escrita.';
