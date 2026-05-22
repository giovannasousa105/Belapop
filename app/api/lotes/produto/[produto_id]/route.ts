import { NextRequest, NextResponse } from "next/server";

import { buildLoteDisplayConfig } from "@/lib/lote/displayConfig";
import type { Lote, LoteDisplayConfig } from "@/lib/lote/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Module-level TTL cache (best-effort; resets on cold start)
const cache = new Map<string, { data: LoteDisplayConfig; expiresAt: number }>();
const CACHE_TTL_MS = 30_000;

function buildNeutralConfig(): LoteDisplayConfig {
  return {
    mostrar_contador: false,
    texto_estoque: null,
    texto_esgotado: null,
    mostrar_waitlist: false,
    urgencia_level: "none",
    status: "ABERTO",
    data_reposicao: null,
    qtd_disponivel: null,
    lote_id: "",
  };
}

function getCached(key: string): LoteDisplayConfig | null {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: LoteDisplayConfig): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ produto_id: string }> }
) {
  const { produto_id: produtoId } = await context.params;

  const cached = getCached(produtoId);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=30" },
    });
  }

  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from("lotes")
    .select(
      "id,produto_id,seller_id,sku_externo,qtd_total,qtd_disponivel,qtd_reservada,limiar_alerta_pct,status,verificado_em,aberto_em,encerrado_em,data_reposicao,notas_internas,criado_em"
    )
    .eq("produto_id", produtoId)
    .not("status", "eq", "SUSPENSO")
    .order("aberto_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[lotes/produto] lotes unavailable; returning neutral config", {
      produtoId,
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(buildNeutralConfig(), {
      headers: {
        "X-Lotes-Mode": "fallback",
        "Cache-Control": "public, max-age=30",
      },
    });
  }

  if (!data) {
    const config = buildNeutralConfig();
    setCached(produtoId, config);
    return NextResponse.json(config, {
      headers: {
        "X-Lotes-Mode": "not-found",
        "Cache-Control": "public, max-age=30",
      },
    });
  }

  const config = buildLoteDisplayConfig(data as Lote);
  setCached(produtoId, config);

  return NextResponse.json(config, {
    headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=30" },
  });
}
