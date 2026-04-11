import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CartItemInput = {
  productId: string;
  quantity: number;
};

type CartAccessInput = {
  userId?: string | null;
  cartId?: string | null;
  anonId?: string | null;
};

type CartAccessResult = {
  cartId: string;
  items: CartItemInput[];
};

type CartRow = {
  id: string;
  user_id: string | null;
  anon_id: string | null;
  status: string | null;
  items: unknown;
};

const toError = (code: string, message: string) => {
  const error = new Error(message) as Error & { code?: string };
  error.code = code;
  return error;
};

const normalizeCartItems = (items: unknown): CartItemInput[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const raw = item as { productId?: unknown; quantity?: unknown } | null;
      const productId = String(raw?.productId ?? "").trim();
      const quantity = Math.max(1, Math.floor(Number(raw?.quantity ?? 0)));
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) return null;
      return { productId, quantity };
    })
    .filter((item): item is CartItemInput => Boolean(item));
};

const loadCartRow = async (input: CartAccessInput): Promise<CartRow | null> => {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from("carts")
    .select("id,user_id,anon_id,status,items")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (input.cartId) {
    query = query.eq("id", input.cartId);
  } else if (input.userId) {
    query = query.eq("user_id", input.userId);
  } else if (input.anonId) {
    query = query.eq("anon_id", input.anonId);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Falha ao carregar carrinho: ${error.message}`);
  }

  return (data ?? null) as CartRow | null;
};

export const loadCartItemsForCheckout = async (
  input: CartAccessInput
): Promise<CartAccessResult> => {
  const cart = await loadCartRow(input);
  if (!cart) {
    throw toError("CART_NOT_FOUND", "Carrinho nao encontrado.");
  }

  if (cart.status && cart.status !== "active") {
    throw toError("CART_INACTIVE", "Carrinho nao esta ativo.");
  }

  if (input.userId) {
    if (!cart.user_id || cart.user_id !== input.userId) {
      throw toError("CART_ACCESS_DENIED", "Carrinho nao pertence ao usuario.");
    }
  } else if (input.anonId) {
    if (!cart.anon_id || cart.anon_id !== input.anonId) {
      throw toError("CART_ACCESS_DENIED", "Carrinho anonimo nao autorizado.");
    }
  } else {
    throw toError("CART_ACCESS_DENIED", "Credenciais de carrinho ausentes.");
  }

  const items = normalizeCartItems(cart.items);
  if (items.length === 0) {
    throw toError("CART_EMPTY", "Carrinho sem itens validos.");
  }

  return {
    cartId: cart.id,
    items
  };
};
