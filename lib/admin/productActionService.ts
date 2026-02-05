import { SupabaseClient } from "@supabase/supabase-js";

import { createNotification } from "@/lib/notifications/notificationService";
import { mapProductRow, PRODUCT_SELECT_FIELDS } from "@/lib/seller/productMapper";

export type ProductActionType = "approve" | "needs_adjustment" | "reject";

export type ProductActionPayload = {
  action: ProductActionType;
  notes?: string;
  reasons?: string[];
};

const ACTIONS: Record<ProductActionType, { updates: Record<string, unknown> | ((payload: ProductActionPayload) => Record<string, unknown>); notification: (productId: string, payload: ProductActionPayload) => {
  type: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  metadata?: Record<string, unknown>;
}; }> = {
  approve: {
    updates: {
      status: "published",
      curated: true,
      review_notes: null,
      curation_feedback: null
    },
    notification: (productId) => ({
      type: "product_approved",
      title: "Seu produto foi aprovado",
      body: "Ele já está disponível na curadoria BelaPop.",
      ctaLabel: "Ver produto",
      ctaHref: `/seller/products/${productId}/edit`,
      metadata: { productId }
    })
  },
  needs_adjustment: {
    updates: (payload) => ({
      status: "needs_adjustment",
      curated: false,
      review_notes: payload.notes?.trim() ?? null
    }),
    notification: (productId, payload) => ({
      type: "product_needs_adjustment",
      title: "Ajustes solicitados",
      body: "Pequenos detalhes vão deixar seu produto pronto para publicação.",
      ctaLabel: "Revisar produto",
      ctaHref: `/seller/products/${productId}/edit`,
      metadata: {
        productId,
        reviewNotes: payload.notes?.trim() ?? null,
        reasons: payload.reasons ?? []
      }
    })
  },
  reject: {
    updates: (payload) => ({
      status: "rejected",
      curated: false,
      review_notes: payload.notes?.trim() ?? null
    }),
    notification: (productId, payload) => ({
      type: "product_rejected",
      title: "Produto não aprovado no momento",
      body: `Você pode revisar e reenviar quando desejar.${payload.notes ? ` Notas: ${payload.notes.trim()}` : ""}`,
      ctaLabel: "Ver detalhes",
      ctaHref: `/seller/products/${productId}/edit`,
      metadata: {
        productId,
        reviewNotes: payload.notes?.trim() ?? null,
        reasons: payload.reasons ?? []
      }
    })
  }
};

const getSellerOwner = async (supabase: SupabaseClient, sellerId: string) => {
  const { data } = await supabase
    .from("sellers")
    .select("id,user_id")
    .eq("id", sellerId)
    .maybeSingle();
  return data;
};

export async function performProductAction(
  supabase: SupabaseClient,
  productId: string,
  payload: ProductActionPayload
) {
  const config = ACTIONS[payload.action];
  const updates = typeof config.updates === "function" ? config.updates(payload) : config.updates;

  const { data: row, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .select(PRODUCT_SELECT_FIELDS)
    .maybeSingle();

  if (error || !row) {
    throw new Error("Não foi possível atualizar o produto.");
  }

  const seller = await getSellerOwner(supabase, row.seller_id);
  if (!seller || !seller.user_id) {
    throw new Error("Loja não vinculada a um usuário válido.");
  }

  const notification = config.notification(productId, payload);
  await createNotification({
    recipientUserId: seller.user_id,
    sellerId: seller.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    ctaLabel: notification.ctaLabel,
    ctaHref: notification.ctaHref,
    metadata: notification.metadata
  });

  return mapProductRow(row);
}
