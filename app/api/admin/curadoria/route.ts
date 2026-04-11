import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";
import { fetchDiscoveryCurationAdminDataUncached } from "@/lib/admin/discoveryCuration";
import { CURATION_KINDS, type DiscoveryCollectionKind } from "@/lib/admin/discoveryCuration.shared";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACTIVE_PRODUCT_STATUSES = ["active", "published"];
const COLLECTION_STATUSES = ["draft", "published", "archived"] as const;

type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

const normalizeKind = (value: unknown): DiscoveryCollectionKind | null =>
  typeof value === "string" && (CURATION_KINDS as readonly string[]).includes(value)
    ? (value as DiscoveryCollectionKind)
    : null;

const normalizeStatus = (value: unknown): CollectionStatus | null =>
  typeof value === "string" && (COLLECTION_STATUSES as readonly string[]).includes(value)
    ? (value as CollectionStatus)
    : null;

const uniqueUuidList = (value: unknown) =>
  Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => UUID_REGEX.test(item))
    )
  );

const parseOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, numeric));
};

const parseOptionalDate = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

function revalidateDiscoverySurfaces() {
  revalidatePath("/", "page");
  revalidatePath("/catalogo", "page");
  revalidatePath("/products", "page");
  revalidatePath("/admin/curadoria", "page");
  revalidatePath("/admin/catalogo", "page");
}

