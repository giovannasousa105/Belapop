-- Consentimentos granulares LGPD para o Skin Scan
-- Base legal: art. 11 LGPD (dado biométrico / dado pessoal sensível)
--
-- Dois consentimentos separados e versionados:
--   consent_scan         — obrigatório para usar o recurso
--   consent_data_sharing — opcional; autoriza contribuição ao dataset coletivo anonimizado
--
-- A versão da política (policy_version) permite invalidar consentimentos antigos
-- ao atualizar os termos sem precisar forçar novo cadastro.

CREATE TABLE IF NOT EXISTS scan_consents (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type   text        NOT NULL CHECK (consent_type IN ('consent_scan', 'consent_data_sharing')),
  granted        boolean     NOT NULL,
  policy_version text        NOT NULL,
  granted_at     timestamptz NOT NULL DEFAULT now(),
  revoked_at     timestamptz
);

-- Apenas um consentimento ativo por (user, tipo) — revoked_at NULL = ativo
CREATE UNIQUE INDEX IF NOT EXISTS uq_scan_consents_active
  ON scan_consents (user_id, consent_type)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scan_consents_user
  ON scan_consents (user_id, granted_at DESC);

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE scan_consents ENABLE ROW LEVEL SECURITY;

-- Usuário lê apenas os próprios consentimentos
CREATE POLICY consents_own_read ON scan_consents
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT só com o próprio user_id (backend usa service_role, não precisa desta política)
CREATE POLICY consents_own_insert ON scan_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE apenas os próprios (para revogar via client, se necessário)
CREATE POLICY consents_own_update ON scan_consents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role: acesso total para validação no backend antes de gravar contribuições
CREATE POLICY consents_service_all ON scan_consents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE scan_consents IS
  'Consentimentos LGPD versionados para o Skin Scan. '
  'consent_scan: necessário para uso do recurso (art. 11 LGPD, dado biométrico). '
  'consent_data_sharing: opcional — contribuição ao dataset coletivo pseudoanonimizado. '
  'Contribuições passadas em scan_contributions não podem ser desvinculadas após revogação '
  '(pseudonym_id é hash irreversível sem user_id) — esta limitação é comunicada antes do consentimento.';
