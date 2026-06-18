-- Add glass_qty to drops table
-- Tracks the number of "Drop Glass" units available per drop.

ALTER TABLE public.drops
  ADD COLUMN IF NOT EXISTS glass_qty integer NOT NULL DEFAULT 0;
