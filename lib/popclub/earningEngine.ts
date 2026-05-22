import { Redis } from "ioredis";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  EARNING_RULES_MAP,
  TIER_MULTIPLICADORES,
  type CreditarPontosResult,
  type PopclubMembro,
  type TransacaoTipo,
  type TierEnum,
} from "./popclubTypes";
import { avaliarTier } from "./tierEngine";

// ─── Conexão Redis (cooldown por tipo) ───────────────────────────────────────

const getRedis = () =>
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

function cooldownKey(user_id: string, tipo: TransacaoTipo): string {
  return `popclub:cooldown:${user_id}:${tipo}`;
}

// ─── creditarPontos ───────────────────────────────────────────────────────────
//
// Opera em sequência; para atomicidade total em produção usar uma PL/pgSQL
// function via supabase.rpc('creditar_pontos', {...}).

export async function creditarPontos(params: {
  user_id: string;
  tipo: TransacaoTipo;
  referencia_id?: string;
  referencia_tipo?: string;
  valor_compra?: number;   // centavos — usado apenas em COMPRA
  descricao?: string;
}): Promise<CreditarPontosResult> {
  const { user_id, tipo, referencia_id, referencia_tipo, valor_compra, descricao } = params;
  const admin = getSupabaseAdminClient();

  // 1. Buscar membro
  const { data: membro } = await admin
    .from("popclub_membros")
    .select("*")
    .eq("user_id", user_id)
    .eq("ativo", true)
    .single();

  if (!membro) return { pontos_creditados: 0, saldo_novo: 0 };

  const m = membro as PopclubMembro;
  const rule = EARNING_RULES_MAP.get(tipo);
  if (!rule) return { pontos_creditados: 0, saldo_novo: m.pontos_disponiveis };

  // 2. Calcular pontos base
  let pontos = rule.pontos_base;

  if (tipo === "COMPRA" && valor_compra) {
    const mult = TIER_MULTIPLICADORES[m.tier_atual];
    pontos = Math.floor((valor_compra / 100) * mult);
    if (pontos <= 0) return { pontos_creditados: 0, saldo_novo: m.pontos_disponiveis };
  }

  if (tipo === "STREAK_BONUS") {
    pontos = Math.round(rule.pontos_base * TIER_MULTIPLICADORES[m.tier_atual]);
  }

  // 3. Verificar cooldown Redis (ex: SCAN 30 dias)
  if (rule.cooldown_horas) {
    const redis = getRedis();
    try {
      const ttl = await redis.ttl(cooldownKey(user_id, tipo));
      if (ttl > 0) return { pontos_creditados: 0, saldo_novo: m.pontos_disponiveis };
    } finally {
      redis.disconnect();
    }
  }

  // 4. Verificar teto mensal via DB (ex: CHECKIN max 35 pts/mês)
  if (rule.teto_por_mes !== undefined) {
    const inicioMes = new Date();
    inicioMes.setUTCDate(1);
    inicioMes.setUTCHours(0, 0, 0, 0);

    const { data: acumuladoMes } = await admin
      .from("popclub_transacoes")
      .select("pontos")
      .eq("membro_id", m.id)
      .eq("tipo", tipo)
      .gte("criado_em", inicioMes.toISOString());

    const totalMes = (acumuladoMes ?? []).reduce((s, r) => s + (r.pontos as number), 0);
    if (totalMes >= rule.teto_por_mes) {
      return { pontos_creditados: 0, saldo_novo: m.pontos_disponiveis };
    }
    // Ajustar para não ultrapassar o teto
    pontos = Math.min(pontos, rule.teto_por_mes - totalMes);
  }

  // 5. Recalcular pontos_acumulados_12m (janela deslizante)
  const inicio12m = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
  const { data: transacoes12m } = await admin
    .from("popclub_transacoes")
    .select("pontos")
    .eq("membro_id", m.id)
    .gt("pontos", 0)
    .gte("criado_em", inicio12m);

  const acumulado12m =
    (transacoes12m ?? []).reduce((s, r) => s + (r.pontos as number), 0) + pontos;

  const novoSaldo = m.pontos_disponiveis + pontos;

  // 6. UPDATE saldo do membro
  const { error: updateErr } = await admin
    .from("popclub_membros")
    .update({
      pontos_disponiveis: novoSaldo,
      pontos_acumulados_12m: acumulado12m,
    })
    .eq("id", m.id);

  if (updateErr) {
    console.error("[earningEngine] update membro falhou", updateErr.message);
    return { pontos_creditados: 0, saldo_novo: m.pontos_disponiveis };
  }

  // 7. INSERT transação com snapshot saldo_apos
  await admin.from("popclub_transacoes").insert({
    membro_id: m.id,
    user_id,
    tipo,
    pontos,
    saldo_apos: novoSaldo,
    referencia_id: referencia_id ?? null,
    referencia_tipo: referencia_tipo ?? null,
    descricao: descricao ?? null,
  });

  // 8. Registrar cooldown Redis após crédito bem-sucedido
  if (rule.cooldown_horas) {
    const redis = getRedis();
    try {
      await redis.set(cooldownKey(user_id, tipo), "1", "EX", rule.cooldown_horas * 3600);
    } finally {
      redis.disconnect();
    }
  }

  // 9. Avaliar se tier deve subir
  let tierResult: { promovido: boolean; tier_novo: TierEnum } | undefined;
  try {
    const avaliacao = await avaliarTier(m.id);
    if (avaliacao.promovido) {
      tierResult = { promovido: true, tier_novo: avaliacao.tier_novo };
    }
  } catch (err) {
    console.warn("[earningEngine] avaliarTier falhou (não crítico)", err);
  }

  return {
    pontos_creditados: pontos,
    saldo_novo: novoSaldo,
    ...(tierResult ?? {}),
  };
}

