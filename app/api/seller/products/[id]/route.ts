import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { mapProductRow, PRODUCT_SELECT_FIELDS, toDbStatus } from "@/lib/seller/productMapper";
import { ProductStatus, validateProductPayload } from "@/lib/seller/productValidation";
import { resolveSellerByUser } from "@/lib/seller/sellerHelper";

type ContextResult =
  | { error: true; message: string; status: number }
  | { error: false; seller: { id: string } };

const extractSeller = async (
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  request: NextRequest
): Promise<ContextResult> => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: true, message: "Autenticação necessária.", status: 401 };
  }
  const sellerResult = await resolveSellerByUser(supabase, user.id);
  if (sellerResult.error) {
    return { error: true, message: sellerResult.message, status: 403 };
  }
  return { error: false, seller: sellerResult.seller };
};

const buildUpdatePayload = (
  payload: Record<string, unknown>,
  sellerId: string,
  validated: ReturnType<typeof validateProductPayload>
) => {
  const priceValue = Number(payload.price ?? 0);
  const status: ProductStatus = validated.status;
  return {
    name: (payload.name ?? "").toString().trim(),
    description: (payload.description ?? "").toString().trim(),
    category: payload.category ?? null,
    price_cents: Math.round(priceValue * 100),
    currency: payload.currency ?? "BRL",
    images: validated.images,
    highlights: payload.highlights ?? [],
    status: toDbStatus(status),
    weight_kg: Number(payload.weightKg ?? 0),
    width_cm: Number(payload.widthCm ?? 0),
    height_cm: Number(payload.heightCm ?? 0),
    length_cm: Number(payload.lengthCm ?? 0),
    stock_quantity: Number(payload.stockQuantity ?? 0),
    curated: payload.curated ?? false,
    image_tone: payload.imageTone ?? null,
    is_featured: payload.featured ? true : false,
    curation_feedback: payload.curationFeedback ?? null,
    seller_id: sellerId
  };
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const params = await context.params;
  const authContext = await extractSeller(supabase, request);
  if (authContext.error) {
    return NextResponse.json({ error: authContext.message }, { status: authContext.status });
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS)
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  if (data.seller_id !== authContext.seller.id) {
    return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
  }

  return NextResponse.json({ product: mapProductRow(data) });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const params = await context.params;
  const authContext = await extractSeller(supabase, request);
  if (authContext.error) {
    return NextResponse.json({ error: authContext.message }, { status: authContext.status });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS)
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  if (existing.seller_id !== authContext.seller.id) {
    return NextResponse.json({ error: "Permissão negada." }, { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const validated = validateProductPayload(payload, { requireDimensions: true });
  if (validated.errors.length) {
    return NextResponse.json({ error: validated.errors.join(" ") }, { status: 400 });
  }

  const updates = buildUpdatePayload(payload, authContext.seller.id, validated);
  const { data: updated, error: updateError } = await supabase
    .from("products")
    .update(updates)
    .eq("id", params.id)
    .select(PRODUCT_SELECT_FIELDS)
    .maybeSingle();

  if (updateError || !updated) {
    console.error("[seller/products/[id]] update failed", updateError);
    return NextResponse.json({ error: "Não foi possível salvar as alterações." }, { status: 500 });
  }

  return NextResponse.json({ product: mapProductRow(updated) });
}
