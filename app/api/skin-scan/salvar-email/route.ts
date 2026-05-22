import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { enviarScanResultado } from "@/lib/crm/flows/transacionais";

export const runtime = "nodejs";

/**
 * POST /api/skin-scan/salvar-email
 * body: { scan_id, email }
 *
 * Associa um e-mail a um scan anônimo para envio do Skin ID por e-mail.
 * Para usuárias autenticadas: e-mail já está no perfil (não usar esta rota).
 */
export async function POST(request: NextRequest) {
  let body: { scan_id?: string; email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { scan_id, email } = body;

  if (!scan_id || typeof scan_id !== "string") {
    return NextResponse.json({ error: "scan_id obrigatório." }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  const { data: scan } = await admin
    .from("skin_scans")
    .select("id, skin_id, status")
    .eq("id", scan_id)
    .eq("status", "CONCLUIDO")
    .maybeSingle();

  if (!scan) {
    return NextResponse.json(
      { error: "Scan não encontrado ou ainda em processamento." },
      { status: 404 }
    );
  }

  // Buscar dados do perfil para o e-mail
  const { data: profile } = await admin
    .from("scan_skin_profiles")
    .select("skin_profile")
    .eq("skin_scan_id", scan_id)
    .maybeSingle();

  const skinProfile = profile?.skin_profile as
    | { tipo_pele?: string; nivel_sensibilidade?: number; ativos_recomendados?: string[] }
    | null;

  // Enfileirar e-mail de resultado (fire-and-forget)
  void enviarScanResultado({
    user_id: email, // usuária anônima — usar email como ID
    email,
    scan_id,
    tipo_pele: skinProfile?.tipo_pele,
    nivel_sensibilidade: skinProfile?.nivel_sensibilidade,
    ativos_recomendados: skinProfile?.ativos_recomendados,
  }).catch((err: unknown) => {
    console.error("[salvar-email] enviarScanResultado falhou:", err);
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
