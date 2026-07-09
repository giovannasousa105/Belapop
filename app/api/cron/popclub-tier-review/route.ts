import { NextRequest, NextResponse } from "next/server";

import { runSafe } from "@/lib/jobRunner";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  enviarAvisoRebaixamento,
  processarRevisaoAnual,
} from "@/lib/popclub/tierEngine";

export const runtime = "nodejs";
export const maxDuration = 25;

async function revisaoTiers(): Promise<{
  revisoes: number;
  avisos: number;
  erros: string[];
}> {
  const admin = getSupabaseAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const erros: string[] = [];

  // Membros com avaliação anual devida hoje
  const { data: paraRevisar } = await admin
    .from("popclub_membros")
    .select("id")
    .eq("data_avaliacao_tier", hoje);

  let revisoes = 0;
  for (const membro of paraRevisar ?? []) {
    try {
      await processarRevisaoAnual(membro.id);
      revisoes++;
    } catch (err) {
      erros.push(`revisao:${membro.id}:${String(err)}`);
    }
  }

  // Membros com aviso de risco de rebaixamento devidos hoje
  const { data: paraAvisar } = await admin
    .from("popclub_membros")
    .select("id")
    .eq("data_rebaixamento_aviso", hoje);

  let avisos = 0;
  for (const membro of paraAvisar ?? []) {
    try {
      await enviarAvisoRebaixamento(membro.id);
      avisos++;
    } catch (err) {
      erros.push(`aviso:${membro.id}:${String(err)}`);
    }
  }

  return { revisoes, avisos, erros };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const resultado = await runSafe("popclub-tier-review", revisaoTiers);

  // SEMPRE 200 — Vercel marca non-2xx como falha e suspende o cron
  return NextResponse.json(resultado ?? { erro: "falha_capturada" });
}
