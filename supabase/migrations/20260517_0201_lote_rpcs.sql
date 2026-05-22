-- ============================================================
-- BelaPop · Lote Curado · RPCs
-- Migration: 20260517_0201_lote_rpcs
-- Supabase / PostgreSQL 15+
--
-- Funções chamadas pela camada TypeScript (loteService.ts):
--   fn_aplicar_transicao_lote  — aplica mudança de status com log
--   fn_expirar_reservas        — libera reservas vencidas (cron 5min)
--   fn_notificar_lista_espera  — marca notificado_em em lote_lista_espera
--
-- Funções dos triggers:
--   fn_sync_status_lote        — recalcula status após qtd mudar
--
-- Pré-requisito: 20260516_0200_lote_curado.sql já aplicado
-- ============================================================

BEGIN;

-- ============================================================
-- 1. fn_aplicar_transicao_lote
-- Aplica uma transição de status com registro em lote_eventos.
-- Idempotente: se status já é o desejado, retorna ok sem erro.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_aplicar_transicao_lote(
  p_lote_id      uuid,
  p_status_novo  lote_status,
  p_actor_id     uuid    DEFAULT NULL,
  p_actor_tipo   text    DEFAULT 'system',
  p_metadata     jsonb   DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_lote        lotes%ROWTYPE;
  v_encerrado   timestamptz;
BEGIN
  SELECT * INTO v_lote FROM lotes WHERE id = p_lote_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'lote_not_found');
  END IF;

  -- Idempotente
  IF v_lote.status = p_status_novo THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'status', p_status_novo);
  END IF;

  -- encerrado_em obrigatório quando status = ENCERRADO
  v_encerrado := CASE WHEN p_status_novo = 'ENCERRADO' THEN now() ELSE NULL END;

  UPDATE lotes SET
    status       = p_status_novo,
    encerrado_em = COALESCE(v_encerrado, encerrado_em)
  WHERE id = p_lote_id;

  INSERT INTO lote_eventos (
    lote_id, tipo, status_anterior, status_novo,
    delta_qtd, actor_id, actor_tipo, metadata
  ) VALUES (
    p_lote_id, 'TRANSICAO', v_lote.status, p_status_novo,
    0, p_actor_id, p_actor_tipo, p_metadata
  );

  RETURN jsonb_build_object(
    'ok',             true,
    'status_anterior', v_lote.status,
    'status_novo',     p_status_novo
  );
END;
$$;

COMMENT ON FUNCTION fn_aplicar_transicao_lote IS
  'Aplica transição de status do lote com log em lote_eventos. Idempotente.';

GRANT EXECUTE ON FUNCTION fn_aplicar_transicao_lote TO service_role;

-- ============================================================
-- 2. fn_expirar_reservas
-- Libera reservas cuja expira_em < now() e status = ATIVA.
-- Usa SKIP LOCKED para segurança com múltiplas instâncias.
-- Retorna quantidade de reservas liberadas.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_expirar_reservas(
  p_limite int DEFAULT 200  -- processa no máximo N reservas por chamada
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_reserva     lote_reservas%ROWTYPE;
  v_liberadas   int := 0;
  v_lote        lotes%ROWTYPE;
  v_status_novo lote_status;
BEGIN
  FOR v_reserva IN
    SELECT * FROM lote_reservas
    WHERE status = 'ATIVA'
      AND expira_em < now()
    ORDER BY expira_em
    LIMIT p_limite
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Marcar reserva como expirada
    UPDATE lote_reservas
      SET status = 'EXPIRADA'
      WHERE id = v_reserva.id;

    -- Devolver estoque ao lote (SELECT FOR UPDATE dentro do loop)
    SELECT * INTO v_lote FROM lotes
      WHERE id = v_reserva.lote_id FOR UPDATE;

    IF FOUND THEN
      UPDATE lotes SET
        qtd_disponivel = qtd_disponivel + v_reserva.quantidade,
        qtd_reservada  = GREATEST(0, qtd_reservada - v_reserva.quantidade)
      WHERE id = v_reserva.lote_id;

      -- Recalcular status
      SELECT * INTO v_lote FROM lotes WHERE id = v_reserva.lote_id;

      v_status_novo := CASE
        WHEN v_lote.status IN ('SUSPENSO', 'REPOSICAO_PREVISTA') THEN v_lote.status
        WHEN v_lote.qtd_disponivel = 0 AND v_lote.qtd_reservada = 0 THEN 'ENCERRADO'
        WHEN v_lote.qtd_disponivel = 0 THEN 'EM_ESGOTAMENTO'
        WHEN v_lote.qtd_disponivel <= ROUND(v_lote.qtd_total * v_lote.limiar_alerta_pct / 100.0)
          THEN 'EM_ESGOTAMENTO'
        ELSE 'ABERTO'
      END;

      IF v_status_novo != v_lote.status THEN
        UPDATE lotes SET status = v_status_novo WHERE id = v_lote.id;
      END IF;

      -- Log de liberação
      INSERT INTO lote_eventos (
        lote_id, tipo, status_anterior, status_novo,
        delta_qtd, actor_tipo, metadata
      ) VALUES (
        v_reserva.lote_id, 'LIBERACAO',
        v_lote.status,
        CASE WHEN v_status_novo != v_lote.status THEN v_status_novo ELSE NULL END,
        v_reserva.quantidade,
        'system',
        jsonb_build_object('reserva_id', v_reserva.id, 'motivo', 'expiracao_ttl')
      );
    END IF;

    v_liberadas := v_liberadas + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'liberadas', v_liberadas);
