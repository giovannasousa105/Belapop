import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ scan_id: string }> }
) {
  const { scan_id } = await context.params;

  if (!scan_id || typeof scan_id !== "string") {
    return NextResponse.json({ error: "scan_id inválido." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  // Buscar scan principal
  const { data: scan, error: scanErr } = await admin
    .from("skin_scans")
    .select("id, skin_id, status, focos, duracao_ms, user_id, session_bp, criado_em")
    .eq("id", scan_id)
    .maybeSingle();

  if (scanErr || !scan) {
    return NextResponse.json({ error: "Scan não encontrado." }, { status: 404 });
  }

  if (scan.status !== "CONCLUIDO") {
    return NextResponse.json(
      {
        error: "Resultado ainda não disponível.",
        status: scan.status,
      },
      { status: 202 }
    );
  }

  // Verificar acesso
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isOwner =
    (user && (scan.user_id as string | null) === user.id) ||
    !(scan.user_id); // anônimo

  if (!isOwner) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  // Buscar dados associados em paralelo
  const [profileResult, rotinasResult, cvResult, eventosResult] = await Promise.all([
    admin
      .from("scan_skin_profiles")
      .select("skin_profile, perfil_resumo")
      .eq("skin_scan_id", scan_id)
      .maybeSingle(),
    admin
      .from("scan_rotinas")
      .select("periodo, rotina")
      .eq("skin_scan_id", scan_id),
    admin
      .from("scan_cv_results")
      .select("feature_vector, duracao_cv_ms")
      .eq("skin_scan_id", scan_id)
      .maybeSingle(),
    admin
      .from("scan_eventos")
      .select("etapa, duracao_ms")
      .eq("skin_scan_id", scan_id)
      .order("criado_em", { ascending: true }),
  ]);

  const profile = profileResult.data;
  const rotinas = rotinasResult.data ?? [];
  const cv = cvResult.data;
  const eventos = eventosResult.data ?? [];

  const rotinaMap: Record<string, unknown> = {};
  for (const r of rotinas) {
    rotinaMap[r.periodo as string] = r.rotina;
  }

  return NextResponse.json({
    scan_id: scan.id,
    skin_id: scan.skin_id,
    focos: scan.focos,
    duracao_ms: scan.duracao_ms,
    criado_em: scan.criado_em,

    skin_profile: profile?.skin_profile ?? null,
    narrativa: profile?.perfil_resumo ?? null,

    rotina_manha: rotinaMap["manha"] ?? null,
    rotina_noite: rotinaMap["noite"] ?? null,

    cv_summary: cv
      ? {
          face_detectada: (cv.feature_vector as Record<string, unknown>)?.face_detectada,
          fitzpatrick: (cv.feature_vector as Record<string, unknown>)?.fitzpatrick_estimado,
          flags: (cv.feature_vector as Record<string, unknown>)?.flags,
          duracao_cv_ms: cv.duracao_cv_ms,
        }
      : null,

    etapas_sla: eventos.map((e) => ({
      etapa: e.etapa,
      duracao_ms: e.duracao_ms,
    })),
  });
}
