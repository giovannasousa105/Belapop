import { NextResponse }           from "next/server";
import { registrarConsentimento } from "@/lib/lgpd/consentimentoService";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestIp }           from "@/lib/security/request";
import type { ConsentimentoTipo, ConsentimentoAcao } from "@/lib/lgpd/consentimentoService";

const TIPOS_VALIDOS = new Set<ConsentimentoTipo>([
  "COOKIES_ANALYTICS",
  "COOKIES_MARKETING",
  "EMAIL_MARKETING",
  "BIOMETRICO_SCAN",
  "COMPARTILHAMENTO_DADOS",
]);

const ACOES_VALIDAS = new Set<ConsentimentoAcao>(["CONCEDIDO", "REVOGADO"]);

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      tipos?: unknown;
      acao?:  unknown;
      session_id?: unknown;
    };

    const { tipos, acao, session_id } = body;

    // Validações
    if (!Array.isArray(tipos) || tipos.length === 0) {
      return NextResponse.json({ error: "tipos obrigatório." }, { status: 400 });
    }

    const tiposValidados = tipos.filter(
      (t): t is ConsentimentoTipo => typeof t === "string" && TIPOS_VALIDOS.has(t as ConsentimentoTipo),
    );

    if (!tiposValidados.length) {
      return NextResponse.json({ error: "Nenhum tipo válido." }, { status: 400 });
    }

    const acaoValidada = typeof acao === "string" && ACOES_VALIDAS.has(acao as ConsentimentoAcao)
      ? (acao as ConsentimentoAcao)
      : "CONCEDIDO";

    // Tentar obter user_id do contexto autenticado
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ip         = getRequestIp(req);
    const user_agent = req.headers.get("user-agent") ?? undefined;

    await registrarConsentimento({
      tipos:      tiposValidados,
      acao:       acaoValidada,
      user_id:    user?.id,
      session_id: typeof session_id === "string" ? session_id.slice(0, 128) : undefined,
      ip:         ip ?? undefined,
      user_agent,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[lgpd/consentimento]", err);
    return NextResponse.json({ error: "Erro ao registrar consentimento." }, { status: 500 });
  }
}
