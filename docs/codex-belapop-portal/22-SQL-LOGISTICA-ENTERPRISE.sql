-- Enable UUID generator
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMs
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('created','paid','cancelled','returned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE operational_status AS ENUM (
    'a_confirmar','separando','pronto_envio','postado','em_transito','entregue',
    'tentativa_frustrada','devolucao_logistica'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sla_status AS ENUM ('on_time','due_today','at_risk','late');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('scheduled','processing','paid','blocked','disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- USERS (minimal placeholder; usually you have your auth user table)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- STORES
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- STORE SETTINGS (SLA rules)
CREATE TABLE IF NOT EXISTS store_settings (
  store_id uuid PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  post_time_limit_hours integer NOT NULL DEFAULT 24, -- max time to post after payment
  cutoff_hour smallint NOT NULL DEFAULT 14,          -- hour in local time
  business_days_only boolean NOT NULL DEFAULT true,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_cutoff_hour CHECK (cutoff_hour BETWEEN 0 AND 23),
  CONSTRAINT chk_post_time_limit CHECK (post_time_limit_hours BETWEEN 1 AND 168)
);

-- CATEGORIES (optional)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  title text NOT NULL,
  sku text NOT NULL,
  price numeric(12,2) NOT NULL,
  cost numeric(12,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_store_sku UNIQUE(store_id, sku),
  CONSTRAINT chk_price_nonneg CHECK (price >= 0),
  CONSTRAINT chk_cost_nonneg CHECK (cost IS NULL OR cost >= 0)
);

-- INVENTORY (aggregate per product)
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  reserved integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_inventory_nonneg CHECK (quantity >= 0 AND reserved >= 0),
  CONSTRAINT chk_reserved_le_qty CHECK (reserved <= quantity)
);

-- LOTS (batch/expiration)
CREATE TABLE IF NOT EXISTS lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lot_code text NOT NULL,
  quantity integer NOT NULL,
  reserved integer NOT NULL DEFAULT 0,
  manufacture_date date,
  expiration_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_lot_qty CHECK (quantity >= 0 AND reserved >= 0),
  CONSTRAINT chk_lot_reserved CHECK (reserved <= quantity)
);
CREATE INDEX IF NOT EXISTS idx_lots_expiration ON lots(expiration_date);
CREATE INDEX IF NOT EXISTS idx_lots_product ON lots(product_id);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  city text,
  state text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  recipient_name text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  zipcode text NOT NULL,
  country text NOT NULL DEFAULT 'BR',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  shipping_address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,

  total_amount numeric(12,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'created',
  operational_status operational_status NOT NULL DEFAULT 'a_confirmar',
  sla_status sla_status NOT NULL DEFAULT 'on_time',
  sla_due_at timestamptz, -- computed on payment approval

  payment_approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_order_total_nonneg CHECK (total_amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_orders_store_created ON orders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_sla_due ON orders(sla_due_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, operational_status);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sku text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  lot_id uuid REFERENCES lots(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_item_qty CHECK (quantity > 0),
  CONSTRAINT chk_item_price CHECK (unit_price >= 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- SHIPMENTS
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,

  carrier text,
  tracking_code text,
  posted_at timestamptz,
  last_status_at timestamptz,
  current_status text,

  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_store ON shipments(store_id);

-- TRACKING UPDATES (history)
CREATE TABLE IF NOT EXISTS shipment_events (
  id bigserial PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status text NOT NULL,
  raw_payload jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipmentevents_ship ON shipment_events(shipment_id, occurred_at DESC);

-- ORDER EVENT LOG (audit/event sourcing)
CREATE TABLE IF NOT EXISTS order_events (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_events_type ON order_events(event_type);

-- ALERT RULES (configurable)
CREATE TABLE IF NOT EXISTS alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  condition jsonb NOT NULL,
  action jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alert_rules_store ON alert_rules(store_id);

-- ALERTS (generated)
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  severity text NOT NULL,  -- 'info'|'warning'|'critical'
  type text NOT NULL,      -- 'sla_due'|'tracking_missing'|'expiration'...
  message text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open', -- 'open'|'snoozed'|'resolved'
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_alerts_store_status ON alerts(store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);

-- PAYOUTS (seller receivables)
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross numeric(12,2) NOT NULL DEFAULT 0,
  fees numeric(12,2) NOT NULL DEFAULT 0,
  refunds numeric(12,2) NOT NULL DEFAULT 0,
  net numeric(12,2) NOT NULL DEFAULT 0,
  status payout_status NOT NULL DEFAULT 'scheduled',
  scheduled_for date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_payout_nonneg CHECK (gross >= 0 AND fees >= 0 AND refunds >= 0)
);
CREATE INDEX IF NOT EXISTS idx_payouts_store_period ON payouts(store_id, period_start DESC);

-- STORE LOGISTICS SCORE (cached)
CREATE TABLE IF NOT EXISTS store_logistics_scores (
  store_id uuid PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL,
  components jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_score_range CHECK (score BETWEEN 0 AND 100)
);

-- BASIC REVIEWS (for ranking signals)
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX IF NOT EXISTS idx_reviews_store ON reviews(store_id, created_at DESC);
