-- =============================================================================
-- Migration: 20260621_0200_drop_orders.sql
--
-- Tabela de pedidos de drops (canal Círculo).
-- Separada dos pedidos do marketplace para não misturar fluxos.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.drop_orders (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id           uuid        NOT NULL REFERENCES public.drops(id),
  drop_item_id      uuid        REFERENCES public.drop_items(id),
  user_id           uuid,
  stripe_session_id text        UNIQUE,
  stripe_payment_id text,
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','paid','refunded','failed')),
  total_cents       integer     NOT NULL CHECK (total_cents > 0),
  items_snapshot    jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drop_orders_drop_id   ON public.drop_orders (drop_id);
CREATE INDEX IF NOT EXISTS idx_drop_orders_user_id   ON public.drop_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_drop_orders_session   ON public.drop_orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_drop_orders_status    ON public.drop_orders (status);

-- Trigger updated_at (reutiliza a função já criada pela migration anterior)
DROP TRIGGER IF EXISTS trg_drop_orders_updated_at ON public.drop_orders;
CREATE TRIGGER trg_drop_orders_updated_at
  BEFORE UPDATE ON public.drop_orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- RLS: somente service_role grava; usuário lê seus próprios pedidos
ALTER TABLE public.drop_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS drop_orders_self_read ON public.drop_orders;
CREATE POLICY drop_orders_self_read
  ON public.drop_orders FOR SELECT
  USING (auth.uid() = user_id);
