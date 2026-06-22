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

  const resultado = await runSafe("expirarReservas", expirarReservas);

  // Sincronizar status dos drops (scheduled→live, live→closed)
  let dropsSync: { ok: boolean; abertos: number; fechados: number } | null = null;
  try {
    dropsSync = await sincronizarStatusDrops();
  } catch (err) {
    console.error("[expirar-reservas] sincronizarStatusDrops falhou:", err);
  }

  // SEMPRE 200 — Vercel marca non-2xx como falha e suspende o cron
  return NextResponse.json({ reservas: resultado ?? { erro: "falha_capturada" }, drops: dropsSync });
}
