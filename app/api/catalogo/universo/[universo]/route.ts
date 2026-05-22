import { NextResponse } from "next/server";

import { buscarPorUniverso } from "@/lib/catalogo/catalogoService";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UniversoCatalogo, FiltrosBusca } from "@/lib/catalogo/catalogoTypes";

const UNIVERSOS_VALIDOS = new Set<string>([
  "rosto", "corpo", "cabelo", "perfumaria", "wellness",
]);

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ universo: string }> },
) {
  const { universo } = await params;

  if (!UNIVERSOS_VALIDOS.has(universo)) {
    return NextResponse.json({ error: "Universo inválido." }, { status: 400 });
  }

  try {
    const url      = new URL(req.url);
    const sp       = url.searchParams;
    const pagina   = Math.max(1, parseInt(sp.get("pagina") ?? "1", 10));
    const por_pagina = Math.min(48, parseInt(sp.get("por_pagina") ?? "24", 10));

    const filtros: Omit<FiltrosBusca, "universo"> = {
      query:        sp.get("q")    || undefined,
      ordenacao:   (sp.get("sort") || "relevancia") as FiltrosBusca["ordenacao"],
      curated:      sp.get("curated") === "1" || undefined,
      pagina,
      por_pagina,
    };

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const resultado = await buscarPorUniverso(
      universo as UniversoCatalogo,
      filtros,
      user?.id,
    );

    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[catalogo/universo]", err);
    return NextResponse.json({ error: "Erro ao buscar produtos." }, { status: 500 });
  }
}
