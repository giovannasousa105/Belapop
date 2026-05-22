/**
 * loteService.ts — todas as operações de banco do lote curado.
 * Integrado ao PopClub accessGate e ao CRM deliveryQueue.
 * Funções puras de cálculo estão em loteStateMachine.ts.
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { calcularTransicao, calcularDisplayConfig } from "./loteStateMachine";
import { toLoteId, toQtd } from "./loteTypes";
import type {
  Lote,
  LoteId,
  LoteStatus,
  LoteDisplayConfig,
  ReservaOutcome,
  TransicaoResult,
  EventoTipo,
} from "./loteTypes";

const RESERVA_TTL_MIN = parseInt(process.env.RESERVA_TTL_MINUTOS ?? "15", 10);

// ─── buscarLotePorProduto ─────────────────────────────────────────────────────

export async function buscarLotePorProduto(
  produto_id: string,
  user_id?: string
): Promise<LoteDisplayConfig | null> {
  const admin = getSupabaseAdminClient();

  const { data } = await admin
    .from("lotes")
    .select("*")
    .eq("produto_id", produto_id)
    .not("status", "eq", "SUSPENSO")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const lote = data as Lote;
  const config = calcularDisplayConfig(lote) as LoteDisplayConfig;

  if (user_id) {
    try {
      const { verificarAcesso } = await import("@/lib/popclub/accessGate");
      const acesso = await verificarAcesso(lote.id, user_id);
      (config as unknown as Record<string, unknown>).acesso_membro = acesso;
    } catch {
      // degradação silenciosa — PopClub nunca bloqueia o lote
    }
  }

  return config;
}

// ─── criarReserva ─────────────────────────────────────────────────────────────

export async function criarReserva(params: {
  lote_id: string;
  session_id: string;
  quantidade: number;
  user_id?: string;
}): Promise<ReservaOutcome> {
  const admin = getSupabaseAdminClient();

  // Pré-validações — sem entrar na transação
  const { data: lote } = await admin
    .from("lotes")
    .select("id, status, qtd_disponivel")
    .eq("id", params.lote_id)
    .maybeSingle();

  if (!lote) return { ok: false, motivo: "ERRO" };

  const status = lote.status as LoteStatus;
  if (status === "ENCERRADO" || status === "REPOSICAO_PREVISTA")
    return { ok: false, motivo: "LOTE_ENCERRADO" };
  if (status === "SUSPENSO")
    return { ok: false, motivo: "LOTE_SUSPENSO" };
  if ((lote.qtd_disponivel as number) < params.quantidade)
    return { ok: false, motivo: "ESGOTADO" };

  // Verificar reserva ativa existente da mesma session
  const { data: existente } = await admin
    .from("lote_reservas")
    .select("id")
    .eq("lote_id", params.lote_id)
    .eq("session_id", params.session_id)
    .eq("status", "ATIVA")
    .maybeSingle();

  if (existente) return { ok: false, motivo: "RESERVA_EXISTENTE" };

  // Transação via RPC
  const expira_em = new Date(Date.now() + RESERVA_TTL_MIN * 60 * 1000);

  const { data, error } = await admin.rpc("fn_criar_reserva", {
    p_lote_id:    params.lote_id,
    p_session_id: params.session_id,
    p_user_id:    params.user_id ?? null,
    p_quantidade: params.quantidade,
    p_expira_em:  expira_em.toISOString(),
  });

  if (error) {
    if (error.message.includes("ESTOQUE_INSUFICIENTE"))
      return { ok: false, motivo: "ESGOTADO" };
    return { ok: false, motivo: "ERRO" };
  }

  const result = data as {
    ok: boolean; reserva_id?: string; expira_em?: string; error?: string;
  };

  if (!result.ok) {
    if (result.error?.includes("ESTOQUE")) return { ok: false, motivo: "ESGOTADO" };
    return { ok: false, motivo: "ERRO" };
  }

  // Fire-and-forget — não bloqueia retorno
  void verificarEAplicarTransicao(toLoteId(params.lote_id)).catch(console.error);

  return {
    ok:         true,
    reserva_id: toLoteId(result.reserva_id!) as unknown as import("./loteTypes").ReservaId,
    expira_em:  new Date(result.expira_em!),
    lote_id:    toLoteId(params.lote_id),
  };
}

// ─── liberarReserva ───────────────────────────────────────────────────────────

export async function liberarReserva(
  reserva_id: string,
  motivo: "expiracao" | "cancelamento" | "pagamento_falhou"
): Promise<{ liberado: boolean; lote_id: LoteId | null }> {
  const admin = getSupabaseAdminClient();

  const { data: reserva } = await admin
    .from("lote_reservas")
    .select("id, lote_id, quantidade, status")
    .eq("id", reserva_id)
    .maybeSingle();

  if (!reserva || (reserva.status as string) !== "ATIVA")
    return { liberado: false, lote_id: null };

  const status_novo = motivo === "expiracao" ? "EXPIRADA" : "CANCELADA";

  const { error } = await admin.rpc("fn_liberar_reserva", {
    p_reserva_id:  reserva_id,
    p_status_novo: status_novo,
    p_lote_id:     reserva.lote_id as string,
    p_quantidade:  reserva.quantidade as number,
    p_motivo:      motivo,
  });

  if (error) return { liberado: false, lote_id: null };

  const lote_id = toLoteId(reserva.lote_id as string);
  void verificarEAplicarTransicao(lote_id).catch(console.error);

  return { liberado: true, lote_id };
}

// ─── confirmarReserva ─────────────────────────────────────────────────────────

export async function confirmarReserva(params: {
  reserva_id: string;
  pedido_id: string;
  stripe_session_id: string;
}): Promise<{ confirmado: boolean; lote_id: LoteId | null }> {
  const admin = getSupabaseAdminClient();

  const { data: reserva } = await admin
    .from("lote_reservas")
    .select("id, lote_id, status")
    .eq("id", params.reserva_id)
    .maybeSingle();

  if (!reserva) return { confirmado: false, lote_id: null };

  const lote_id = toLoteId(reserva.lote_id as string);

  // Idempotente — reserva já confirmada
  if ((reserva.status as string) === "CONFIRMADA")
    return { confirmado: true, lote_id };

  if ((reserva.status as string) !== "ATIVA")
    return { confirmado: false, lote_id };

  // fn_confirmar_reserva NÃO restaura qtd_disponivel —
  // apenas decrementa qtd_reservada. Item foi vendido definitivamente.
  const { error } = await admin.rpc("fn_confirmar_reserva", {
    p_reserva_id:       params.reserva_id,
    p_pedido_id:        params.pedido_id,
    p_stripe_session_id: params.stripe_session_id,
  });

  if (error) return { confirmado: false, lote_id };

  void verificarEAplicarTransicao(lote_id).catch(console.error);

  return { confirmado: true, lote_id };
}

// ─── verificarEAplicarTransicao ───────────────────────────────────────────────

export async function verificarEAplicarTransicao(
  lote_id: LoteId
): Promise<TransicaoResult | null> {
  const admin = getSupabaseAdminClient();

  const { data } = await admin
    .from("lotes")
    .select("*")
    .eq("id", lote_id)
    .maybeSingle();

  if (!data) return null;

  const lote = data as Lote;
  const transicao = calcularTransicao(lote);
  if (!transicao) return null;

  const now = new Date().toISOString();
  const encerrado_em = transicao.status_novo === "ENCERRADO" ? now : null;

  // Optimistic lock: WHERE status = status_anterior
  // Se outro worker aplicou antes: UPDATE não afeta nenhuma linha — sem erro, sem dupla transição
  const { count } = await admin
    .from("lotes")
    .update({
      status:       transicao.status_novo,
      ...(encerrado_em ? { encerrado_em } : {}),
    })
    .eq("id", lote_id)
    .eq("status", transicao.status_anterior)
    .select("id");

  if (!count || count === 0) return null;

  await registrarEvento({
    lote_id,
    tipo:            "TRANSICAO",
    status_anterior: transicao.status_anterior,
    status_novo:     transicao.status_novo,
    delta_qtd:       0,
    actor_tipo:      "system",
  });

  // Side effects de transição
  if (transicao.status_novo === "ABERTO") {
    const abertura = (lote.abertura_geral_em instanceof Date ? lote.abertura_geral_em : null) ?? new Date();
    void import("@/lib/popclub/accessGate")
      .then(({ criarAcessosParaLote }) => criarAcessosParaLote(lote_id, abertura))
      .catch(console.error);
  }

  if (transicao.status_novo === "ENCERRADO") {
    void dispararNotificacaoListaEspera(lote_id).catch(console.error);
  }

  return transicao;
}

// ─── registrarEvento ─────────────────────────────────────────────────────────

export async function registrarEvento(params: {
  lote_id: LoteId | string;
  tipo: EventoTipo;
  status_anterior?: LoteStatus;
  status_novo?: LoteStatus;
  delta_qtd: number;
  actor_id?: string;
  actor_tipo: "user" | "admin" | "system" | "webhook";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    await admin.from("lote_eventos").insert({
      lote_id:         params.lote_id,
      tipo:            params.tipo,
      status_anterior: params.status_anterior ?? null,
      status_novo:     params.status_novo ?? null,
      delta_qtd:       params.delta_qtd,
      actor_id:        params.actor_id ?? null,
      actor_tipo:      params.actor_tipo,
      metadata:        params.metadata ?? {},
    });
  } catch (err) {
    console.error("[registrarEvento] falhou:", err);
    // nunca propagar — log e continuar
  }
}

// ─── adicionarListaEspera ─────────────────────────────────────────────────────

export async function adicionarListaEspera(params: {
  produto_id: string;
  lote_id?: string;
  email: string;
  user_id?: string;
  origem: string;
}): Promise<{ adicionado: boolean }> {
  const admin = getSupabaseAdminClient();

  const email = params.email.toLowerCase().trim();

  const { error } = await admin.from("lote_lista_espera").upsert(
    {
      produto_id: params.produto_id,
      lote_id:    params.lote_id ?? null,
      email,
      user_id:    params.user_id ?? null,
      origem:     params.origem,
    },
    { onConflict: "email,produto_id", ignoreDuplicates: false }
  );

  return { adicionado: !error };
}

// ─── dispararNotificacaoListaEspera (privada) ─────────────────────────────────

async function dispararNotificacaoListaEspera(lote_id: LoteId): Promise<void> {
  const admin = getSupabaseAdminClient();

  const { data: lote } = await admin
    .from("lotes")
    .select("produto_id")
    .eq("id", lote_id)
    .maybeSingle();

  if (!lote) return;

  const { data: esperas } = await admin
    .from("lote_lista_espera")
    .select("id, email, user_id, produto_id")
    .eq("lote_id", lote_id)
    .is("notificado_em", null)
    .limit(200);

  if (!esperas?.length) return;

  // Import dinâmico do CRM — evitar dependência circular
  const { enfileirar } = await import("@/lib/crm/deliveryQueue");

  for (const item of esperas) {
    try {
      await enfileirar({
        user_id:     item.user_id as string ?? "",
        email:       item.email as string,
        fluxo:       "WAITLIST_PRODUTO",
        template_id: "WaitlistProduto",
        subject:     "O produto que você queria voltou ao estoque",
        produto_id:  item.produto_id as string,
        metadata:    { lote_id, produto_id: item.produto_id },
      });
    } catch {
      // falha por email não cancela as outras notificações
    }
  }

  const ids = esperas.map((e) => e.id as string);
  await admin
    .from("lote_lista_espera")
    .update({ notificado_em: new Date().toISOString() })
    .in("id", ids);

  await registrarEvento({
    lote_id,
    tipo:       "NOTIFICACAO_ESPERA",
    delta_qtd:  0,
    actor_tipo: "system",
    metadata:   { notificadas: ids.length },
  });
}

// ─── buscarLotePorId (utilitário interno) ────────────────────────────────────

export async function buscarLotePorId(lote_id: string): Promise<Lote | null> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("lotes")
    .select("*")
    .eq("id", lote_id)
    .maybeSingle();
  return data ? (data as Lote) : null;
}

// ─── expirarReservasVencidas (chamada pelo job) ───────────────────────────────

export async function expirarReservasVencidas(
  limite = 50
): Promise<{ lote_ids: string[]; overflow: boolean }> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin.rpc("fn_expirar_reservas_em_lote", { p_limite: limite });
  const result = data as { lote_ids?: string[]; overflow?: boolean } | null;
  return {
    lote_ids: result?.lote_ids ?? [],
    overflow: result?.overflow ?? false,
  };
}
