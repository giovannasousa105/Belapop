-- ============================================================
-- BelaPop · Lote Curado
-- Migration: 20260516_0200_lote_curado
-- Supabase / PostgreSQL 15+
--
-- Ordem de criação:
--   1. ENUMs
--   2. Tabelas (lotes → lote_reservas → lote_lista_espera
--              → lote_eventos → stripe_eventos_processados)
--   3. Índices
--   4. RLS
--   5. Funções auxiliares (trigger de timestamp)
--   6. Comentários de domínio
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ENUMs
-- ============================================================

CREATE TYPE lote_status AS ENUM (
  'ABERTO',              -- qtd_disponivel > limiar_alerta
  'EM_ESGOTAMENTO',      -- qtd_disponivel <= limiar_alerta_pct% do total
  'ENCERRADO',           -- qtd_disponivel = 0
  'REPOSICAO_PREVISTA',  -- admin definiu data_reposicao
  'SUSPENSO'             -- ação manual do admin — não vende, não aparece
);

CREATE TYPE reserva_status AS ENUM (
  'ATIVA',       -- em carrinho, expira em expira_em
  'CONFIRMADA',  -- pagamento confirmado via webhook Stripe
  'EXPIRADA',    -- cron de 5min liberou
  'CANCELADA'    -- pagamento falhou ou usuária desistiu
);

CREATE TYPE evento_tipo AS ENUM (
  'VENDA',               -- compra confirmada
  'RESERVA',             -- item adicionado ao carrinho
  'LIBERACAO',           -- reserva expirada ou cancelada
  'TRANSICAO',           -- mudança de lote_status
  'REEMBOLSO',           -- charge.refund confirmado
  'REEMBOLSO_AUTOMATICO',-- lote esgotou durante checkout
  'NOTIFICACAO_ESPERA'   -- e-mails de waitlist disparados
);

-- ============================================================
-- 2. TABELAS
-- ============================================================

-- ----------------------------------------------------------
-- 2.1 lotes
-- Tabela principal do lote curado.
-- qtd_disponivel: decrementa na reserva, sobe na liberação.
-- qtd_reservada:  incrementa na reserva, decrementa na confirmação ou liberação.
-- INVARIANTE: qtd_disponivel + qtd_reservada <= qtd_total (sempre)
-- ----------------------------------------------------------

CREATE TABLE lotes (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id           uuid        NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  seller_id            uuid        NOT NULL REFERENCES sellers(id)  ON DELETE RESTRICT,
  sku_externo          varchar(120),                            -- referência interna do seller
  qtd_total            int         NOT NULL CHECK (qtd_total > 0),
  qtd_disponivel       int         NOT NULL CHECK (qtd_disponivel >= 0),
  qtd_reservada        int         NOT NULL DEFAULT 0 CHECK (qtd_reservada >= 0),
  limiar_alerta_pct    int         NOT NULL DEFAULT 20
                                   CHECK (limiar_alerta_pct BETWEEN 1 AND 99),
  status               lote_status NOT NULL DEFAULT 'ABERTO',
  abertura_geral_em    timestamptz,                            -- nulo = abriu imediatamente
  verificado_em        timestamptz,                            -- curadoria BelaPop concluída
  aberto_em            timestamptz DEFAULT now(),
  encerrado_em         timestamptz,
  data_reposicao       date,                                   -- nullable — só em REPOSICAO_PREVISTA
  notas_internas       text,                                   -- visível apenas no painel admin
  criado_em            timestamptz NOT NULL DEFAULT now(),
  atualizado_em        timestamptz NOT NULL DEFAULT now(),

  -- Garante que qtd_disponivel + qtd_reservada nunca excede qtd_total
  CONSTRAINT qtd_consistente
    CHECK (qtd_disponivel + qtd_reservada <= qtd_total),

  -- Encerrado_em só faz sentido quando status é ENCERRADO
  CONSTRAINT encerrado_em_coerente
    CHECK (
      (status = 'ENCERRADO'           AND encerrado_em IS NOT NULL)
      OR (status != 'ENCERRADO'       AND encerrado_em IS NULL)
    ),

  -- data_reposicao só faz sentido em REPOSICAO_PREVISTA
  CONSTRAINT reposicao_coerente
    CHECK (
      (status = 'REPOSICAO_PREVISTA'  AND data_reposicao IS NOT NULL)
      OR (status != 'REPOSICAO_PREVISTA')
    )
);