END;
$$;

COMMENT ON FUNCTION fn_expirar_reservas IS
  'Libera reservas vencidas e devolve estoque. SKIP LOCKED — seguro com múltiplos workers.';

GRANT EXECUTE ON FUNCTION fn_expirar_reservas TO service_role;

-- ============================================================
-- 3. fn_notificar_lista_espera
-- Marca notificado_em para todos os não-notificados de um produto.
-- Chamada após disparar e-mails de reposição.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_notificar_lista_espera(
  p_produto_id uuid,
  p_lote_id    uuid DEFAULT NULL  -- null = notifica para o produto todo
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE lote_lista_espera
    SET notificado_em = now()
  WHERE produto_id = p_produto_id
    AND notificado_em IS NULL
    AND (p_lote_id IS NULL OR lote_id = p_lote_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Registrar evento de notificação no log do lote (se lote fornecido)
  IF p_lote_id IS NOT NULL AND v_count > 0 THEN
    INSERT INTO lote_eventos (
      lote_id, tipo, delta_qtd, actor_tipo, metadata
    ) VALUES (
      p_lote_id, 'NOTIFICACAO_ESPERA', 0, 'system',
      jsonb_build_object('produto_id', p_produto_id, 'notificadas', v_count)
    )
    ON CONFLICT DO NOTHING;  -- índice de idempotência por minuto
  END IF;

  RETURN jsonb_build_object('ok', true, 'notificadas', v_count);
END;
$$;

COMMENT ON FUNCTION fn_notificar_lista_espera IS
  'Marca notificado_em na lista de espera e registra evento. Idempotente por minuto.';

GRANT EXECUTE ON FUNCTION fn_notificar_lista_espera TO service_role;

-- ============================================================
-- 4. Trigger: fn_sync_status_lote
-- Recalcula status automaticamente após UPDATE em qtd_disponivel
-- ou qtd_reservada. Evita status inconsistente sem chamar o TS.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_sync_status_lote()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_status_novo lote_status;
  v_limiar_abs  int;
BEGIN
  -- Estados manuais: nunca recalcular
  IF NEW.status IN ('SUSPENSO', 'REPOSICAO_PREVISTA') THEN
    RETURN NEW;
  END IF;

  v_limiar_abs := ROUND(NEW.qtd_total * NEW.limiar_alerta_pct / 100.0);

  v_status_novo := CASE
    WHEN NEW.qtd_disponivel = 0 AND NEW.qtd_reservada = 0 THEN 'ENCERRADO'
    WHEN NEW.qtd_disponivel = 0                            THEN 'EM_ESGOTAMENTO'
    WHEN NEW.qtd_disponivel <= v_limiar_abs                THEN 'EM_ESGOTAMENTO'
    ELSE 'ABERTO'
  END;

  -- Só atualiza status se mudou — evita loop de trigger
  IF v_status_novo != NEW.status THEN
    NEW.status       := v_status_novo;
    NEW.encerrado_em := CASE
      WHEN v_status_novo = 'ENCERRADO' AND OLD.status != 'ENCERRADO' THEN now()
      WHEN v_status_novo != 'ENCERRADO'                               THEN NULL
      ELSE NEW.encerrado_em
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_status_lote ON lotes;
CREATE TRIGGER trg_sync_status_lote
  BEFORE UPDATE OF qtd_disponivel, qtd_reservada ON lotes
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_status_lote();

COMMENT ON FUNCTION fn_sync_status_lote IS
  'Trigger: recalcula status do lote após mudança de qtd. Estados manuais (SUSPENSO, REPOSICAO_PREVISTA) são preservados.';

-- ============================================================
-- 5. VALIDAÇÃO
-- ============================================================

DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM pg_proc WHERE proname IN (
    'fn_aplicar_transicao_lote',
    'fn_expirar_reservas',
    'fn_notificar_lista_espera',
    'fn_sync_status_lote'
  )) >= 4, 'RPCs não criados corretamente';

  RAISE NOTICE '✓ Migration 20260517_0201_lote_rpcs validada com sucesso';
END;
$$;

COMMIT;
