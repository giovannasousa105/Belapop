import { NextRequest, NextResponse } from "next/server";

import { ensurePartnerApiContext } from "@/lib/partner/auth";
import { isMissingTableError } from "@/lib/rbac/sellerAccessScope";

type ProductRow = {
  id: string;
  seller_id: string;
  name: string;
  slug: string | null;
  status: string;
  price_cents: number;
  stock_quantity: number;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toText = (value: unknown) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const parsePage = (value: string | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
};

const parsePageSize = (value: string | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(200, Math.max(1, Math.floor(parsed)));
};

const mapProductRow = (row: Record<string, unknown>): ProductRow => ({
  id: String(row.id ?? ""),
  seller_id: String(row.seller_id ?? ""),
  name: String(row.title ?? row.name ?? "Produto sem nome"),
  slug: toText(row.slug),
  status: String(row.status ?? "draft"),
  price_cents: toNumber(row.price_cents),
  stock_quantity: toNumber(row.stock_quantity ?? row.stock ?? 0),
  category: toText(row.category),
  created_at: toText(row.created_at),
  updated_at: toText(row.updated_at)
});

export async function GET(request: NextRequest) {
  const auth = await ensurePartnerApiContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = request.nextUrl.searchParams;
  const page = parsePage(params.get("page"));
  const pageSize = parsePageSize(params.get("page_size"));
  const status = params.get("status");
  const q = params.get("q");

  try {
    let query = auth.ctx.admin
      .from("products")
      .select("*")
      .eq("seller_id", auth.ctx.scope.sellerId)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (q) {
      const safe = q.replace(/[%]/g, "");
      const withTitle = await auth.ctx.admin
        .from("products")
        .select("*")
        .eq("seller_id", auth.ctx.scope.sellerId)
        .or(`name.ilike.%${safe}%,title.ilike.%${safe}%,slug.ilike.%${safe}%`)
        .order("created_at", { ascending: false });

      if (!withTitle.error) {
        query = auth.ctx.admin
          .from("products")
          .select("*")
          .eq("seller_id", auth.ctx.scope.sellerId)
          .or(`name.ilike.%${safe}%,title.ilike.%${safe}%,slug.ilike.%${safe}%`)
          .order("created_at", { ascending: false });
      } else if (withTitle.error.code === "42703" || withTitle.error.code === "PGRST204") {
        query = auth.ctx.admin
          .from("products")
          .select("*")
          .eq("seller_id", auth.ctx.scope.sellerId)
          .or(`name.ilike.%${safe}%,slug.ilike.%${safe}%`)
          .order("created_at", { ascending: false });
      } else if (!isMissingTableError(withTitle.error)) {
        throw new Error(withTitle.error.message ?? "Falha ao pesquisar produtos.");
      }
    }

    const result = await query;
    if (result.error) {
      if (isMissingTableError(result.error)) {
        return NextResponse.json({
          seller_id: auth.ctx.scope.sellerId,
          page,
          page_size: pageSize,
          total: 0,
          summary: {
            active: 0,
            low_stock: 0,
            out_of_stock: 0,
            pending_review: 0
          },
          items: []
        });
      }
      throw new Error(result.error.message ?? "Falha ao carregar produtos.");
    }

    const allRows = (result.data ?? []).map((row) => mapProductRow(row as Record<string, unknown>));
    const total = allRows.length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;

    const summary = allRows.reduce(
      (acc, row) => {
        const normalizedStatus = row.status.toLowerCase();
        const stock = row.stock_quantity;
        if (normalizedStatus === "published" || normalizedStatus === "active") acc.active += 1;
        if (normalizedStatus === "review" || normalizedStatus === "needs_adjustment") acc.pending_review += 1;
        if (stock <= 0) acc.out_of_stock += 1;
        if (stock > 0 && stock <= 5) acc.low_stock += 1;
        return acc;
      },
      {
        active: 0,
        low_stock: 0,
        out_of_stock: 0,
        pending_review: 0
      }
    );

    return NextResponse.json({
      seller_id: auth.ctx.scope.sellerId,
      page,
      page_size: pageSize,
      total,
      summary,
      items: allRows.slice(from, to)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar produtos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
