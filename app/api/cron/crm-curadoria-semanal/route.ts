import { NextRequest, NextResponse } from "next/server";

import { runSafe } from "@/lib/jobRunner";
import { enviarCuradoriaSemanal } from "@/lib/crm/flows/editoriais";

export const runtime     = "nodejs";
export const maxDuration = 25;

/**
 * Curadoria semanal — toda segunda às 8h UTC.
 * Schedule: 0 8 * * 1
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const resultado = await runSafe("enviarCuradoriaSemanal", enviarCuradoriaSemanal);
  return NextResponse.json(resultado ?? { ok: true });
}
