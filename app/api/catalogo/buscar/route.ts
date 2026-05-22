import { NextResponse } from "next/server";

import { buscarProdutos } from "@/lib/catalogo/catalogoService";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FiltrosBusca, UniversoCatalogo } from "@/lib/catalogo/catalogoTypes";

function parseIntOr(val: string | null, fallback?: number): number | undefined {
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
}

function parseList(val: string | null): string[] | undefined {
  if (!val) return undefined;
  const arr = val.split(",").map((s) => s.trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url    = new URL(req.url);
    const params = url.searchParams;

    const filtros: FiltrosBusca = {
      query:            params.get("q")         || undefined,
      universo:        (params.get("universo")   || undefined) as UniversoCatalogo | undefined,
      necessidades:     parseList(params.get("necessidades")),
      tipo_pele:        parseList(params.get("tipo_pele")),
      sensibilidade_max: parseIntOr(params.get("sensibilidade_max")),
      passo_rotina:     params.get("passo")      || undefined,
      periodo:          params.get("periodo")    || undefined,
      preco_min:        parseIntOr(params.get("preco_min")),
      preco_max:        parseIntOr(params.get("preco_max")),
      curated:          params.get("curated") === "1" || undefined,
      ordenacao:       (params.get("sort")       || "relevancia") as FiltrosBusca["ordenacao"],
      pagina:           parseIntOr(params.get("pagina"), 1),
      por_pagina:       parseIntOr(params.get("por_pagina") ?? params.get("limit"), 24),
    };

    // user_id para wishlist + compat_scores
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const resultado = await buscarProdutos(filtros, user?.id);

    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[catalogo/buscar]", err);
    const pagina = parseIntOr(new URL(req.url).searchParams.get("pagina"), 1) ?? 1;
    const por_pagina = parseIntOr(new URL(req.url).searchParams.get("por_pagina"), 24) ?? 24;

    return NextResponse.json(
      {
        itens: [],
        total: 0,
        pagina,
        por_pagina,
        total_paginas: 0,
        warning: "catalogo_temporariamente_indisponivel",
      },
      { status: 200 }
    );
  }
}
