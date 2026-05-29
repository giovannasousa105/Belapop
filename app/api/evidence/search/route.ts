import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getEvidenceForAtivo } from "@/lib/evidence";

export const runtime = "nodejs";

/**
 * GET /api/evidence/search?q={ativo}&remote=true|false
 *
 * Retorna evidência científica para um ativo cosmético.
 * - Sem `remote`: apenas banco local (instantâneo).
 * - Com `remote=true`: adiciona PubMed + CrossRef (cacheado 24h).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const remote = searchParams.get("remote") === "true";

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Parâmetro 'q' obrigatório (mínimo 2 caracteres)." },
      { status: 400 }
    );
  }

  if (q.length > 120) {
    return NextResponse.json(
      { error: "Parâmetro 'q' muito longo (máximo 120 caracteres)." },
      { status: 400 }
    );
  }

  try {
    const evidence = await getEvidenceForAtivo(q, { remote });

    return NextResponse.json(evidence, {
      headers: {
        // Cache público por 24h — evidências científicas mudam pouco
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível obter evidências no momento." },
      { status: 500 }
    );
  }
}
