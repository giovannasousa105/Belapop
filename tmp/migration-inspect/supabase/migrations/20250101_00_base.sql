SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
CREATE SCHEMA IF NOT EXISTS "public";
ALTER SCHEMA "public" OWNER TO "pg_database_owner";
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE TYPE "public"."orderstatus" AS ENUM (
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);
ALTER TYPE "public"."orderstatus" OWNER TO "postgres";
CREATE TYPE "public"."paymentstatus" AS ENUM (
    'pending',
    'authorized',
    'paid',
    'failed',
    'refunded',
    'chargeback'
);
ALTER TYPE "public"."paymentstatus" OWNER TO "postgres";
CREATE TYPE "public"."shipmentstatus" AS ENUM (
    'pending',
    'label_created',
    'in_transit',
    'delivered',
    'cancelled',
    'returned'
);
ALTER TYPE "public"."shipmentstatus" OWNER TO "postgres";
CREATE TYPE "public"."user_role" AS ENUM (
    'customer',
    'seller',
    'admin'
);
ALTER TYPE "public"."user_role" OWNER TO "postgres";
CREATE TYPE "public"."userrole" AS ENUM (
    'customer',
    'seller',
    'admin'
);
ALTER TYPE "public"."userrole" OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."current_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE
    AS $$
  select role from public.profiles where id = auth.uid()
$$;
ALTER FUNCTION "public"."current_role"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."get_admin_kpis"() RETURNS TABLE("gmv_cents" bigint, "orders" integer, "aov_cents" bigint, "cart_abandon_rate" numeric)
    LANGUAGE "sql"
    AS $$
  select
    coalesce(sum(total_order_cents),0) as gmv_cents,
    count(*) as orders,
    case when count(*)=0 then 0 else sum(total_order_cents)/count(*) end as aov_cents,
    0::numeric as cart_abandon_rate  -- ajuste se tiver eventos de abandono
  from public.orders;
$$;
ALTER FUNCTION "public"."get_admin_kpis"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."log_order_status_history"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if (tg_op = 'INSERT') then
    insert into public.order_status_history (order_id, status, created_at)
    values (new.id, new.status, coalesce(new.created_at, now()));
  elsif (tg_op = 'UPDATE') then
    if (new.status is distinct from old.status) then
      insert into public.order_status_history (order_id, status, created_at)
      values (new.id, new.status, now());
    end if;
  end if;
  return new;
