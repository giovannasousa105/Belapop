-- ─── Admin schema — controle de acesso e auditoria ───────────────────────────
-- Additive e idempotente. Não toca no sistema de roles existente (user_roles).
--
-- O que adiciona:
--   · ENUM admin_role (níveis de acesso do painel)
--   · Tabela admin_users (admins com role explícito)
--   · Tabela admin_audit_log (trilha de auditoria de ações)
--   · Função fn_admin_pode (verificação de permissão por ação)
--   · Índices e RLS

-- ─── ENUM ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM (
    'SUPER_ADMIN',    -- acesso total, pode promover outros admins
    'CURADOR',        -- aprova sellers e produtos
    'OPERACIONAL',    -- gerencia lotes e pedidos
    'FINANCEIRO'      -- visualiza repasses, não altera dados
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── admin_users ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_users (
  id            uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid       UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          admin_role NOT NULL DEFAULT 'OPERACIONAL',
  nome          varchar(255),
  ativo         boolean    NOT NULL DEFAULT true,
  criado_por    uuid       REFERENCES admin_users(id),
  criado_em     timestamptz NOT NULL DEFAULT now(),
  ultimo_acesso timestamptz
);

-- ─── admin_audit_log ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      uuid    NOT NULL REFERENCES admin_users(id),
  acao          varchar(100) NOT NULL,
  tabela        varchar(60),
  referencia_id uuid,
  dados_antes   jsonb,
  dados_depois  jsonb,
  ip            varchar(45),
  criado_em     timestamptz NOT NULL DEFAULT now()
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_admin_user
  ON admin_users(user_id) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_audit_admin
  ON admin_audit_log(admin_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_referencia
  ON admin_audit_log(referencia_id);

-- ─── RLS — apenas service_role acessa, nunca client direto ───────────────────

ALTER TABLE admin_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY admin_service ON admin_users
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY audit_service ON admin_audit_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── fn_admin_pode ────────────────────────────────────────────────────────────
-- Verifica se um user_id tem permissão para a ação solicitada.
-- Usado pelo middleware e pelo requireAdmin em rotas individuais.

CREATE OR REPLACE FUNCTION fn_admin_pode(
  p_user_id uuid,
  p_acao    varchar
) RETURNS boolean
LANGUAGE plpgsql STABLE
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_role admin_role;
BEGIN
  SELECT role INTO v_role FROM admin_users
  WHERE user_id = p_user_id AND ativo = true;

  IF NOT FOUND THEN RETURN false; END IF;

  RETURN CASE p_acao
    WHEN 'VER_DASHBOARD'    THEN true
    WHEN 'GERENCIAR_LOTES'  THEN v_role IN ('SUPER_ADMIN', 'OPERACIONAL')
    WHEN 'APROVAR_SELLER'   THEN v_role IN ('SUPER_ADMIN', 'CURADOR')
    WHEN 'VER_FINANCEIRO'   THEN v_role IN ('SUPER_ADMIN', 'FINANCEIRO')
    WHEN 'GERENCIAR_ADMINS' THEN v_role = 'SUPER_ADMIN'
    ELSE false
  END;
END; $$;

RAISE NOTICE '✓ Migration 20260516_0800_admin_schema aplicada';