COMMENT ON TABLE  lotes                IS 'Lotes curados de produtos BelaPop com controle de estoque editorial';
COMMENT ON COLUMN lotes.qtd_total      IS 'Imutável após criação — quantidade verificada pelo time BelaPop';
COMMENT ON COLUMN lotes.qtd_disponivel IS 'SCORE MENOR NÃO SE APLICA AQUI — maior = mais estoque disponível';
COMMENT ON COLUMN lotes.qtd_reservada  IS 'Itens em carrinho com reserva ativa (expira em 15min)';
COMMENT ON COLUMN lotes.limiar_alerta_pct IS 'Percentual de qtd_total que dispara transição ABERTO → EM_ESGOTAMENTO';
COMMENT ON COLUMN lotes.abertura_geral_em IS 'Quando o lote abre para o público geral. Membros PopClub acessam antes.';

-- ----------------------------------------------------------
-- 2.2 lote_reservas
-- Reserva temporária criada ao adicionar ao carrinho.
-- TTL: 15 minutos (configurável via env RESERVA_TTL_MINUTOS).
-- O cron de expiração usa SELECT FOR UPDATE SKIP LOCKED.
-- ----------------------------------------------------------

CREATE TABLE lote_reservas (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id              uuid           NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT,
  session_id           varchar(128)   NOT NULL,                -- cookie de sessão anônima BelaPop
  user_id              uuid           REFERENCES users(id),   -- nullable — usuária não logada
  quantidade           int            NOT NULL CHECK (quantidade > 0),
  expira_em            timestamptz    NOT NULL,
  status               reserva_status NOT NULL DEFAULT 'ATIVA',
  pedido_id            uuid,                                   -- preenchido após confirmação
  payment_intent_id    varchar(128),                           -- pi_xxx do Stripe
  stripe_session_id    varchar(128),                           -- cs_xxx da Checkout Session
  criado_em            timestamptz    NOT NULL DEFAULT now(),

  -- Uma session só pode ter uma reserva ativa por lote
  CONSTRAINT reserva_ativa_unica
    UNIQUE (lote_id, session_id) DEFERRABLE INITIALLY DEFERRED
);

COMMENT ON TABLE  lote_reservas              IS 'Reservas temporárias de estoque — TTL 15min, liberadas pelo cron';
COMMENT ON COLUMN lote_reservas.session_id   IS 'Cookie bp_session — identifica usuária anônima ou logada';
COMMENT ON COLUMN lote_reservas.expira_em    IS 'now() + RESERVA_TTL_MINUTOS. Cron libera quando expira_em < now()';
COMMENT ON COLUMN lote_reservas.payment_intent_id IS 'Gravado após criar Checkout Session — webhook usa para localizar reserva';

-- ----------------------------------------------------------
-- 2.3 lote_lista_espera
-- Captura e-mails de interesse quando lote está ENCERRADO.
-- notificado_em: preenchido após envio do e-mail de reposição.
-- ----------------------------------------------------------

CREATE TABLE lote_lista_espera (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id              uuid        REFERENCES lotes(id),      -- nullable: pode ser para o produto geral
  produto_id           uuid        NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  email                varchar(255) NOT NULL,
  user_id              uuid        REFERENCES users(id),
  notificado_em        timestamptz,                           -- null = ainda não notificado
  origem               varchar(60) NOT NULL                   -- 'pdp','scan','cart','reembolso_automatico'
                       DEFAULT 'pdp',
  criado_em            timestamptz NOT NULL DEFAULT now(),

  -- Não duplicar por email + produto (ignora lote específico)
  CONSTRAINT espera_unica_por_produto
    UNIQUE (email, produto_id)
);

