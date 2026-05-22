-- ─── LGPD Schema — consentimentos e solicitações de titulares ────────────────
-- Additive e idempotente.
-- Imutável por design: lgpd_consentimentos NUNCA recebe UPDATE ou DELETE.
-- lgpd_solicitacoes: status evolui de PENDENTE → PROCESSADO via service_role.

-- ─── ENUMs ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE consentimento_tipo AS ENUM (
    'COOKIES_ANALYTICS',
    'COOKIES_MARKETING',
    'EMAIL_MARKETING',
    'BIOMETRICO_SCAN',          -- dado biométrico — art. 11 LGPD
    'COMPARTILHAMENTO_DADOS'    -- entre BelaPop e sellers
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE consentimento_acao AS ENUM (
    'CONCEDIDO', 'REVOGADO'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── lgpd_consentimentos ─────────────────────────────────────────────────────
-- Log imutável de consentimentos — auditoria LGPD.
-- Cada concessão/revogação = novo registro. NUNCA atualizar registros existentes.

CREATE TABLE IF NOT EXISTS lgpd_consentimentos (
  id          uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid               REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  varchar(128),                        -- para visitantes anônimos
  tipo        consentimento_tipo NOT NULL,
  acao        consentimento_acao NOT NULL,
  ip_hash     varchar(64),                         -- SHA-256 do IP — nunca o IP bruto
  user_agent  varchar(500),
  criado_em   timestamptz        NOT NULL DEFAULT now()
  -- Sem updated_at — este registro é imutável por design
);

CREATE INDEX IF NOT EXISTS idx_consentimentos_user
  ON lgpd_consentimentos(user_id, tipo, criado_em DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consentimentos_session
  ON lgpd_consentimentos(session_id, criado_em DESC)
  WHERE session_id IS NOT NULL;

-- ─── lgpd_solicitacoes ───────────────────────────────────────────────────────
-- Solicitações de direitos do titular (art. 18 LGPD).

CREATE TABLE IF NOT EXISTS lgpd_solicitacoes (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo           varchar(30)  NOT NULL
    CHECK (tipo IN ('EXCLUSAO', 'EXPORTACAO', 'CORRECAO', 'PORTABILIDADE')),
  status         varchar(20)  NOT NULL DEFAULT 'PENDENTE'
    CHECK (status IN ('PENDENTE', 'EM_PROCESSAMENTO', 'PROCESSADO', 'CANCELADO', 'ERRO')),
  motivo         text,
  processado_em  timestamptz,
  resposta       text,
  criado_em      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_pendentes
  ON lgpd_solicitacoes(status, criado_em)
  WHERE status = 'PENDENTE';

CREATE INDEX IF NOT EXISTS idx_solicitacoes_user
  ON lgpd_solicitacoes(user_id, criado_em DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE lgpd_consentimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_solicitacoes   ENABLE ROW LEVEL SECURITY;

-- Consentimentos: usuária lê os próprios; apenas service_role escreve
DO $$ BEGIN
  CREATE POLICY "consent_proprio_read" ON lgpd_consentimentos
    FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "consent_service" ON lgpd_consentimentos
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Solicitações: usuária lê e insere as próprias; service_role atualiza status
DO $$ BEGIN
  CREATE POLICY "solicit_proprio_read" ON lgpd_solicitacoes
    FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "solicit_proprio_insert" ON lgpd_solicitacoes
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "solicit_service" ON lgpd_solicitacoes
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
