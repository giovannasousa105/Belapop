export type DropStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "closed"
  | "sold_out"
  | "fulfilling"
  | "delivered";

export type DropCanal = "site" | "circulo" | "ambos";

export interface Drop {
  id: string;
  number: number;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  opens_at: string | null;
  closes_at: string | null;
  status: DropStatus;
  sem_reposicao: boolean;
  canal: DropCanal;
  total_orders: number;
  gmv_cents: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DropItem {
  id: string;
  drop_id: string;
  product_id: string | null;
  lote_id: string | null;
  drop_price_cents: number;
  max_quantity: number;
  sold_quantity: number;
  fulfillment_eta_days: number;
  stripe_payment_link_url: string | null;
}

export interface DropItemWithProduct extends DropItem {
  products: {
    id: string;
    name: string;
    slug: string | null;
    price_cents: number | null;
    images: string[] | null;
  } | null;
}

export interface DropBroadcast {
  id: string;
  drop_id: string;
  channel: string;
  sent_at: string | null;
  recipients_count: number | null;
  error_log: string | null;
  created_at: string;
}

export interface DropPublic {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  opens_at: string | null;
  closes_at: string | null;
  status: DropStatus;
  sem_reposicao: boolean;
  items: {
    id: string;
    drop_price_cents: number;
    max_quantity: number;
    sold_quantity: number;
    lote_id: string | null;
    fulfillment_eta_days: number;
    product: {
      name: string;
      images: string[] | null;
    } | null;
  }[];
}

export interface CheckoutDropResult {
  client_secret: string;
  price_cents: number;
  expira_em: string;
  reserva_id: string;
}
