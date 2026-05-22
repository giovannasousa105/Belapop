import { NextRequest, NextResponse } from "next/server";

import type { ListaEsperaRequest } from "@/lib/lote/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ lote_id: string }> }
) {
  const { lote_id: loteId } = await context.params;

  let body: ListaEsperaRequest;
  try {
    body = (await request.json()) as ListaEsperaRequest;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "email inválido." }, { status: 400 });
  }

  const origem = typeof body.origem === "string" ? body.origem.trim() : "pdp";

  const admin = getSupabaseAdminClient();

  // Fetch the lote to get produto_id
  const { data: lote, error: loteError } = await admin
    .from("lotes")
    .select("id,produto_id,status")
    .eq("id", loteId)
    .maybeSingle();

  if (loteError) {
    return NextResponse.json({ error: loteError.message }, { status: 500 });
  }
  if (!lote) {
    return NextResponse.json({ error: "lote_not_found" }, { status: 404 });
  }
  if (!["ENCERRADO", "REPOSICAO_PREVISTA"].includes(String(lote.status))) {
    return NextResponse.json(
      { error: "lista_espera_not_applicable", status: lote.status },
      { status: 409 }
    );
  }

  // Upsert by (email, produto_id) — duplicate entries are silently merged
  const { error: upsertError } = await admin
    .from("lote_lista_espera")
    .upsert(
      {
        lote_id: loteId,
        produto_id: lote.produto_id,
        email,
        user_id: body.user_id ?? null,
        origem,
        criado_em: new Date().toISOString(),
      },
      { onConflict: "email,produto_id", ignoreDuplicates: false }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