end;
$$;
ALTER FUNCTION "public"."log_order_status_history"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at = now(); return new; end $$;
ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";
CREATE OR REPLACE FUNCTION "public"."update_cart_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin new.updated_at = now(); return new; end;
$$;
ALTER FUNCTION "public"."update_cart_timestamp"() OWNER TO "postgres";
SET default_tablespace = '';
SET default_table_access_method = "heap";
CREATE TABLE IF NOT EXISTS "public"."analytics_daily" (
    "date" "date" NOT NULL,
    "gmv_cents" bigint DEFAULT 0,
    "orders" integer DEFAULT 0,
    "aov_cents" bigint DEFAULT 0,
    "cart_abandon_rate" numeric(5,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."analytics_daily" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "user_id" "uuid",
    "seller_id" "uuid",
    "product_id" "uuid",
    "order_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."analytics_events" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "id" "uuid" NOT NULL,
    "cart_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price_cents" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."cart_items" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "anon_id" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subtotal_cents" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."carts" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."customers" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "key" "text" NOT NULL,
    "value_json" "jsonb" DEFAULT '{}'::"jsonb",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."feature_flags" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."gift_redemptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid",
    "gift_id" "uuid",
    "applied_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."gift_redemptions" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."gifts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "sku" "text",
    "stock" integer DEFAULT 0,
    "min_order_cents" integer DEFAULT 0,
    "category_filter" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."gifts" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid",
    "url" "text" NOT NULL,
    "number" "text",
    "issued_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."invoices" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_user_id" "uuid" NOT NULL,
    "seller_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "cta_label" "text",
    "cta_href" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "read_at" timestamp with time zone
);
ALTER TABLE "public"."notifications" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "product_id" "uuid",
    "seller_id" "uuid",
    "quantity" integer DEFAULT 1 NOT NULL,
    "price_cents" integer DEFAULT 0 NOT NULL,
    "total_cents" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."order_items" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."order_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."order_status_history" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."order_store_totals" (
    "id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "subtotal_cents" integer NOT NULL,
    "shipping_cents" integer NOT NULL,
    "discount_cents" integer NOT NULL,
    "total_cents" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."order_store_totals" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "total_products_cents" integer DEFAULT 0 NOT NULL,
    "total_shipping_cents" integer DEFAULT 0 NOT NULL,
    "total_order_cents" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'created'::"text" NOT NULL,
    "payment_status" "text",
    "payment_provider" "text",
    "payment_intent_id" "text",
    "address" "jsonb",
    "destination_cep" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shipping_status" "text",
    "issues" "jsonb" DEFAULT '{}'::"jsonb",
    "total_cents" integer,
    "sla_deadline" timestamp with time zone
);
ALTER TABLE "public"."orders" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" "public"."paymentstatus" NOT NULL,
    "amount_cents" integer NOT NULL,
    "currency" character varying NOT NULL,
    "provider" character varying,
    "provider_ref" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."payments" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."payouts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "seller_id" "uuid",
    "amount_cents" integer NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "scheduled_for" "date",
    "paid_at" timestamp with time zone,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."payouts" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "body_md" "text",
    "media_url" "text",
    "media_type" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'draft'::"text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."posts" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."product_moderation_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid",
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."product_moderation_logs" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."product_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "order_item_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "is_verified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "product_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);
ALTER TABLE "public"."product_reviews" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "price_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'BRL'::"text" NOT NULL,
    "weight_kg" numeric(10,3) DEFAULT 0.300 NOT NULL,
    "width_cm" numeric(10,2) DEFAULT 10 NOT NULL,
    "height_cm" numeric(10,2) DEFAULT 10 NOT NULL,
    "length_cm" numeric(10,2) DEFAULT 10 NOT NULL,
    "stock_quantity" integer DEFAULT 0 NOT NULL,
    "images" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "highlights" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "image_tone" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "curated" boolean DEFAULT false NOT NULL,
    "curation_feedback" "text",
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "products_price_cents_check" CHECK (("price_cents" >= 0))
);
ALTER TABLE "public"."products" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "role" "public"."user_role" DEFAULT 'customer'::"public"."user_role" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."profiles" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."promotions" (
    "id" "uuid" NOT NULL,
    "code" character varying NOT NULL,
    "percent_off" integer,
    "amount_off_cents" integer,
    "min_subtotal_cents" integer,
    "is_active" boolean,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."promotions" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "rating" integer NOT NULL,
    "title" character varying,
    "body" character varying,
    "is_verified" boolean,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."reviews" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."search_synonyms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "term" "text" NOT NULL,
    "synonym" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."search_synonyms" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."seller_audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "seller_id" "uuid",
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."seller_audit_logs" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."seller_metrics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "seller_id" "uuid",
    "period" "text" NOT NULL,
    "nps" numeric(5,2),
    "cancel_rate" numeric(5,2),
    "return_rate" numeric(5,2),
    "ship_sla_hours" numeric(6,2),
    "on_time_rate" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."seller_metrics" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."sellers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "store_name" "text" NOT NULL,
    "category" "text",
    "postal_code" "text" NOT NULL,
    "whatsapp" "text",
    "instagram" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "stripe_account_id" "text",
    "commission_rate" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."sellers" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."shipment_items" (
    "id" "uuid" NOT NULL,
    "shipment_id" "uuid" NOT NULL,
    "order_item_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL
);
ALTER TABLE "public"."shipment_items" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."shipments" (
    "id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "status" "public"."shipmentstatus" NOT NULL,
    "shipping_cents" integer NOT NULL,
    "carrier" character varying,
    "service_level" character varying,
    "tracking_code" character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."shipments" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."shipping_rules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "uf" character(2),
    "cep_prefix" "text",
    "carrier" "text",
    "base_cents" integer DEFAULT 0 NOT NULL,
    "per_kg_cents" integer DEFAULT 0 NOT NULL,
    "eta_days" integer,
    "promo" boolean DEFAULT false,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."shipping_rules" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "name" character varying NOT NULL,
    "slug" character varying NOT NULL,
    "description" character varying,
    "is_active" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."stores" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."sub_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "product_total_cents" integer DEFAULT 0 NOT NULL,
    "shipping_total_cents" integer DEFAULT 0 NOT NULL,
    "platform_fee_cents" integer DEFAULT 0 NOT NULL,
    "seller_net_cents" integer DEFAULT 0 NOT NULL,
    "shipping_service" "text",
    "shipping_days" integer,
    "status" "text" DEFAULT 'created'::"text" NOT NULL,
    "payment_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."sub_orders" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "order_id" "uuid",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text",
    "assigned_to" "uuid",
    "sla_deadline" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."support_tickets" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "role" "public"."userrole" NOT NULL,
    "name" character varying NOT NULL,
    "email" character varying NOT NULL,
    "phone" character varying,
    "password_hash" character varying,
    "is_active" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."users" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" NOT NULL,
    "provider" character varying NOT NULL,
    "event_id" character varying NOT NULL,
    "event_type" character varying NOT NULL,
    "payload" json NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."webhook_events" OWNER TO "postgres";
CREATE TABLE IF NOT EXISTS "public"."wishlist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."wishlist_items" OWNER TO "postgres";
ALTER TABLE ONLY "public"."analytics_daily"
    ADD CONSTRAINT "analytics_daily_pkey" PRIMARY KEY ("date");
ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_anon_id_key" UNIQUE ("anon_id");
ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_user_id_key" UNIQUE ("user_id");
ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");
ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key");
ALTER TABLE ONLY "public"."gift_redemptions"
    ADD CONSTRAINT "gift_redemptions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."gifts"
    ADD CONSTRAINT "gifts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."order_store_totals"
    ADD CONSTRAINT "order_store_totals_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_key" UNIQUE ("order_id");
ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_slug_key" UNIQUE ("slug");
ALTER TABLE ONLY "public"."product_moderation_logs"
    ADD CONSTRAINT "product_moderation_logs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_code_key" UNIQUE ("code");
ALTER TABLE ONLY "public"."promotions"
    ADD CONSTRAINT "promotions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."search_synonyms"
    ADD CONSTRAINT "search_synonyms_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."search_synonyms"
    ADD CONSTRAINT "search_synonyms_term_synonym_key" UNIQUE ("term", "synonym");
ALTER TABLE ONLY "public"."seller_audit_logs"
    ADD CONSTRAINT "seller_audit_logs_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."seller_metrics"
    ADD CONSTRAINT "seller_metrics_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."sellers"
    ADD CONSTRAINT "sellers_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."shipment_items"
    ADD CONSTRAINT "shipment_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."shipping_rules"
    ADD CONSTRAINT "shipping_rules_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_slug_key" UNIQUE ("slug");
ALTER TABLE ONLY "public"."sub_orders"
    ADD CONSTRAINT "sub_orders_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "uq_cart_product" UNIQUE ("cart_id", "product_id");
ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "uq_order_store" UNIQUE ("order_id", "store_id");
ALTER TABLE ONLY "public"."order_store_totals"
    ADD CONSTRAINT "uq_order_store_totals" UNIQUE ("order_id", "store_id");
ALTER TABLE ONLY "public"."shipment_items"
    ADD CONSTRAINT "uq_shipment_item" UNIQUE ("shipment_id", "order_item_id");
ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");
ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_event_id_key" UNIQUE ("event_id");
ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_user_id_product_id_key" UNIQUE ("user_id", "product_id");
CREATE UNIQUE INDEX "carts_anon_id_idx" ON "public"."carts" USING "btree" ("anon_id") WHERE ("anon_id" IS NOT NULL);
CREATE UNIQUE INDEX "carts_user_id_idx" ON "public"."carts" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);
CREATE INDEX "idx_analytics_created" ON "public"."analytics_events" USING "btree" ("created_at");
CREATE INDEX "idx_analytics_type" ON "public"."analytics_events" USING "btree" ("type");
CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");
CREATE INDEX "idx_gift_redemptions_order" ON "public"."gift_redemptions" USING "btree" ("order_id");
CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");
CREATE INDEX "idx_notifications_recipient" ON "public"."notifications" USING "btree" ("recipient_user_id", "created_at" DESC);
CREATE INDEX "idx_notifications_user_read" ON "public"."notifications" USING "btree" ("user_id", "read_at");
CREATE INDEX "idx_order_items_order" ON "public"."order_items" USING "btree" ("order_id");
CREATE INDEX "idx_order_items_product" ON "public"."order_items" USING "btree" ("product_id");
CREATE INDEX "idx_order_items_seller" ON "public"."order_items" USING "btree" ("seller_id");
CREATE INDEX "idx_order_status_history_order_id" ON "public"."order_status_history" USING "btree" ("order_id");
CREATE INDEX "idx_orders_customer" ON "public"."orders" USING "btree" ("customer_id");
CREATE INDEX "idx_payouts_seller_status" ON "public"."payouts" USING "btree" ("seller_id", "status");
CREATE INDEX "idx_posts_status_pub" ON "public"."posts" USING "btree" ("status", "published_at" DESC);
CREATE INDEX "idx_product_moderation_product" ON "public"."product_moderation_logs" USING "btree" ("product_id");
CREATE INDEX "idx_product_reviews_product_id" ON "public"."product_reviews" USING "btree" ("product_id");
CREATE INDEX "idx_product_reviews_user_id" ON "public"."product_reviews" USING "btree" ("user_id");
CREATE INDEX "idx_products_seller_id" ON "public"."products" USING "btree" ("seller_id");
CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status");
CREATE INDEX "idx_search_synonyms_term" ON "public"."search_synonyms" USING "btree" ("term");
CREATE INDEX "idx_seller_metrics_period" ON "public"."seller_metrics" USING "btree" ("seller_id", "period");
CREATE INDEX "idx_sellers_user_id" ON "public"."sellers" USING "btree" ("user_id");
CREATE INDEX "idx_shipping_rules_prefix" ON "public"."shipping_rules" USING "btree" ("cep_prefix");
CREATE INDEX "idx_suborders_order" ON "public"."sub_orders" USING "btree" ("order_id");
CREATE INDEX "idx_suborders_seller" ON "public"."sub_orders" USING "btree" ("seller_id");
CREATE INDEX "idx_support_assignee" ON "public"."support_tickets" USING "btree" ("assigned_to");
CREATE INDEX "idx_support_status" ON "public"."support_tickets" USING "btree" ("status");
CREATE INDEX "idx_wishlist_product_id" ON "public"."wishlist_items" USING "btree" ("product_id");
CREATE INDEX "idx_wishlist_user_id" ON "public"."wishlist_items" USING "btree" ("user_id");
CREATE OR REPLACE TRIGGER "trg_orders_status_history" AFTER INSERT OR UPDATE OF "status" ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."log_order_status_history"();
CREATE OR REPLACE TRIGGER "trg_posts_updated" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "trg_products_updated" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE OR REPLACE TRIGGER "trg_update_cart_timestamp" BEFORE UPDATE ON "public"."carts" FOR EACH ROW EXECUTE FUNCTION "public"."update_cart_timestamp"();
ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id");
ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");
ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."gift_redemptions"
    ADD CONSTRAINT "gift_redemptions_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."gift_redemptions"
    ADD CONSTRAINT "gift_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."order_store_totals"
    ADD CONSTRAINT "order_store_totals_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");