// ─── verificarEntradaClube ────────────────────────────────────────────────────
//
// Chamado após confirmação de pedido no webhook Stripe.
// Trigger: primeira compra com valor >= R$ 150.

export async function verificarEntradaClube(
  user_id: string,
  valor_pedido_cents: number,
  pedido_id?: string
): Promise<{ entrou: boolean; ja_era_membro: boolean }> {
  const admin = getSupabaseAdminClient();

  // Verificar se já é membro
  const { data: membroExistente } = await admin
    .from("popclub_membros")
    .select("id")
    .eq("user_id", user_id)
    .single();

  if (membroExistente) {
    // Já é membro — apenas creditar pontos da compra
    await creditarPontos({
      user_id,
      tipo: "COMPRA",
      valor_compra: valor_pedido_cents,
      referencia_id: pedido_id,
      referencia_tipo: "PEDIDO",
    });
    return { entrou: false, ja_era_membro: true };
  }

  // Verificar limiar de entrada (R$ 150 = 15000 cents)
  if (valor_pedido_cents < 15000) {
    return { entrou: false, ja_era_membro: false };
  }

  // Criar membro
  const dataAvaliacao = new Date();
  dataAvaliacao.setFullYear(dataAvaliacao.getFullYear() + 1);
  const dataAviso = new Date(dataAvaliacao.getTime() - 60 * 24 * 3600 * 1000);

  const { data: novoMembro, error: insertErr } = await admin
    .from("popclub_membros")
    .insert({
      user_id,
      tier_atual: "ESSENCIAL",
      data_avaliacao_tier: dataAvaliacao.toISOString().slice(0, 10),
      data_rebaixamento_aviso: dataAviso.toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (insertErr || !novoMembro) {
    console.error("[earningEngine] criar membro falhou", insertErr?.message);
    return { entrou: false, ja_era_membro: false };
  }

  // Creditar bônus de boas-vindas (ENTRADA_CLUBE = 100 pts)
  await creditarPontos({ user_id, tipo: "ENTRADA_CLUBE" });

  // Creditar pontos da compra de entrada
  await creditarPontos({
    user_id,
    tipo: "COMPRA",
    valor_compra: valor_pedido_cents,
    referencia_id: pedido_id,
    referencia_tipo: "PEDIDO",
  });

  // Criar acessos antecipados para lotes publicados (importação lazy para evitar ciclo)
  const { criarAcessosParaMembroEspecifico } = await import("./accessGate");
  await criarAcessosParaMembroEspecifico(novoMembro.id as string, "ESSENCIAL").catch(console.warn);

  // E-mail de boas-vindas — 5min de delay para chegar após PEDIDO_CONFIRMADO
  void (async () => {
    const { enviarBoasVindas } = await import("@/lib/crm/flows/popclubEmails");
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .maybeSingle();
    const dataEntrada = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    await enviarBoasVindas({
      user_id,
      email:              (profile?.email as string | null) ?? "",
      nome:               (profile?.full_name as string | null) ?? null,
      pontos_boas_vindas: 100,
      antecipacao_horas:  24,
      data_entrada:       dataEntrada,
    });
  })().catch(console.error);

  console.log("[earningEngine] nova entrada no PopClub", { user_id });
  return { entrou: true, ja_era_membro: false };
}
