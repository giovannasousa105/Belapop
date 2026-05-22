-- ============================================================
-- BelaPop · CRM Schema (idempotente)
-- Migration: 20260516_0300_crm_schema
-- Complementa 20260516_0200_crm_schema.sql
-- Usa IF NOT EXISTS / EXCEPTION em todos os objetos
-- ============================================================

BEGIN;

-- ENUMs (idempotente)
DO $$ BEGIN CREATE TYPE fluxo_enum AS ENUM (
  'PEDIDO_CONFIRMADO', 'SCAN_RESULTADO',
  'POPCLUB_BOAS_VINDAS', 'POPCLUB_PROMOCAO_TIER',
  'CARRINHO_ABANDONADO_1H', 'CARRINHO_ABANDONADO_24H',
  'WISHLIST_ESGOTANDO', 'TIER_RISCO_REBAIXAMENTO',
  'REATIVACAO_30D', 'REATIVACAO_60D',
  'CHECKIN_SEMANAL', 'PROGRESSO_TWIN_MENSAL',
  'ALERTA_REGRESSAO', 'LEMBRETE_SCAN',
  'CURADORIA_SEMANAL', 'WAITLIST_PRODUTO',
  'LOTE_ESGOTANDO', 'RECOMPRA_ASSISTIDA'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE grupo_enum AS ENUM ('TRANSACIONAL','LIFECYCLE','PELE','EDITORIAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE envio_status AS ENUM (
  'ENFILEIRADO','ENVIADO','ENTREGUE','ABERTO','CLICADO','BOUNCE','FALHOU'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN CREATE TYPE supressao_motivo AS ENUM (
  'UNSUBSCRIBE','BOUNCE_HARD','BOUNCE_SOFT_LIMITE','SPAM_REPORT','ADMIN','PREFERENCIA'
); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tabelas
CREATE TABLE IF NOT EXISTS crm_envios (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  email           varchar(255) NOT NULL,
  fluxo           fluxo_enum   NOT NULL,
  grupo           grupo_enum   NOT NULL,
  status          envio_status DEFAULT 'ENFILEIRADO',
  provider_id     varchar(255),
  template_id     varchar(60),
  subject         text,
  metadata        jsonb        DEFAULT '{}',
  agendado_para   timestamptz,
  enviado_em      timestamptz,
  aberto_em       timestamptz,
  clicado_em      timestamptz,
  erro            text,
  tentativas      int          DEFAULT 0,
  criado_em       timestamptz  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_supressoes (
  id        uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  email     varchar(255)     NOT NULL,
  user_id   uuid,
  motivo    supressao_motivo NOT NULL,
  fluxo     fluxo_enum,
  ativo     boolean          DEFAULT true,
  criado_em timestamptz      DEFAULT now(),
  UNIQUE (email, motivo, COALESCE(fluxo::text, ''))
);

CREATE TABLE IF NOT EXISTS crm_preferencias (
  user_id             uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  aceita_transacional boolean DEFAULT true,
  aceita_lifecycle    boolean DEFAULT true,
  aceita_pele         boolean DEFAULT true,
  aceita_editorial    boolean DEFAULT true,
  horario_inicio      time    DEFAULT '08:00',
  horario_fim         time    DEFAULT '21:00',
  timezone            varchar(60) DEFAULT 'America/Sao_Paulo',
  atualizado_em       timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_envios_user_fluxo
  ON crm_envios(user_id, fluxo, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_supressoes_email
  ON crm_supressoes(email, ativo)
  WHERE ativo = true;

-- RLS
ALTER TABLE crm_envios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_supressoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_preferencias ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY crm_service ON crm_envios     FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY sup_service ON crm_supressoes FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY pref_proprio ON crm_preferencias FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY pref_service ON crm_preferencias FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMIT;