ALTER TABLE ONLY "public"."order_store_totals"
    ADD CONSTRAINT "order_store_totals_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");
ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");
ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."product_moderation_logs"
    ADD CONSTRAINT "product_moderation_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."product_moderation_logs"
    ADD CONSTRAINT "product_moderation_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_order_item_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."product_reviews"
    ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");
ALTER TABLE ONLY "public"."seller_audit_logs"
    ADD CONSTRAINT "seller_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."seller_audit_logs"
    ADD CONSTRAINT "seller_audit_logs_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."seller_metrics"
    ADD CONSTRAINT "seller_metrics_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."sellers"
    ADD CONSTRAINT "sellers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."shipment_items"
    ADD CONSTRAINT "shipment_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id");
ALTER TABLE ONLY "public"."shipment_items"
    ADD CONSTRAINT "shipment_items_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id");
ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");
ALTER TABLE ONLY "public"."shipments"
    ADD CONSTRAINT "shipments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id");
ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id");
ALTER TABLE ONLY "public"."sub_orders"
    ADD CONSTRAINT "sub_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."sub_orders"
    ADD CONSTRAINT "sub_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id");
ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");
ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_insert_authed" ON "public"."analytics_events" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));
CREATE POLICY "analytics_select_admin_or_seller" ON "public"."analytics_events" FOR SELECT USING ((("public"."current_role"() = 'admin'::"public"."user_role") OR (("seller_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."sellers" "s"
  WHERE (("s"."id" = "analytics_events"."seller_id") AND ("s"."user_id" = "auth"."uid"()))))) OR ("user_id" = "auth"."uid"())));
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_insert_admin" ON "public"."notifications" FOR INSERT WITH CHECK (("public"."current_role"() = 'admin'::"public"."user_role"));
CREATE POLICY "notifications_select_recipient" ON "public"."notifications" FOR SELECT USING ((("recipient_user_id" = "auth"."uid"()) OR ("public"."current_role"() = 'admin'::"public"."user_role")));
CREATE POLICY "notifications_update_own" ON "public"."notifications" FOR UPDATE USING ((("recipient_user_id" = "auth"."uid"()) OR ("public"."current_role"() = 'admin'::"public"."user_role")));
ALTER TABLE "public"."order_status_history" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_status_insert_admin" ON "public"."order_status_history" FOR INSERT WITH CHECK (("public"."current_role"() = 'admin'::"public"."user_role"));
CREATE POLICY "order_status_select_owner" ON "public"."order_status_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_status_history"."order_id") AND ("o"."customer_id" = "auth"."uid"())))));
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_insert_customer" ON "public"."orders" FOR INSERT WITH CHECK ((("customer_id" = "auth"."uid"()) OR ("public"."current_role"() = 'admin'::"public"."user_role")));
CREATE POLICY "orders_select_customer_or_admin" ON "public"."orders" FOR SELECT USING ((("customer_id" = "auth"."uid"()) OR ("public"."current_role"() = 'admin'::"public"."user_role")));
ALTER TABLE "public"."product_reviews" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_reviews_delete_own" ON "public"."product_reviews" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "product_reviews_insert_own" ON "public"."product_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "product_reviews_select_public" ON "public"."product_reviews" FOR SELECT USING (true);
CREATE POLICY "product_reviews_update_own" ON "public"."product_reviews" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read_published" ON "public"."products" FOR SELECT USING ((("status" = 'published'::"text") OR ("public"."current_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM "public"."sellers" "s"
  WHERE (("s"."id" = "products"."seller_id") AND ("s"."user_id" = "auth"."uid"()))))));
