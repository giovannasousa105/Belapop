import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

type CartSyncPayload = {
  items: unknown[];
  subtotalCents: number;
  anonId?: string | null;
  cartId?: string | null;
  userId?: string | null;
};

type PostgrestLikeError = {
  code?: string;
  message?: string;
  details?: string | null;
};

const normalizeAnonId = (value: string | null | undefined) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeSubtotalCents = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
};

const normalizeItems = (items: unknown) => (Array.isArray(items) ? items : []);

const isDuplicateUserIdError = (error: unknown) => {
  const pgError = error as PostgrestLikeError | null;
  if (!pgError) return false;
  if (pgError.code !== "23505") return false;
  return (
    pgError.message?.includes("carts_user_id") === true ||
    pgError.details?.includes("(user_id)=") === true
  );
};

const isDuplicateAnonIdError = (error: unknown) => {
  const pgError = error as PostgrestLikeError | null;
  if (!pgError) return false;
  if (pgError.code !== "23505") return false;
  return (
    pgError.message?.includes("carts_anon_id") === true ||
    pgError.details?.includes("(anon_id)=") === true
  );
};

const parsePayload = async (request: NextRequest): Promise<CartSyncPayload> => {
  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return { items: [], subtotalCents: 0 };
  }

  try {
    const parsed = JSON.parse(rawBody) as Partial<CartSyncPayload>;
    return {
      items: parsed.items ?? [],
      subtotalCents: parsed.subtotalCents ?? 0,
      anonId: parsed.anonId ?? null,
      cartId: parsed.cartId ?? null,
      userId: parsed.userId ?? null
    };
  } catch {
    throw new Error("invalid_json");
  }
};

const updateExistingUserCart = async (
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  resolvedUserId: string,
  basePayload: { items: unknown[]; subtotal_cents: number; status: string }
) => {
  const existingUserCart = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", resolvedUserId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingUserCart.error) throw existingUserCart.error;
  if (!existingUserCart.data?.id) return null;

  const updated = await supabase
    .from("carts")
    .update({
      ...basePayload,
      user_id: resolvedUserId,
      anon_id: null
    })
    .eq("id", existingUserCart.data.id)
    .select("id")
    .maybeSingle();

  if (updated.error) throw updated.error;
  return updated.data?.id ?? existingUserCart.data.id;
};

