import { NextRequest, NextResponse } from "next/server";

import { runSafe } from "@/lib/jobRunner";
import { verificarCarrinhosAbandonados, verificarReativacao } from "@/lib/crm/flows/lifecycle";
import { enviarProgressoMensal } from "@/lib/crm/flows/pele";

export const runtime     = "nodejs";
export const maxDuration = 25;

/**
 * Cron principal do CRM — dispara fluxos de lifecycle e pele.
 * Schedule: 0 10 * * * (diário às 10h UTC)
 *
 * Executa em sequência para não sobrecarregar o Supabase.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const resultados = await Promise.allSettled([
    runSafe("verificarCarrinhosAbandonados", verificarCarrinhosAbandonados),
    runSafe("verificarReativacao", verificarReativacao),
    runSafe("enviarProgressoMensal", enviarProgressoMensal),
  ]);

  const resumo = resultados.map((r, i) => ({
    job: ["carrinho", "reativacao", "progresso_mensal"][i],
    ok: r.status === "fulfilled",
  }));

  return NextResponse.json({ ok: true, jobs: resumo });
}
