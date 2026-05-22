import { NextResponse } from "next/server";

import {
  listarAvaliacoes,
  registrarAvaliacao,
} from "@/lib/catalogo/catalogoService";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CriarAvaliacaoInput } from "@/lib/catalogo/catalogoTypes";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url        = new URL(req.url);
    const product_id = url.searchParams.get("product_id");
    const pagina     = Math.max(1, parseInt(url.searchParams.get("pagina") ?? "1", 10));
    const por_pagina = Math.min(50, parseInt(url.searchParams.get("por_pagina") ?? "20", 10));

    if (!product_id) {
      return NextResponse.json({ error: "product_id obrigatório." }, { status: 400 });
    }

    const resultado = await listarAvaliacoes(product_id, pagina, por_pagina);
    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[catalogo/avaliações GET]", err);
    return NextResponse.json({ error: "Erro ao listar avaliações." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json() as Partial<CriarAvaliacaoInput>;

    if (!body.product_id) {
      return NextResponse.json({ error: "product_id obrigatório." }, { status: 400 });
    }

    if (!body.nota || body.nota < 1 || body.nota > 5) {
      return NextResponse.json({ error: "nota deve estar entre 1 e 5." }, { status: 400 });
    }

    await registrarAvaliacao(user.id, body as CriarAvaliacaoInput);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[catalogo/avaliações POST]", err);
    return NextResponse.json({ error: "Erro ao registrar avaliação." }, { status: 500 });
  }
}
