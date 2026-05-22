-- ─── Copilot schema — complementos ao 0400 ───────────────────────────────────
-- Idempotente: pode ser re-executado sem efeito colateral.

-- Adicionar interacao_id a copilot_notas_pele (referência à interação geradora)
ALTER TABLE copilot_notas_pele
  ADD COLUMN IF NOT EXISTS interacao_id uuid REFERENCES copilot_interacoes(id);

-- Adicionar índice para notas por interação
CREATE INDEX IF NOT EXISTS idx_copilot_notas_interacao
  ON copilot_notas_pele(interacao_id)
  WHERE interacao_id IS NOT NULL;

-- ─── Políticas de service_role ────────────────────────────────────────────────
-- Workers (scheduler, delivery) precisam de acesso full sem filtragem por uid.
-- service_role bypassa RLS por padrão no Supabase, mas declarar explicitamente
-- documenta a intenção e evita regressão em ambientes restritos.

DO $$ BEGIN
  CREATE POLICY interacao_service ON copilot_interacoes
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY resposta_service ON copilot_respostas
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY notas_service ON copilot_notas_pele
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY config_service ON copilot_configs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
