import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { createUUID } from "@/lib/utils";
import { mapProductRow, PRODUCT_SELECT_FIELDS, toDbStatus } from "@/lib/seller/productMapper";
import { ProductStatus, validateProductPayload } from "@/lib/seller/productValidation";
import { resolveSellerByUser } from "@/lib/seller/sellerHelper";

type ProductCreateBody = Record<string, unknown>;

type ContextResult =
  | { error: true; message: string; status: number }
  | { error: false; seller: { id: string } };

const buildProductRow = (
  payload: ProductCreateBody,
  sellerId: string,
  validated: ReturnType<typeof validateProductPayload>
) => {
  const priceValue = Number(payload.price ?? 0);
  const images = validated.images;
  const status: ProductStatus = validated.status;
  return {
    id: createUUID(),
    seller_id: sellerId,
    name: (payload.name ?? "").toString().trim(),
    description: (payload.description ?? "").toString().trim(),
    category: payload.category ?? null,
    price_cents: Math.round(priceValue * 100),
    currency: payload.currency ?? "BRL",
    images,
    highlights: payload.highlights ?? [],
    status: toDbStatus(status),
    weight_kg: Number(payload.weightKg ?? 0),
    width_cm: Number(payload.widthCm ?? 0),
    height_cm: Number(payload.heightCm ?? 0),
    length_cm: Number(payload.lengthCm ?? 0),
    stock_quantity: Number(payload.stockQuantity ?? 0),
    curated: false,
    image_tone: payload.imageTone ?? null,
    is_featured: payload.featured ? true : false,
    curation_feedback: payload.curationFeedback ?? null,
  };
};

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

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const context = await extractSeller(supabase, request);
  if (context.error) {
    return NextResponse.json({ error: context.message }, { status: context.status });
  }
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_FIELDS)
    .eq("seller_id", context.seller.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[seller/products] list failed", error);
    return NextResponse.json({ error: "Não foi possível carregar os produtos." }, { status: 500 });
  }
  return NextResponse.json({ products: (data ?? []).map(mapProductRow) });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const context = await extractSeller(supabase, request);
  if (context.error) {
    return NextResponse.json({ error: context.message }, { status: context.status });
  }
  const duplicateFrom = request.nextUrl.searchParams.get("duplicateFrom");
  if (duplicateFrom) {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT_FIELDS)
      .eq("id", duplicateFrom)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "Produto para duplicação não encontrado." }, { status: 404 });
    }
    if (data.seller_id !== context.seller.id) {
      return NextResponse.json({ error: "Operação negada." }, { status: 403 });
    }
    const { data: inserted, error: insertError } = await supabase
      .from("products")
      .insert([
        {
          ...data,
          id: createUUID(),
          seller_id: context.seller.id,
          status: "draft",
          curated: false,
          curation_feedback: null
        }
      ])
      .select(PRODUCT_SELECT_FIELDS)
      .maybeSingle();
    if (insertError || !inserted) {
      console.error("[seller/products] duplicate insert failed", insertError);
      return NextResponse.json({ error: "Não foi possível duplicar o produto." }, { status: 500 });
    }
    return NextResponse.json({ product: mapProductRow(inserted) });
  }
  let payload: ProductCreateBody;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  const validated = validateProductPayload(payload);
  if (validated.errors.length) {
    return NextResponse.json({ error: validated.errors.join(" ") }, { status: 400 });
  }
  const row = buildProductRow(payload, context.seller.id, validated);
  const { data: inserted, error } = await supabase
    .from("products")
    .insert([row])
    .select(PRODUCT_SELECT_FIELDS)
    .maybeSingle();
  if (error || !inserted) {
    console.error("[seller/products] insert failed", error);
    return NextResponse.json({ error: "Não foi possível salvar o produto." }, { status: 500 });
  }
  return NextResponse.json({ product: mapProductRow(inserted) });
}