CREATE POLICY "products_seller_insert" ON "public"."products" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sellers" "s"
  WHERE (("s"."id" = "products"."seller_id") AND ("s"."user_id" = "auth"."uid"())))));
CREATE POLICY "products_seller_update_or_admin" ON "public"."products" FOR UPDATE USING ((("public"."current_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM "public"."sellers" "s"
  WHERE (("s"."id" = "products"."seller_id") AND ("s"."user_id" = "auth"."uid"()))))));
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_admin_all" ON "public"."profiles" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));
CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR ("public"."current_role"() = 'admin'::"public"."user_role")));
CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING ((("id" = "auth"."uid"()) OR ("public"."current_role"() = 'admin'::"public"."user_role")));
ALTER TABLE "public"."search_synonyms" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_synonyms_select_public" ON "public"."search_synonyms" FOR SELECT USING (true);
ALTER TABLE "public"."sellers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sellers_insert_self" ON "public"."sellers" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "sellers_select" ON "public"."sellers" FOR SELECT USING ((("public"."current_role"() = 'admin'::"public"."user_role") OR ("user_id" = "auth"."uid"()) OR ("status" = 'active'::"text")));
CREATE POLICY "sellers_update_self_or_admin" ON "public"."sellers" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("public"."current_role"() = 'admin'::"public"."user_role")));
ALTER TABLE "public"."sub_orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suborders_insert_customer" ON "public"."sub_orders" FOR INSERT WITH CHECK ((("public"."current_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "sub_orders"."order_id") AND ("o"."customer_id" = "auth"."uid"()))))));
CREATE POLICY "suborders_select_seller_or_admin" ON "public"."sub_orders" FOR SELECT USING ((("public"."current_role"() = 'admin'::"public"."user_role") OR (EXISTS ( SELECT 1
   FROM "public"."sellers" "s"
  WHERE (("s"."id" = "sub_orders"."seller_id") AND ("s"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "sub_orders"."order_id") AND ("o"."customer_id" = "auth"."uid"()))))));
CREATE POLICY "wishlist_delete_own" ON "public"."wishlist_items" FOR DELETE USING (("auth"."uid"() = "user_id"));
CREATE POLICY "wishlist_insert_own" ON "public"."wishlist_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
ALTER TABLE "public"."wishlist_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist_select_own" ON "public"."wishlist_items" FOR SELECT USING (("auth"."uid"() = "user_id"));
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON FUNCTION "public"."current_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_role"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_admin_kpis"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_kpis"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_kpis"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."log_order_status_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_order_status_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_order_status_history"() TO "service_role";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_cart_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cart_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cart_timestamp"() TO "service_role";
GRANT ALL ON TABLE "public"."analytics_daily" TO "anon";
GRANT ALL ON TABLE "public"."analytics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_daily" TO "service_role";
GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";
GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";
GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";
GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";
GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";
GRANT ALL ON TABLE "public"."gift_redemptions" TO "anon";
GRANT ALL ON TABLE "public"."gift_redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."gift_redemptions" TO "service_role";
GRANT ALL ON TABLE "public"."gifts" TO "anon";
GRANT ALL ON TABLE "public"."gifts" TO "authenticated";
GRANT ALL ON TABLE "public"."gifts" TO "service_role";
GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";
GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";
GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";
GRANT ALL ON TABLE "public"."order_status_history" TO "anon";
GRANT ALL ON TABLE "public"."order_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."order_status_history" TO "service_role";
GRANT ALL ON TABLE "public"."order_store_totals" TO "anon";
GRANT ALL ON TABLE "public"."order_store_totals" TO "authenticated";
GRANT ALL ON TABLE "public"."order_store_totals" TO "service_role";
GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";
GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";
GRANT ALL ON TABLE "public"."payouts" TO "anon";
GRANT ALL ON TABLE "public"."payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."payouts" TO "service_role";
GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";
GRANT ALL ON TABLE "public"."product_moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."product_moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."product_moderation_logs" TO "service_role";
GRANT ALL ON TABLE "public"."product_reviews" TO "anon";
GRANT ALL ON TABLE "public"."product_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."product_reviews" TO "service_role";
GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."promotions" TO "anon";
GRANT ALL ON TABLE "public"."promotions" TO "authenticated";
GRANT ALL ON TABLE "public"."promotions" TO "service_role";
GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";
GRANT ALL ON TABLE "public"."search_synonyms" TO "anon";
GRANT ALL ON TABLE "public"."search_synonyms" TO "authenticated";
GRANT ALL ON TABLE "public"."search_synonyms" TO "service_role";
GRANT ALL ON TABLE "public"."seller_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."seller_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_audit_logs" TO "service_role";
GRANT ALL ON TABLE "public"."seller_metrics" TO "anon";
GRANT ALL ON TABLE "public"."seller_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_metrics" TO "service_role";
GRANT ALL ON TABLE "public"."sellers" TO "anon";
GRANT ALL ON TABLE "public"."sellers" TO "authenticated";
GRANT ALL ON TABLE "public"."sellers" TO "service_role";
GRANT ALL ON TABLE "public"."shipment_items" TO "anon";
GRANT ALL ON TABLE "public"."shipment_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_items" TO "service_role";
GRANT ALL ON TABLE "public"."shipments" TO "anon";
GRANT ALL ON TABLE "public"."shipments" TO "authenticated";
GRANT ALL ON TABLE "public"."shipments" TO "service_role";
GRANT ALL ON TABLE "public"."shipping_rules" TO "anon";
GRANT ALL ON TABLE "public"."shipping_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_rules" TO "service_role";
GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";
GRANT ALL ON TABLE "public"."sub_orders" TO "anon";
GRANT ALL ON TABLE "public"."sub_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."sub_orders" TO "service_role";
GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";
GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";
GRANT ALL ON TABLE "public"."wishlist_items" TO "anon";
GRANT ALL ON TABLE "public"."wishlist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist_items" TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
