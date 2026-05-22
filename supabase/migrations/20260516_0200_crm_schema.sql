-- ─── CRM: email delivery + suppression + preferences ────────────────────────

DO $$ BEGIN
  CREATE TYPE fluxo_enum AS ENUM (
    'PEDIDO_CONFIRMADO', 'SCAN_RESULTADO',
    'POPCLUB_BOAS_VINDAS', 'POPCLUB_PROMOCAO_TIER',
    'CARRINHO_ABANDONADO_1H', 'CARRINHO_ABANDONADO_24H',
    'WISHLIST_ESGOTANDO', 'TIER_RISCO_REBAIXAMENTO',
    'REATIVACAO_30D', 'REATIVACAO_60D',
    'CHECKIN_SEMANAL', 'PROGRESSO_TWIN_MENSAL',
    'ALERTA_REGRESSAO', 'LEMBRETE_SCAN',
    'CURADORIA_SEMANAL', 'WAITLIST_PRODUTO',
    'LOTE_ESGOTANDO', 'RECOMPRA_ASSISTIDA'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE grupo_enum AS ENUM ('TRANSACIONAL', 'LIFECYCLE', 'PELE', 'EDITORIAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE envio_status AS ENUM (
    'ENFILEIRADO', 'ENVIADO', 'ENTREGUE',
    'ABERTO', 'CLICADO', 'BOUNCE', 'FALHOU'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE supressao_motivo AS ENUM (
    'UNSUBSCRIBE', 'BOUNCE_HARD', 'BOUNCE_SOFT_LIMITE',
    'SPAM_REPORT', 'ADMIN', 'PREFERENCIA'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Envios ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_envios (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  email         varchar(255)  NOT NULL,
  fluxo         fluxo_enum    NOT NULL,
  grupo         grupo_enum    NOT NULL,
  status        envio_status  DEFAULT 'ENFILEIRADO',
  provider_id   varchar(255),
  template_id   varchar(60),
  subject       text,
  metadata      jsonb,
  agendado_para timestamptz,
  enviado_em    timestamptz,
  aberto_em     timestamptz,
  clicado_em    timestamptz,
  erro          text,
  tentativas    int           DEFAULT 0,
  criado_em     timestamptz   DEFAULT now()
);

-- ─── Supressões ───────────────────────────────────────────────────────────────

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

-- ─── Preferências ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_preferencias (
  user_id            uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  aceita_transacional boolean DEFAULT true,
  aceita_lifecycle    boolean DEFAULT true,
  aceita_pele         boolean DEFAULT true,
  aceita_editorial    boolean DEFAULT true,
  horario_inicio      time    DEFAULT '08:00',
  horario_fim         time    DEFAULT '21:00',
  timezone            varchar(60) DEFAULT 'America/Sao_Paulo',
  atualizado_em       timestamptz DEFAULT now()
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_envios_user_fluxo_criado
  ON crm_envios(user_id, fluxo, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_envios_agendado
  ON crm_envios(agendado_para)
  WHERE status = 'ENFILEIRADO' AND agendado_para IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supressoes_email
  ON crm_supressoes(email, ativo)
  WHERE ativo = true;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE crm_preferencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_owns_prefs" ON crm_preferencias FOR ALL USING (auth.uid() = user_id);