COMMENT ON TABLE  lote_lista_espera        IS 'Lista de espera para produtos esgotados — notificada ao reabrir lote';
COMMENT ON COLUMN lote_lista_espera.origem IS 'De onde veio o cadastro: pdp=página do produto, scan=resultado do Skin Scan, cart=carrinho abandonado';

-- ----------------------------------------------------------
-- 2.4 lote_eventos
-- Log imutável de todas as movimentações de estoque e estado.
-- Nunca atualizar — apenas INSERT.
-- delta_qtd: positivo = entrada de estoque, negativo = saída.
-- ----------------------------------------------------------

CREATE TABLE lote_eventos (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id              uuid        NOT NULL REFERENCES lotes(id) ON DELETE RESTRICT,
  tipo                 evento_tipo NOT NULL,
  status_anterior      lote_status,                           -- nullable: RESERVA e VENDA não mudam status
  status_novo          lote_status,
  delta_qtd            int         NOT NULL DEFAULT 0,        -- positivo=entrada, negativo=saída
  actor_id             uuid,                                  -- user_id ou null para 'system'
  actor_tipo           varchar(20) NOT NULL DEFAULT 'system', -- 'user','admin','system','webhook'
  metadata             jsonb       NOT NULL DEFAULT '{}',
  criado_em            timestamptz NOT NULL DEFAULT now()

  -- Sem UPDATE, sem DELETE — append-only
  -- Enforçado via RLS (ver seção 4)
);

COMMENT ON TABLE  lote_eventos          IS 'Log imutável de eventos do lote — append-only, nunca atualizar';
COMMENT ON COLUMN lote_eventos.delta_qtd IS 'Positivo=estoque entrou (liberação), Negativo=estoque saiu (venda/reserva)';
COMMENT ON COLUMN lote_eventos.actor_id  IS 'UUID do usuário ou admin. NULL quando actor_tipo = system ou webhook';

-- Idempotência para eventos de notificação (evitar disparar 2x no mesmo minuto)
CREATE UNIQUE INDEX idx_lote_eventos_notificacao_idempotente
  ON lote_eventos (lote_id, tipo, date_trunc('minute', criado_em))
  WHERE tipo = 'NOTIFICACAO_ESPERA';

-- ----------------------------------------------------------
-- 2.5 stripe_eventos_processados
-- Idempotência do webhook Stripe.
-- Impede processar o mesmo evento duas vezes (redeploy, timeout).
-- ----------------------------------------------------------

