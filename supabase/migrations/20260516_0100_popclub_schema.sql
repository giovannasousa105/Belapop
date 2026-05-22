-- ─── PopClub: membership system completo ─────────────────────────────────────

-- ENUMs
DO $$ BEGIN
  CREATE TYPE tier_enum AS ENUM ('ESSENCIAL', 'PREMIUM', 'LUXO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE transacao_tipo AS ENUM (
    'COMPRA', 'SCAN', 'CHECKIN', 'INDICACAO',
    'STREAK_BONUS', 'EXPIRACAO', 'RESGATE_CREDITO',
    'AJUSTE_ADMIN', 'ENTRADA_CLUBE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE credito_status AS ENUM ('DISPONIVEL', 'APLICADO', 'EXPIRADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Membros ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS popclub_membros (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_atual            tier_enum   DEFAULT 'ESSENCIAL',
  tier_anterior         tier_enum,
  pontos_disponiveis    int         DEFAULT 0 CHECK (pontos_disponiveis >= 0),
  pontos_acumulados_12m int         DEFAULT 0 CHECK (pontos_acumulados_12m >= 0),
  creditos_disponiveis  numeric(10,2) DEFAULT 0,
  data_entrada          date        DEFAULT CURRENT_DATE,
  data_avaliacao_tier   date,
  data_rebaixamento_aviso date,
  ativo                 boolean     DEFAULT true,
  criado_em             timestamptz DEFAULT now(),
  atualizado_em         timestamptz DEFAULT now()
);

-- ─── Transações de pontos ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS popclub_transacoes (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id       uuid         NOT NULL REFERENCES popclub_membros(id) ON DELETE CASCADE,
  user_id         uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            transacao_tipo NOT NULL,
  pontos          int          NOT NULL,
  saldo_apos      int          NOT NULL,
  referencia_id   uuid,
  referencia_tipo varchar(40),
  descricao       text,
  expira_em       date,
  criado_em       timestamptz  DEFAULT now()
);

-- ─── Créditos BRL ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS popclub_creditos (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id         uuid         NOT NULL REFERENCES popclub_membros(id) ON DELETE CASCADE,
  valor_brl         numeric(10,2) NOT NULL CHECK (valor_brl > 0),
  pontos_utilizados int          NOT NULL CHECK (pontos_utilizados > 0),
  stripe_coupon_id  varchar(128),
  status            credito_status DEFAULT 'DISPONIVEL',
  pedido_id         uuid,
  expira_em         date         NOT NULL,
  criado_em         timestamptz  DEFAULT now()
);

-- ─── Acessos antecipados ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS popclub_acessos_antecipados (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id    uuid        NOT NULL REFERENCES popclub_membros(id) ON DELETE CASCADE,
  lote_id      uuid        NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  tier_na_data tier_enum   NOT NULL,
  abertura_em  timestamptz NOT NULL,
  acessou_em   timestamptz,
  criado_em    timestamptz DEFAULT now(),
  UNIQUE (membro_id, lote_id)
);

-- ─── Índices críticos ─────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_transacoes_membro_criado
  ON popclub_transacoes(membro_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_transacoes_expiracao
  ON popclub_transacoes(expira_em)
  WHERE expira_em IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_acessos_lote_abertura
  ON popclub_acessos_antecipados(lote_id, abertura_em);

CREATE INDEX IF NOT EXISTS idx_membros_avaliacao
  ON popclub_membros(data_avaliacao_tier)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_membros_rebaixamento_aviso
  ON popclub_membros(data_rebaixamento_aviso)
  WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_creditos_expirando
  ON popclub_creditos(expira_em, status)
  WHERE status = 'DISPONIVEL';

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE popclub_membros              ENABLE ROW LEVEL SECURITY;
ALTER TABLE popclub_transacoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE popclub_creditos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE popclub_acessos_antecipados  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sees_own_membro" ON popclub_membros
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_sees_own_transacao" ON popclub_transacoes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_sees_own_credito" ON popclub_creditos
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM popclub_membros WHERE id = membro_id
    )
  );

CREATE POLICY "user_sees_own_acesso" ON popclub_acessos_antecipados
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM popclub_membros WHERE id = membro_id
    )
  );

-- ─── Trigger: atualizado_em ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_popclub_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS popclub_membros_atualizado_em ON popclub_membros;
CREATE TRIGGER popclub_membros_atualizado_em
  BEFORE UPDATE ON popclub_membros
  FOR EACH ROW EXECUTE FUNCTION update_popclub_atualizado_em();
