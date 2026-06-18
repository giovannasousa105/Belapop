-- =============================================================================
-- BelaPop - Circulo BelaPop: consentimentos LGPD destacados
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('public.circulo_members') IS NULL THEN
    RAISE NOTICE 'Tabela public.circulo_members nao existe neste projeto. Migration ignorada.';
  ELSE
    EXECUTE 'ALTER TABLE public.circulo_members ADD COLUMN IF NOT EXISTS consent_skin_data BOOLEAN NOT NULL DEFAULT FALSE';
    EXECUTE 'ALTER TABLE public.circulo_members ADD COLUMN IF NOT EXISTS consent_terms BOOLEAN NOT NULL DEFAULT FALSE';
    EXECUTE 'ALTER TABLE public.circulo_members ADD COLUMN IF NOT EXISTS declared_over_18 BOOLEAN NOT NULL DEFAULT FALSE';

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'circulo_members'
        AND column_name = 'consent_marketing'
    ) THEN
      EXECUTE 'ALTER TABLE public.circulo_members ALTER COLUMN consent_marketing SET DEFAULT FALSE';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'circulo_members'
        AND column_name = 'consent_lgpd'
    ) THEN
      EXECUTE 'ALTER TABLE public.circulo_members ALTER COLUMN consent_lgpd SET DEFAULT FALSE';
    END IF;

    EXECUTE 'COMMENT ON COLUMN public.circulo_members.consent_skin_data IS ''Consentimento especifico e destacado para uso de dados de pele/preocupacao dermatologica na curadoria do Circulo.''';
    EXECUTE 'COMMENT ON COLUMN public.circulo_members.consent_terms IS ''Aceite dos Termos de Uso e Aviso de Privacidade no momento da inscricao.''';
    EXECUTE 'COMMENT ON COLUMN public.circulo_members.declared_over_18 IS ''Declaracao de que a pessoa inscrita tem 18 anos ou mais.''';
  END IF;
END $$;
