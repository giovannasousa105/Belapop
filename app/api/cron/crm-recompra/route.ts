import { NextRequest, NextResponse } from "next/server";

import { runSafe } from "@/lib/jobRunner";
import { verificarRecompra } from "@/lib/crm/flows/editoriais";

export const runtime     = "nodejs";
export const maxDuration = 25;

/**
 * Recompra assistida — diário às 14h UTC (horário de compra).
 * Schedule: 0 14 * * *
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const resultado = await runSafe("verificarRecompra", verificarRecompra);
  return NextResponse.json(resultado ?? { ok: true });
}