export async function GET(request: Request) {
  const auth = await ensureAdminRequest(request as any);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(request.url);
    const kind = normalizeKind(url.searchParams.get("kind"));
    const data = await fetchDiscoveryCurationAdminDataUncached();

    return NextResponse.json({
      kinds: data.kinds,
      collections: kind ? data.collections.filter((item) => item.kind === kind) : data.collections,
      availableProducts: data.availableProducts
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar a curadoria discovery.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await ensureAdminRequest(request as any);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = getSupabaseAdminClient();
  const body = (await request.json().catch(() => null)) as
    | {
        action?: string;
        kind?: string;
        collectionIds?: string[];
        collectionId?: string;
        productIds?: string[];
      }
    | null;

  const action = typeof body?.action === "string" ? body.action : null;

  if (action === "reorder_collections") {
    const kind = normalizeKind(body?.kind);
    if (!kind) {
      return NextResponse.json({ error: "Kind invalido." }, { status: 400 });
    }

    const collectionIds = uniqueUuidList(body?.collectionIds);
    const lookup = await admin
      .from("collections")
      .select("id,kind")
      .in("id", collectionIds);

    if (lookup.error) {
      return NextResponse.json({ error: lookup.error.message }, { status: 500 });
    }

    if ((lookup.data ?? []).length !== collectionIds.length) {
      return NextResponse.json({ error: "Algumas colecoes nao foram encontradas." }, { status: 400 });
    }

    if ((lookup.data ?? []).some((item) => item.kind !== kind)) {
      return NextResponse.json({ error: "Todas as colecoes precisam pertencer ao mesmo kind." }, { status: 400 });
    }

    const total = collectionIds.length;
    for (let index = 0; index < collectionIds.length; index += 1) {
      const id = collectionIds[index];
      const boost = Math.max(0, 100 - index);
      const payload =
        kind === "trend"
          ? { trend_boost: boost, editorial_boost: boost }
          : { editorial_boost: boost };
      const update = await admin.from("collections").update(payload).eq("id", id);
      if (update.error) {
        return NextResponse.json({ error: update.error.message }, { status: 500 });
      }
    }

    revalidateDiscoverySurfaces();
    return NextResponse.json({ ok: true, action, kind, count: total });
  }

  if (action === "set_collection_products") {
    const collectionId = typeof body?.collectionId === "string" ? body.collectionId.trim() : "";
    if (!UUID_REGEX.test(collectionId)) {
      return NextResponse.json({ error: "collectionId invalido." }, { status: 400 });
    }

    const productIds = uniqueUuidList(body?.productIds);

    if (productIds.length > 96) {
      return NextResponse.json({ error: "Limite maximo de 96 produtos por colecao." }, { status: 400 });
    }

    const [collectionLookup, productsLookup, existingLinks] = await Promise.all([
      admin.from("collections").select("id").eq("id", collectionId).maybeSingle(),
      productIds.length
        ? admin.from("products").select("id,status").in("id", productIds).in("status", ACTIVE_PRODUCT_STATUSES)
        : Promise.resolve({ data: [], error: null }),
      admin.from("collection_products").select("product_id").eq("collection_id", collectionId)
    ]);

    if (collectionLookup.error) {
      return NextResponse.json({ error: collectionLookup.error.message }, { status: 500 });
    }
    if (!collectionLookup.data) {
      return NextResponse.json({ error: "Colecao nao encontrada." }, { status: 404 });
    }
    if (productsLookup.error) {
      return NextResponse.json({ error: productsLookup.error.message }, { status: 500 });
    }
    if (existingLinks.error) {
      return NextResponse.json({ error: existingLinks.error.message }, { status: 500 });
    }

    if ((productsLookup.data ?? []).length !== productIds.length) {
      return NextResponse.json({ error: "A colecao aceita apenas produtos ativos/publicados." }, { status: 400 });
    }

    const existingIds = new Set((existingLinks.data ?? []).map((item) => String(item.product_id)));
    const keepIds = new Set(productIds);
    const deleteIds = Array.from(existingIds).filter((id) => !keepIds.has(id));

    if (deleteIds.length) {
      const remove = await admin
        .from("collection_products")
        .delete()
        .eq("collection_id", collectionId)
        .in("product_id", deleteIds);
      if (remove.error) {
        return NextResponse.json({ error: remove.error.message }, { status: 500 });
      }
    }

    if (productIds.length) {
      const upsert = await admin.from("collection_products").upsert(
        productIds.map((productId, index) => ({
          collection_id: collectionId,
          product_id: productId,
          position: index + 1,
          editorial_boost: Math.max(0, 100 - index)
        })),
        { onConflict: "collection_id,product_id" }
      );

      if (upsert.error) {
        return NextResponse.json({ error: upsert.error.message }, { status: 500 });
      }
    }

    revalidateDiscoverySurfaces();
    return NextResponse.json({ ok: true, action, collectionId, count: productIds.length });
  }

  return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const auth = await ensureAdminRequest(request as any);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = getSupabaseAdminClient();
  const body = (await request.json().catch(() => null)) as
    | {
        collectionId?: string;
        title?: string;
        description?: string | null;
        coverImage?: string | null;
        status?: string;
        editorialBoost?: number;
        trendBoost?: number;
        publishedAt?: string | null;
      }
    | null;

  const collectionId = typeof body?.collectionId === "string" ? body.collectionId.trim() : "";
  if (!UUID_REGEX.test(collectionId)) {
    return NextResponse.json({ error: "collectionId invalido." }, { status: 400 });
  }

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Titulo obrigatorio." }, { status: 400 });
  }

  const status = normalizeStatus(body?.status);
  if (!status) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  const payload = {
    title,
    description: typeof body?.description === "string" ? body.description.trim() || null : null,
    cover_image: typeof body?.coverImage === "string" ? body.coverImage.trim() || null : null,
    status,
    editorial_boost: parseOptionalNumber(body?.editorialBoost) ?? 0,
    trend_boost: parseOptionalNumber(body?.trendBoost) ?? 0,
    published_at: parseOptionalDate(body?.publishedAt) ?? (status === "published" ? new Date().toISOString() : null)
  };

  const update = await admin.from("collections").update(payload).eq("id", collectionId);
  if (update.error) {
    return NextResponse.json({ error: update.error.message }, { status: 500 });
  }

  revalidateDiscoverySurfaces();
  return NextResponse.json({ ok: true, collectionId });
}


