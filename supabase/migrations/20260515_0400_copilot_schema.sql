-- ─── Skin Copilot: schema completo ───────────────────────────────────────────

-- ENUMs
DO $$ BEGIN
  CREATE TYPE interacao_tipo AS ENUM (
    'LEMBRETE_MANHA', 'LEMBRETE_NOITE',
    'CHECKIN_SEMANAL', 'NUDGE_RECOMPRA',
    'ALERTA_REGRESSAO', 'LEMBRETE_SCAN',
    'MARCO_ALCANCADO', 'BOAS_VINDAS'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE canal_enum AS ENUM ('push', 'email', 'in_app');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE interacao_status AS ENUM ('ENVIADA','ENTREGUE','LIDA','RESPONDIDA','FALHOU');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE resposta_tipo AS ENUM (
    'CHECKIN_ROTINA',
    'NOTA_PELE',
    'RECOMPRA_ACEITA',
    'RECOMPRA_RECUSADA',
    'SCAN_AGENDADO',
    'DESCARTADA'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Configuração do copilot por usuária ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS copilot_configs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  twin_id         uuid,          -- sem FK: skin_twins pode não existir ainda
  ativo           boolean        DEFAULT true,
  horario_manha   time           DEFAULT '07:30',
  horario_noite   time           DEFAULT '21:00',
  timezone        varchar(60)    DEFAULT 'America/Sao_Paulo',
  canal_preferido canal_enum     DEFAULT 'in_app',
  aceita_push     boolean        DEFAULT false,
  aceita_email    boolean        DEFAULT true,
  criado_em       timestamptz    DEFAULT now(),
  atualizado_em   timestamptz    DEFAULT now()
);

-- ─── Interações disparadas pelo copilot ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS copilot_interacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  twin_id       uuid,
  tipo          interacao_tipo NOT NULL,
  canal         canal_enum     NOT NULL,
  status        interacao_status DEFAULT 'ENVIADA',
  mensagem_id   varchar(128),
  payload       jsonb,
  seed_snapshot jsonb,
  respondida_em timestamptz,
  criado_em     timestamptz  DEFAULT now()
);

-- ─── Respostas das usuárias ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS copilot_respostas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interacao_id  uuid         NOT NULL REFERENCES copilot_interacoes(id) ON DELETE CASCADE,
  user_id       uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_resposta resposta_tipo NOT NULL,
  valor         jsonb,
  processada    boolean      DEFAULT false,
  criado_em     timestamptz  DEFAULT now()
);

-- ─── Série temporal de autorrelato de qualidade de pele ──────────────────────

CREATE TABLE IF NOT EXISTS copilot_notas_pele (
  id        uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota      smallint NOT NULL CHECK (nota BETWEEN 1 AND 5),
  criado_em timestamptz DEFAULT now()
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_copilot_interacoes_user_tipo_created
  ON copilot_interacoes(user_id, tipo, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_copilot_interacoes_user_status
  ON copilot_interacoes(user_id, status)
  WHERE status IN ('ENVIADA', 'ENTREGUE');

CREATE INDEX IF NOT EXISTS idx_copilot_respostas_nao_processadas
  ON copilot_respostas(processada, criado_em)
  WHERE processada = false;

CREATE INDEX IF NOT EXISTS idx_copilot_configs_ativo
  ON copilot_configs(ativo)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_copilot_notas_pele_user_created
  ON copilot_notas_pele(user_id, criado_em DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE copilot_configs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_interacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_respostas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_notas_pele  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_config" ON copilot_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_owns_interacao" ON copilot_interacoes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_owns_resposta" ON copilot_respostas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_owns_nota" ON copilot_notas_pele
  FOR ALL USING (auth.uid() = user_id);

-- ─── Trigger: atualizado_em automático ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_copilot_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS copilot_configs_atualizado_em ON copilot_configs;
CREATE TRIGGER copilot_configs_atualizado_em
  BEFORE UPDATE ON copilot_configs
  FOR EACH ROW EXECUTE FUNCTION update_copilot_atualizado_em();