CREATE TABLE stripe_eventos_processados (
  stripe_event_id      varchar(255) PRIMARY KEY,              -- evt_xxx
  event_type           varchar(120) NOT NULL,
  processado_em        timestamptz  NOT NULL DEFAULT now(),
  resultado            jsonb        NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE stripe_eventos_processados IS 'Garante idempotência do webhook Stripe — mesmo evento nunca processado duas vezes';

-- ============================================================
-- 3. ÍNDICES
-- ============================================================

-- lotes
CREATE INDEX idx_lotes_produto_status
  ON lotes (produto_id, status);

CREATE INDEX idx_lotes_status_abertura
  ON lotes (status, abertura_geral_em)
  WHERE status IN ('ABERTO', 'EM_ESGOTAMENTO');

CREATE INDEX idx_lotes_seller
  ON lotes (seller_id);

CREATE INDEX idx_lotes_atualizado
  ON lotes (atualizado_em DESC);

-- lote_reservas
CREATE INDEX idx_reservas_lote_status
  ON lote_reservas (lote_id, status);

CREATE INDEX idx_reservas_expira_ativas
  ON lote_reservas (expira_em, status)
  WHERE status = 'ATIVA';
-- Este índice é o que o cron de expiração usa. Partial index — só reservas ativas.

CREATE INDEX idx_reservas_session
  ON lote_reservas (session_id, status);

CREATE INDEX idx_reservas_user
  ON lote_reservas (user_id, criado_em DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_reservas_payment_intent
  ON lote_reservas (payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;
-- Webhook Stripe localiza reserva pelo payment_intent_id

-- lote_lista_espera
CREATE INDEX idx_espera_produto_nao_notificado
  ON lote_lista_espera (produto_id, notificado_em)
  WHERE notificado_em IS NULL;
-- Job de notificação usa este índice para buscar quem notificar

CREATE INDEX idx_espera_lote
  ON lote_lista_espera (lote_id)
  WHERE lote_id IS NOT NULL;

-- lote_eventos
CREATE INDEX idx_eventos_lote_criado
  ON lote_eventos (lote_id, criado_em DESC);

CREATE INDEX idx_eventos_tipo_criado
  ON lote_eventos (tipo, criado_em DESC);

-- stripe_eventos_processados
-- PRIMARY KEY já cria índice em stripe_event_id — nenhum índice adicional necessário

-- ============================================================
-- 4. RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE lotes                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lote_reservas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lote_lista_espera          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lote_eventos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_eventos_processados ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 4.1 lotes — leitura pública, escrita apenas backend/admin
-- ----------------------------------------------------------

CREATE POLICY lotes_select_publico ON lotes
  FOR SELECT
  TO anon, authenticated
  USING (status NOT IN ('SUSPENSO'));
-- Lotes SUSPENSOS nunca aparecem para o público

CREATE POLICY lotes_insert_service ON lotes
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY lotes_update_service ON lotes
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ninguém deleta lote — apenas SUSPENDE
-- (sem policy DELETE = DELETE proibido para todos exceto superuser)

-- ----------------------------------------------------------
-- 4.2 lote_reservas — cada usuária vê apenas as próprias
-- ----------------------------------------------------------

CREATE POLICY reservas_select_proprio ON lote_reservas
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR session_id = current_setting('app.session_id', true)
  );

CREATE POLICY reservas_select_anonimo ON lote_reservas
  FOR SELECT
  TO anon
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY reservas_insert_service ON lote_reservas
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY reservas_update_service ON lote_reservas
  FOR UPDATE
  TO service_role
  USING (true);

-- Sem DELETE — reservas são marcadas EXPIRADA ou CANCELADA, nunca deletadas

-- ----------------------------------------------------------
-- 4.3 lote_lista_espera — usuária gerencia o próprio e-mail
-- ----------------------------------------------------------

CREATE POLICY espera_select_proprio ON lote_lista_espera
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = current_setting('app.user_email', true));

CREATE POLICY espera_insert_qualquer ON lote_lista_espera
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
-- Qualquer um pode entrar na lista de espera (anônimo ou logado)

CREATE POLICY espera_delete_proprio ON lote_lista_espera
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY espera_service ON lote_lista_espera
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------
-- 4.4 lote_eventos — append-only para todos, leitura para admin
-- ----------------------------------------------------------

CREATE POLICY eventos_insert_service ON lote_eventos
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Nenhuma policy de UPDATE ou DELETE — lote_eventos é imutável
-- Service role pode SELECT para auditoria

CREATE POLICY eventos_select_service ON lote_eventos
  FOR SELECT
  TO service_role
  USING (true);

-- ----------------------------------------------------------
-- 4.5 stripe_eventos_processados — service_role only
-- ----------------------------------------------------------

CREATE POLICY stripe_service_all ON stripe_eventos_processados
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- Webhook handler usa service_role — nenhum acesso público

-- ============================================================
-- 5. FUNÇÕES AUXILIARES
-- ============================================================

-- ----------------------------------------------------------
-- 5.1 Trigger: atualizar atualizado_em automaticamente
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lotes_atualizado_em
  BEFORE UPDATE ON lotes
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_atualizado_em();

-- ----------------------------------------------------------
-- 5.2 Função: calcular display_config do lote
-- Chamada pelo endpoint GET /api/lotes/produto/:produto_id
-- Retorna JSON pronto para consumo do frontend — sem lógica no cliente.
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_lote_display_config(p_lote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE  -- mesma transação = mesmo resultado
AS $$
DECLARE
  v_lote          lotes%ROWTYPE;
  v_pct_restante  numeric;
  v_urgencia      text;
  v_texto_estoque text;
  v_texto_esgot   text;
  v_mostrar_wl    boolean;
  v_mostrar_ctr   boolean;
BEGIN
  SELECT * INTO v_lote FROM lotes WHERE id = p_lote_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Percentual restante do estoque
  v_pct_restante := CASE
    WHEN v_lote.qtd_total = 0 THEN 0
    ELSE (v_lote.qtd_disponivel::numeric / v_lote.qtd_total) * 100
  END;

  -- Nível de urgência
  v_urgencia := CASE
    WHEN v_lote.status IN ('ENCERRADO', 'REPOSICAO_PREVISTA', 'SUSPENSO') THEN 'none'
    WHEN v_pct_restante <= 10 THEN 'high'
    WHEN v_lote.status = 'EM_ESGOTAMENTO'                                 THEN 'low'
    ELSE 'none'
  END;

  -- Texto de estoque (null quando não deve aparecer)
  v_texto_estoque := CASE
    WHEN v_lote.status = 'ABERTO' AND v_urgencia = 'none'  THEN NULL
    WHEN v_lote.status = 'EM_ESGOTAMENTO' AND v_pct_restante <= 10
      THEN 'Últimas ' || v_lote.qtd_disponivel || ' unidades deste lote'
    WHEN v_lote.status = 'EM_ESGOTAMENTO'
      THEN v_lote.qtd_disponivel || ' unidades disponíveis neste lote'
    ELSE NULL
  END;

  -- Texto de esgotado
  v_texto_esgot := CASE
    WHEN v_lote.status = 'ENCERRADO' AND v_lote.data_reposicao IS NULL
      THEN 'Lote encerrado. Sem reposição prevista no momento.'
    WHEN v_lote.status = 'REPOSICAO_PREVISTA'
      THEN 'Lote encerrado · reposição prevista para '
           || to_char(v_lote.data_reposicao, 'DD/MM/YYYY')
    WHEN v_lote.status = 'ENCERRADO'
      THEN 'Lote encerrado · reposição prevista para '
           || to_char(v_lote.data_reposicao, 'DD/MM/YYYY')
    ELSE NULL
  END;

  v_mostrar_wl  := v_lote.status IN ('ENCERRADO', 'REPOSICAO_PREVISTA');
  v_mostrar_ctr := v_urgencia != 'none';

  RETURN jsonb_build_object(
    'lote_id',           v_lote.id,
    'status',            v_lote.status,
    'qtd_disponivel',    v_lote.qtd_disponivel,
    'qtd_total',         v_lote.qtd_total,
    'mostrar_contador',  v_mostrar_ctr,
    'urgencia_level',    v_urgencia,
    'texto_estoque',     v_texto_estoque,
    'texto_esgotado',    v_texto_esgot,
    'mostrar_waitlist',  v_mostrar_wl,
    'abertura_geral_em', v_lote.abertura_geral_em,
    'data_reposicao',    v_lote.data_reposicao
  );
END;
$$;

COMMENT ON FUNCTION fn_lote_display_config IS
  'Calcula display_config do lote pronto para o frontend — sem lógica no cliente. '
  'Chamada pelo endpoint GET /api/lotes/produto/:produto_id';

-- ----------------------------------------------------------
-- 5.3 Função: verificar consistência de qtd antes de reservar
-- Chamada pelo reservaService antes do UPDATE.
-- Lança exceção se qtd_disponivel ficaria negativo.
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_verificar_qtd_disponivel(
  p_lote_id  uuid,
  p_quantidade int
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_disponivel int;
BEGIN
  SELECT qtd_disponivel
    INTO v_disponivel
    FROM lotes
   WHERE id = p_lote_id
     FOR UPDATE;  -- lock para evitar race condition

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LOTE_NAO_ENCONTRADO: lote_id=%', p_lote_id;
  END IF;

  IF v_disponivel < p_quantidade THEN
    RAISE EXCEPTION 'ESTOQUE_INSUFICIENTE: disponivel=%, solicitado=%',
      v_disponivel, p_quantidade;
  END IF;
END;
$$;

COMMENT ON FUNCTION fn_verificar_qtd_disponivel IS
  'INVARIANTE DE ESTOQUE: lança exceção se qtd_disponivel ficaria negativo. '
  'Chamar dentro de transação antes de qualquer UPDATE de reserva.';

-- ============================================================
-- 6. GRANTS EXPLÍCITOS
-- ============================================================

-- anon e authenticated só podem SELECT em lotes (via RLS)
GRANT SELECT ON lotes TO anon, authenticated;

-- authenticated pode inserir na lista de espera
GRANT SELECT, INSERT, DELETE ON lote_lista_espera TO authenticated;
GRANT SELECT, INSERT         ON lote_lista_espera TO anon;

-- Service role tem acesso total (operações de backend)
GRANT ALL ON lotes, lote_reservas, lote_lista_espera,
             lote_eventos, stripe_eventos_processados
  TO service_role;

-- Sequências (se houver — uuid não precisa, mas por segurança)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================
-- 7. VALIDAÇÃO FINAL (executada dentro do BEGIN/COMMIT)
-- ============================================================

DO $$
BEGIN
  -- Verificar que todos os ENUMs foram criados
  ASSERT (SELECT COUNT(*) FROM pg_type WHERE typname IN (
    'lote_status', 'reserva_status', 'evento_tipo'
  )) = 3, 'ENUMs não criados corretamente';

  -- Verificar que todas as tabelas existem
  ASSERT (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_name IN (
      'lotes', 'lote_reservas', 'lote_lista_espera',
      'lote_eventos', 'stripe_eventos_processados'
    )
  ) = 5, 'Tabelas não criadas corretamente';

  -- Verificar que RLS está ativo
  ASSERT (SELECT COUNT(*) FROM pg_tables
    WHERE tablename IN (
      'lotes', 'lote_reservas', 'lote_lista_espera',
      'lote_eventos', 'stripe_eventos_processados'
    )
    AND rowsecurity = true
  ) = 5, 'RLS não ativado em todas as tabelas';

  RAISE NOTICE '✓ Migration 20260516_0200_lote_curado validada com sucesso';
END;
$$;

COMMIT;

-- ============================================================
-- ROLLBACK (executar manualmente se necessário)
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS stripe_eventos_processados CASCADE;
-- DROP TABLE IF EXISTS lote_eventos               CASCADE;
-- DROP TABLE IF EXISTS lote_lista_espera          CASCADE;
-- DROP TABLE IF EXISTS lote_reservas              CASCADE;
-- DROP TABLE IF EXISTS lotes                      CASCADE;
-- DROP TYPE  IF EXISTS evento_tipo                CASCADE;
-- DROP TYPE  IF EXISTS reserva_status             CASCADE;
-- DROP TYPE  IF EXISTS lote_status                CASCADE;
-- DROP FUNCTION IF EXISTS fn_set_atualizado_em()        CASCADE;
-- DROP FUNCTION IF EXISTS fn_lote_display_config(uuid)  CASCADE;
-- DROP FUNCTION IF EXISTS fn_verificar_qtd_disponivel(uuid, int) CASCADE;
-- COMMIT;
