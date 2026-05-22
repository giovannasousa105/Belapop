import { NextResponse }             from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient }     from "@/lib/supabase/admin";
import { consumeRateLimit }           from "@/lib/security/rateLimit";
import { exportarDadosUsuaria }       from "@/lib/lgpd/exclusaoService";

export const dynamic = "force-dynamic";

// Rate limit: 1 exportação por 30 dias por usuária (LGPD não exige mais que isso)
const JANELA_30_DIAS_S = 30 * 24 * 60 * 60;

export async function GET(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // ── Rate limit: 1 exportação por 30 dias ─────────────────────────────────
  const rl = await consumeRateLimit({
    scope:         "exportar-dados",
    actorKey:      user.id,
    windowSeconds: JANELA_30_DIAS_S,
    limit:         1,
  });

  if (!rl.allowed) {
    const resetDate = new Date(rl.resetAt).toLocaleDateString("pt-BR");
    return NextResponse.json(
      {
        error:    "Limite de exportações atingido.",
        mensagem: `Você já exportou seus dados recentemente. Próxima exportação disponível em ${resetDate}.`,
      },
      { status: 429 },
    );
  }

  // ── Registrar solicitação de exportação ───────────────────────────────────
  const admin = getSupabaseAdminClient();
  await admin.from("lgpd_solicitacoes").insert({
    user_id: user.id,
    tipo:    "EXPORTACAO",
    status:  "PROCESSADO",
    processado_em: new Date().toISOString(),
  });

  // ── Exportar dados ────────────────────────────────────────────────────────
  let dados: Record<string, unknown>;
  try {
    dados = await exportarDadosUsuaria(user.id);
  } catch (err) {
    console.error("[exportar-dados]", err);
    return NextResponse.json({ error: "Erro ao exportar dados." }, { status: 500 });
  }

  const json     = JSON.stringify(dados, null, 2);
  const filename = `meus-dados-belapop-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(json, {
    headers: {
      "Content-Type":        "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
