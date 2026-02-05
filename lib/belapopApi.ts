const API_BASE =
  process.env.NEXT_PUBLIC_BELAPOP_API_URL ?? "http://127.0.0.1:8080";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Erro ao comunicar com o marketplace");
  }
  return res.json();
}

export type UserRole = "customer" | "seller" | "admin";

export interface ProductOut {
  id: string;
  store_id: string;
  title: string;
  price_cents: number;
  currency: string;
  is_active: boolean;
}

export interface CartItemLine {
  product_id: string;
  title: string;
  store_id: string;
  store_slug: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
}

export interface CartStoreLine {
  store_id: string;
  store_slug: string;
  items: CartItemLine[];
  subtotal_cents: number;
}

export interface CartView {
  user_id: string;
  subtotal_cents: number;
  by_store: Record<string, CartStoreLine>;
}

export interface QuoteStoreLine {
  store_id: string;
  store_slug: string;
  items_subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
}

export interface QuoteResponse {
  user_id: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  stores: QuoteStoreLine[];
}

export interface CheckoutResponse {
  order_id: string;
  payment_id: string;
  status: string;
  total_cents: number;
  shipments: Array<{
    store_id: string;
    store_slug: string;
    shipping_cents: number;
    status: string;
  }>;
  payment_details?: Record<string, unknown> | null;
}

export interface StripeCheckoutResponse {
  order_id: string;
  payment_id: string;
  amount_cents: number;
  currency: string;
  client_secret: string;
}

export interface OrderDetailResponse {
  order: {
    id: string;
    user_id: string;
    status: string;
    subtotal_cents: number;
    shipping_cents: number;
    discount_cents: number;
    total_cents: number;
    created_at: string;
  };
  items: Array<{
    id: string;
    store_id: string;
    product_id: string;
    title: string;
    unit_price_cents: number;
    quantity: number;
    line_total_cents: number;
  }>;
  shipments: Array<{
    id: string;
    store_id: string;
    status: string;
    shipping_cents: number;
    carrier: string | null;
    service_level: string | null;
    tracking_code: string | null;
  }>;
  payment: null | {
    id: string;
    status: string;
    amount_cents: number;
    provider: string | null;
    provider_ref: string | null;
  };
  store_totals: Array<{
    store_id: string;
    subtotal_cents: number;
    shipping_cents: number;
    discount_cents: number;
    total_cents: number;
  }>;
}

export interface UserOut {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}

export interface StoreOut {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
}

export interface PaymentStatusUpdate {
  status: string;
  provider_ref?: string;
}

export interface PromotionCreateInput {
  code: string;
  percent_off?: number;
  amount_off_cents?: number;
  min_subtotal_cents?: number;
}

export const belapopApi = {
  listProducts: () => request<ProductOut[]>("/products"),
  addCartItem: (body: { user_id: string; product_id: string; quantity: number }) =>
    request<{ ok: boolean }>("/cart/items", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCartItem: (body: { user_id: string; product_id: string; quantity: number }) =>
    request<{ ok: boolean }>("/cart/items", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getCart: (userId: string) => request<CartView>(`/cart/${userId}`),
  quote: (body: { user_id: string; postal_code: string }) =>
    request<QuoteResponse>("/checkout/quote", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  stripeCheckout: (body: { user_id: string; postal_code: string; coupon_code?: string }) =>
    request<StripeCheckoutResponse>("/checkout/stripe-intent", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  checkout: (body: {
    user_id: string;
    postal_code: string;
    provider?: string;
    coupon_code?: string;
    payment_method?: string;
    customer?: Record<string, unknown>;
    shipping_address?: Record<string, unknown>;
  }) =>
    request<CheckoutResponse>("/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getOrder: (orderId: string) => request<OrderDetailResponse>(`/orders/${orderId}`),
  createUser: (payload: { name: string; email: string; role?: UserRole }) =>
    request<UserOut>("/users", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        role: payload.role ?? "customer",
      }),
    }),
  createStore: (payload: {
    owner_user_id: string;
    name: string;
    slug: string;
    description?: string;
  }) =>
    request<StoreOut>("/stores", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createProduct: (payload: {
    store_id: string;
    title: string;
    price_cents: number;
    description?: string;
  }) =>
    request<ProductOut>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createPromotion: (payload: PromotionCreateInput) =>
    request<{ id: string; code: string }>("/promotions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listPromotions: () => request<Array<Record<string, unknown>>>("/promotions"),
};
