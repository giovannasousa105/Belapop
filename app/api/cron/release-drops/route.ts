import { NextRequest, NextResponse } from "next/server";
import { runSafe } from "@/lib/jobRunner";
import { expirarReservas } from "@/lib/jobs/expirarReservas";
import { sincronizarStatusDrops } from "@/lib/drops/queries.server";

export const runtime     = "nodejs";
export const maxDuration = 25;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  // Expirar reservas vencidas (TTL 30 min para drops, 15 min para lotes normais)
  const expiracaoResultado = await runSafe("expirarReservas", expirarReservas);

  // Sincronizar status dos drops (scheduled→live, live→closed)
  let syncResultado: { ok: boolean; abertos: number; fechados: number } | null = null;
  try {
    syncResultado = await sincronizarStatusDrops();
  } catch (err) {
    syncResultado = { ok: false, abertos: 0, fechados: 0 };
    console.error("[release-drops] sincronizarStatusDrops falhou:", err);
  }

  // SEMPRE 200 — Vercel marca non-2xx como falha e suspende o cron
  return NextResponse.json({
    expiracao: expiracaoResultado ?? { erro: "falha_capturada" },
    drops:     syncResultado,
  });
}
