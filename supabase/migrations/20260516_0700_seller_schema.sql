-- ─── Seller schema — cadastro, documentos e curadoria ─────────────────────────
-- Additive e idempotente: não quebra o seller infrastructure existente.
--
-- O que adiciona:
--   · ENUMs de domínio (seller_status, doc_tipo, doc_status, produto_pendente_status)
--   · Colunas BR no sellers existente (razao_social, cnpj, etapa, Stripe flags, etc.)
--   · Tabelas: seller_documentos, seller_produtos_pendentes, seller_repasses, tarefas_admin
--   · Índices, RLS e trigger atualizado_em

-- ─── ENUMs ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE seller_status AS ENUM (
    'RASCUNHO',        -- cadastro iniciado, não enviado
    'AGUARDANDO_DOCS', -- dados enviados, aguardando documentos
    'EM_VERIFICACAO',  -- documentos recebidos, em análise
    'APROVADO_PARCIAL',-- dados ok, aguardando Stripe Connect
    'ATIVO',           -- 100% operacional — pode publicar lotes
    'SUSPENSO',        -- ativo suspenso manualmente
    'REPROVADO'        -- documentação ou curadoria reprovada
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE doc_tipo AS ENUM (
    'CNPJ', 'CONTRATO_SOCIAL', 'COMPROVANTE_ENDERECO',
    'RG_CPF_RESPONSAVEL', 'PROCURACAO', 'OUTRO'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM (
    'PENDENTE', 'APROVADO', 'REPROVADO', 'EXPIRADO'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE produto_pendente_status AS ENUM (
    'AGUARDANDO_CURADORIA', 'APROVADO', 'REPROVADO', 'AJUSTE_SOLICITADO'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Colunas adicionais em sellers ────────────────────────────────────────────
-- Usa ADD COLUMN IF NOT EXISTS — não toca em colunas existentes.

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS razao_social         varchar(255);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS nome_fantasia         varchar(255);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS cnpj                  varchar(18);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_comercial       varchar(255);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS telefone              varchar(20);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS site_url              varchar(500);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS instagram_url         varchar(500);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS descricao_marca       text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS etapa_atual           int         NOT NULL DEFAULT 1;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS stripe_account_id     varchar(128);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS stripe_onboarding_url varchar(500);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean     DEFAULT false;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean     DEFAULT false;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS taxa_plataforma_pct   numeric(5,2) DEFAULT 15.00;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS sla_entrega_dias      int          DEFAULT 5;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS notas_internas        text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS reprovado_motivo      text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS atualizado_em         timestamptz  DEFAULT now();

-- ─── seller_documentos ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seller_documentos (
  id           uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    uuid       NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  tipo         doc_tipo   NOT NULL,
  status       doc_status NOT NULL DEFAULT 'PENDENTE',
  arquivo_url  varchar(500) NOT NULL,
  arquivo_nome varchar(255),
  arquivo_size int,
  validade     date,
  notas_admin  text,
  enviado_em   timestamptz NOT NULL DEFAULT now(),
  revisado_em  timestamptz,
  revisado_por uuid        REFERENCES auth.users(id)
);

-- ─── seller_enderecos ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seller_enderecos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid NOT NULL UNIQUE REFERENCES sellers(id) ON DELETE CASCADE,
  cep         varchar(9),
  logradouro  varchar(255),
  numero      varchar(20),
  complemento varchar(100),
  bairro      varchar(100),
  cidade      varchar(100),
  estado      varchar(2),
  pais        varchar(2)  DEFAULT 'BR',
  criado_em   timestamptz DEFAULT now()
);

-- ─── seller_produtos_pendentes ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seller_produtos_pendentes (
  id                uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         uuid                    NOT NULL REFERENCES sellers(id),
  produto_id        uuid,                   -- nullable: pode não ter produto real ainda
  nome_proposto     varchar(255)            NOT NULL,
  descricao         text,
  imagens_urls      text[]                  DEFAULT '{}',
  preco_centavos    int,
  categoria         varchar(100),
  ativos_principais text[]                  DEFAULT '{}',
  status            produto_pendente_status NOT NULL DEFAULT 'AGUARDANDO_CURADORIA',
  score_curadoria   int,
  notas_curadoria   text,
  ajuste_solicitado text,
  enviado_em        timestamptz             NOT NULL DEFAULT now(),
  revisado_em       timestamptz,
  revisado_por      uuid                    REFERENCES auth.users(id)
);

-- ─── seller_repasses ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seller_repasses (
  id                   uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id            uuid    NOT NULL REFERENCES sellers(id),
  pedido_id            uuid,   -- FK para orders/pedidos — evita FK quebrada se tabela tem nome diferente
  valor_bruto_cents    int     NOT NULL,
  taxa_belapop_pct     numeric(5,2) NOT NULL,
  valor_taxa_cents     int     NOT NULL,
  valor_liquido_cents  int     NOT NULL,
  stripe_transfer_id   varchar(128),
  status               varchar(20) NOT NULL DEFAULT 'PENDENTE',
  criado_em            timestamptz NOT NULL DEFAULT now(),
  transferido_em       timestamptz
);

-- ─── tarefas_admin ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tarefas_admin (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo             varchar(60) NOT NULL,
  referencia_id    uuid,
  referencia_tipo  varchar(40),
  descricao        text,
  status           varchar(20) NOT NULL DEFAULT 'PENDENTE',
  prioridade       int         NOT NULL DEFAULT 2,  -- 1=urgente, 2=normal, 3=baixa
  atribuido_a      uuid        REFERENCES auth.users(id),
  criado_em        timestamptz NOT NULL DEFAULT now(),
  concluido_em     timestamptz
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_seller_docs_seller       ON seller_documentos(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_seller_pendentes_seller  ON seller_produtos_pendentes(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_seller_repasses_seller   ON seller_repasses(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_tarefas_status           ON tarefas_admin(status, prioridade)
  WHERE status = 'PENDENTE';

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE seller_documentos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_enderecos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_produtos_pendentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_repasses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas_admin             ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY docs_proprio ON seller_documentos
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY endereco_proprio ON seller_enderecos
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY pendentes_proprio ON seller_produtos_pendentes
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY repasses_proprio ON seller_repasses
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- service_role: acesso total para workers e admin
DO $$ BEGIN
  CREATE POLICY docs_service        ON seller_documentos         FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY pendentes_service   ON seller_produtos_pendentes FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY repasses_service    ON seller_repasses           FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE POLICY tarefas_service     ON tarefas_admin             FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Trigger: atualizado_em ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_seller_atualizado_em()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_sellers_atualizado_em ON sellers;
CREATE TRIGGER trg_sellers_atualizado_em
  BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION fn_set_seller_atualizado_em();

RAISE NOTICE '✓ Migration 20260516_0700_seller_schema aplicada';
