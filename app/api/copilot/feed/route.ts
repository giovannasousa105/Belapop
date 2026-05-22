import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// ─── GET /api/copilot/feed ────────────────────────────────────────────────────
//
// Retorna até 3 interações pendentes, streak de rotina e dados de produto
// enriquecidos para NUDGE_RECOMPRA. Usado pelo useCopilotFeed hook.

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  const { data: rows, error } = await admin
    .from("copilot_interacoes")
    .select("id, tipo, status, payload, seed_snapshot, criado_em")
    .eq("user_id", user.id)
    .in("status", ["ENVIADA", "ENTREGUE"])
    .order("criado_em", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[copilot/feed] GET error", error.message);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  // Limitar a 3 cards, enriquecer NUDGE_RECOMPRA com dados do produto
  const interacoes = await Promise.all(
    (rows ?? []).slice(0, 3).map(async (row) => {
      if (row.tipo !== "NUDGE_RECOMPRA") return row;

      const meta = ((row.payload as Record<string, unknown> | null)?.metadata ?? {}) as Record<
        string,
        unknown
      >;
      const produto_id = meta.produto_id as string | undefined;
      if (!produto_id) return row;

      const [produtoResult, pedidoResult] = await Promise.all([
        admin
          .from("produtos")
          .select("id, name, hero_image_url, price_cents, slug, duracao_media_dias")
          .eq("id", produto_id)
          .single(),
        admin
          .from("pedidos")
          .select("criado_em")
          .eq("user_id", user.id)
          .eq("status", "ENTREGUE")
          .gte("criado_em", new Date(Date.now() - 120 * 86400000).toISOString())
          .order("criado_em", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (produtoResult.error || !produtoResult.data) return row;

      const produto = produtoResult.data;
      let dias_restantes: number | null = null;

      if (pedidoResult.data && produto.duracao_media_dias) {
        const diasUsados = Math.floor(
          (Date.now() - new Date(pedidoResult.data.criado_em as string).getTime()) / 86400000
        );
        dias_restantes = Math.max(0, produto.duracao_media_dias - diasUsados);
      }

      return { ...row, produto: { ...produto, dias_restantes } };
    })
  );

  const streak = await calcularStreak(user.id, admin);

  return NextResponse.json({ ok: true, interacoes, streak });
}

// ─── PATCH /api/copilot/feed ──────────────────────────────────────────────────
//
// Marca interações como LIDA. Chamado pelo hook ao montar o feed.

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const parsed = z
    .object({ ids: z.array(z.string().uuid()).min(1).max(20) })
    .safeParse(body);

  if (!parsed.success) return NextResponse.json({ ok: true });

  const admin = getSupabaseAdminClient();
  await admin
    .from("copilot_interacoes")
    .update({ status: "LIDA" })
    .eq("user_id", user.id)
    .in("id", parsed.data.ids)
    .eq("status", "ENTREGUE");

  return NextResponse.json({ ok: true });
}

// ─── Streak de consistência ───────────────────────────────────────────────────

async function calcularStreak(
  user_id: string,
  admin: ReturnType<typeof getSupabaseAdminClient>
): Promise<number> {
  const { data: respostas } = await admin
    .from("copilot_respostas")
    .select("valor, criado_em")
    .eq("user_id", user_id)
    .eq("tipo_resposta", "CHECKIN_ROTINA")
    .gte("criado_em", new Date(Date.now() - 45 * 86400000).toISOString())
    .order("criado_em", { ascending: false });

  if (!respostas?.length) return 0;

  const fezPorDia = new Map<string, boolean>();
  for (const r of respostas) {
    const dia = new Date(r.criado_em as string).toISOString().slice(0, 10);
    const fez = ((r.valor as Record<string, unknown>)?.fez_rotina) as boolean | undefined;
    if (fez === true) {
      fezPorDia.set(dia, true);
    } else if (!fezPorDia.has(dia)) {
      fezPorDia.set(dia, false);
    }
  }

  let streak = 0;
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i <= 45; i++) {
    const diaKey = new Date(hoje.getTime() - i * 86400000).toISOString().slice(0, 10);
    if (fezPorDia.get(diaKey) === true) {
      streak++;
    } else if (i === 0) {
      // Hoje pode ainda não ter check-in — não quebra o streak
      continue;
    } else {
      break;
    }
  }

  return streak;
}
