-- Migration: add stripe_session_id to lote_reservas
-- Used by createCheckoutSession to link the Checkout Session back to the reservation.

ALTER TABLE lote_reservas
  ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_lote_reservas_stripe_session_id
  ON lote_reservas (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