const updateOrCreateAnonCart = async (
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  anonId: string,
  basePayload: { items: unknown[]; subtotal_cents: number; status: string }
) => {
  const existingAnonCart = await supabase
    .from("carts")
    .select("id")
    .eq("anon_id", anonId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingAnonCart.error) throw existingAnonCart.error;

  if (existingAnonCart.data?.id) {
    const updated = await supabase
      .from("carts")
      .update({
        ...basePayload,
        user_id: null,
        anon_id: anonId
      })
      .eq("id", existingAnonCart.data.id)
      .select("id")
      .maybeSingle();

    if (updated.error) throw updated.error;
    return updated.data?.id ?? existingAnonCart.data.id;
  }

  const inserted = await supabase
    .from("carts")
    .insert({
      ...basePayload,
      user_id: null,
      anon_id: anonId
    })
    .select("id")
    .maybeSingle();

  if (inserted.error) {
    if (isDuplicateAnonIdError(inserted.error)) {
      // Race condition: another request inserted first.
      const fallbackLookup = await supabase
        .from("carts")
        .select("id")
        .eq("anon_id", anonId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackLookup.error) throw fallbackLookup.error;
      if (fallbackLookup.data?.id) {
        const fallbackUpdate = await supabase
          .from("carts")
          .update({
            ...basePayload,
            user_id: null,
            anon_id: anonId
          })
          .eq("id", fallbackLookup.data.id)
          .select("id")
          .maybeSingle();

        if (fallbackUpdate.error) throw fallbackUpdate.error;
        return fallbackUpdate.data?.id ?? fallbackLookup.data.id;
      }
    }
    throw inserted.error;
  }

  return inserted.data?.id ?? null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await parsePayload(request);
    const supabase = await getSupabaseServerClient();

    let resolvedUserId = body.userId ?? null;
    try {
      const authUser = await supabase.auth.getUser();
      if (authUser.data.user?.id) {
        resolvedUserId = authUser.data.user.id;
      }
    } catch (authError) {
      // Keep anonymous sync working even if auth lookup fails.
      console.warn("[cart/sync] auth lookup failed", authError);
    }

    const anonId = normalizeAnonId(body.anonId);

    if (!resolvedUserId && !anonId) {
      return NextResponse.json({ error: "Anon ID or user must be provided." }, { status: 400 });
    }

    const basePayload = {
      items: normalizeItems(body.items),
      subtotal_cents: normalizeSubtotalCents(body.subtotalCents),
      status: "active"
    };

    if (body.cartId) {
      const updateByIdPayload: Record<string, unknown> = {
        ...basePayload,
        user_id: resolvedUserId
      };
      if (resolvedUserId) {
        updateByIdPayload.anon_id = null;
      }

      const byId = await supabase
        .from("carts")
        .update(updateByIdPayload)
        .eq("id", body.cartId)
        .select("id")
        .maybeSingle();

      if (byId.error) {
        if (resolvedUserId && isDuplicateUserIdError(byId.error)) {
          const fallbackId = await updateExistingUserCart(supabase, resolvedUserId, basePayload);
          if (fallbackId) return NextResponse.json({ cartId: fallbackId });
        }
        if (!resolvedUserId && anonId && isDuplicateAnonIdError(byId.error)) {
          const fallbackId = await updateOrCreateAnonCart(supabase, anonId, basePayload);
          if (fallbackId) return NextResponse.json({ cartId: fallbackId });
        }
        throw byId.error;
      }
      return NextResponse.json({ cartId: byId.data?.id ?? body.cartId ?? null });
    }

    if (resolvedUserId) {
      // 1) Prefer existing user cart.
      const existingUserCartId = await updateExistingUserCart(
        supabase,
        resolvedUserId,
        basePayload
      );
      if (existingUserCartId) {
        return NextResponse.json({ cartId: existingUserCartId });
      }

      // 2) If user cart does not exist, promote anon cart to user cart.
      if (anonId) {
        const existingAnonCart = await supabase
          .from("carts")
          .select("id")
          .eq("anon_id", anonId)
          .maybeSingle();

        if (existingAnonCart.error) throw existingAnonCart.error;
        if (existingAnonCart.data?.id) {
          const promoted = await supabase
            .from("carts")
            .update({
              ...basePayload,
              user_id: resolvedUserId,
              anon_id: null
            })
            .eq("id", existingAnonCart.data.id)
            .is("user_id", null)
            .select("id")
            .maybeSingle();

          if (promoted.error) {
            if (isDuplicateUserIdError(promoted.error)) {
              const fallbackId = await updateExistingUserCart(
                supabase,
                resolvedUserId,
                basePayload
              );
              if (fallbackId) return NextResponse.json({ cartId: fallbackId });
            }
            throw promoted.error;
          }
          return NextResponse.json({ cartId: promoted.data?.id ?? existingAnonCart.data.id });
        }
      }

      // 3) Final fallback keyed by user_id (anon_id null avoids unique collisions).
      const upsertUserCart = await supabase
        .from("carts")
        .upsert(
          {
            ...basePayload,
            user_id: resolvedUserId,
            anon_id: null
          },
          {
            onConflict: "user_id"
          }
        )
        .select("id")
        .maybeSingle();

      if (upsertUserCart.error) {
        if (isDuplicateUserIdError(upsertUserCart.error)) {
          const fallbackId = await updateExistingUserCart(
            supabase,
            resolvedUserId,
            basePayload
          );
          if (fallbackId) return NextResponse.json({ cartId: fallbackId });
        }
        throw upsertUserCart.error;
      }
      return NextResponse.json({ cartId: upsertUserCart.data?.id ?? null });
    }

    // Guest flow keyed by anon_id.
    const anonCartId = await updateOrCreateAnonCart(supabase, anonId!, basePayload);
    return NextResponse.json({ cartId: anonCartId });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_json") {
      return NextResponse.json({ error: "Payload JSON invalido." }, { status: 400 });
    }
    console.error("[cart/sync]", error);
    return NextResponse.json(
      { error: "Nao foi possivel sincronizar o carrinho." },
      { status: 500 }
    );
  }
}
