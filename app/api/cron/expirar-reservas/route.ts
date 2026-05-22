import { NextRequest, NextResponse } from "next/server";
import { runSafe } from "@/lib/jobRunner";
import { expirarReservas } from "@/lib/jobs/expirarReservas";

export const runtime     = "nodejs";
export const maxDuration = 25;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const secret     = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const resultado = await runSafe("expirarReservas", expirarReservas);

  // SEMPRE 200 — Vercel marca non-2xx como falha e suspende o cron
  return NextResponse.json(resultado ?? { erro: "falha_capturada" });
}
