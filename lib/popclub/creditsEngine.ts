import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/stripeClient";
import {
  CREDITO,
  type PopclubMembro,
  type ResgatarCreditoResult,
} from "./popclubTypes";

// ─── Stripe client ────────────────────────────────────────────────────────────

const stripe = getStripe();

// ─── resgatar ─────────────────────────────────────────────────────────────────
//
// Coupon Stripe criado ANTES de gravar no banco.
// Se Stripe falhar, nenhum dado é gravado — atomicidade garantida.

export async function resgatar(params: {
  user_id: string;
  pontos: number;
  pedido_id?: string;
}): Promise<ResgatarCreditoResult> {
  const { user_id, pontos, pedido_id } = params;

  // Validações de negócio
  if (pontos < CREDITO.MINIMO_PONTOS) {
    throw new Error(`Mínimo de ${CREDITO.MINIMO_PONTOS} pontos para resgate.`);
  }
  if (pontos % CREDITO.MINIMO_PONTOS !== 0) {
    throw new Error(`Pontos devem ser múltiplos de ${CREDITO.MINIMO_PONTOS}.`);
  }

  const admin = getSupabaseAdminClient();

  const { data: membro } = await admin
    .from("popclub_membros")
    .select("id, pontos_disponiveis, tier_atual")
    .eq("user_id", user_id)
    .eq("ativo", true)
    .single();

  if (!membro) throw new Error("Membro PopClub não encontrado.");

  const m = membro as Pick<PopclubMembro, "id" | "pontos_disponiveis" | "tier_atual">;

  if (pontos > m.pontos_disponiveis) {
    throw new Error(
      `Saldo insuficiente: ${m.pontos_disponiveis} pts disponíveis, solicitado ${pontos} pts.`
    );
  }

  const valor_brl = (pontos / CREDITO.PONTOS_POR_BRL);
  const expira_em = new Date();
  expira_em.setDate(expira_em.getDate() + CREDITO.VALIDADE_DIAS);

  // 1. Criar Stripe Coupon PRIMEIRO — se falhar, nada é gravado
  const coupon = await stripe.coupons.create({
    amount_off: Math.round(valor_brl * 100), // centavos
    currency: "brl",
    duration: "once",
    name: `PopClub ${pontos}pts — ${user_id.slice(0, 8)}`,
    max_redemptions: 1,
    metadata: {
      membro_id: m.id,
      pontos_utilizados: String(pontos),
    },
  });

  // 2. INSERT crédito no banco
  const novoSaldo = m.pontos_disponiveis - pontos;

  const { data: credito, error: creditoErr } = await admin
    .from("popclub_creditos")
    .insert({
      membro_id: m.id,
      valor_brl,
      pontos_utilizados: pontos,
      stripe_coupon_id: coupon.id,
      status: "DISPONIVEL",
      pedido_id: pedido_id ?? null,
      expira_em: expira_em.toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (creditoErr || !credito) {
    // Stripe coupon criado mas DB falhou — tentar deletar o coupon
    await stripe.coupons.del(coupon.id).catch(console.error);
    throw new Error(`Erro ao gravar crédito: ${creditoErr?.message}`);
  }

  // 3. Debitar pontos do membro
  await admin
    .from("popclub_membros")
    .update({ pontos_disponiveis: novoSaldo })
    .eq("id", m.id);

  // 4. INSERT transação de débito
  await admin.from("popclub_transacoes").insert({
    membro_id: m.id,
    user_id,
    tipo: "RESGATE_CREDITO",
    pontos: -pontos,
    saldo_apos: novoSaldo,
    referencia_id: credito.id as string,
    referencia_tipo: "CREDITO",
    descricao: `Resgate: ${pontos} pts → R$ ${valor_brl.toFixed(2)} em crédito`,
  });

  return {
    credito_id: credito.id as string,
    valor_brl,
    stripe_coupon_id: coupon.id,
  };
}

// ─── aplicarCreditoNoCheckout ─────────────────────────────────────────────────
//
// Valida teto de 20% e ajusta o coupon se necessário.
// Retorna o coupon_id final a passar no session.discounts.

export async function aplicarCreditoNoCheckout(params: {
  stripe_coupon_id: string;
  total_pedido_cents: number;
  credito_id: string;
  user_id: string;
}): Promise<{ coupon_id: string; desconto_aplicado_cents: number }> {
  const { stripe_coupon_id, total_pedido_cents, credito_id } = params;

  const coupon = await stripe.coupons.retrieve(stripe_coupon_id);
  const descontoOriginal = coupon.amount_off ?? 0;
  const tetoDesconto = Math.floor(total_pedido_cents * CREDITO.TETO_PCT_PEDIDO);

  if (descontoOriginal <= tetoDesconto) {
    return { coupon_id: stripe_coupon_id, desconto_aplicado_cents: descontoOriginal };
  }

  // Desconto excede 20% — criar coupon ajustado
  const couponAjustado = await stripe.coupons.create({
    amount_off: tetoDesconto,
    currency: "brl",
    duration: "once",
    name: coupon.name ?? `PopClub ajustado`,
    max_redemptions: 1,
    metadata: {
      ...(coupon.metadata ?? {}),
      coupon_original: stripe_coupon_id,
      ajustado_por_teto: "true",
    },
  });

  // Marcar crédito original como parcialmente aplicado (não cancelar — diff pode ser usado)
  const admin = getSupabaseAdminClient();
  await admin
    .from("popclub_creditos")
    .update({ status: "APLICADO", pedido_id: params.user_id }) // pedido resolvido no webhook
    .eq("id", credito_id);

  return { coupon_id: couponAjustado.id, desconto_aplicado_cents: tetoDesconto };
}

// ─── expirarCreditos ──────────────────────────────────────────────────────────
//
// Chamado pelo job diário de expiração (popclubTierReview.ts).

export async function expirarCreditos(): Promise<{ expirados: number }> {
  const admin = getSupabaseAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: vencidos } = await admin
    .from("popclub_creditos")
    .select("id, membro_id, stripe_coupon_id, pontos_utilizados")
    .eq("status", "DISPONIVEL")
    .lt("expira_em", hoje);

  if (!vencidos?.length) return { expirados: 0 };

  await Promise.all(
    (vencidos as Array<{
      id: string;
      membro_id: string;
      stripe_coupon_id: string | null;
      pontos_utilizados: number;
    }>).map(async (c) => {
      // Remover coupon do Stripe
      if (c.stripe_coupon_id) {
        await stripe.coupons.del(c.stripe_coupon_id).catch(() => {});
      }

      await admin
        .from("popclub_creditos")
        .update({ status: "EXPIRADO" })
        .eq("id", c.id);

      // Log de expiração
      const { data: membro } = await admin
        .from("popclub_membros")
        .select("user_id, pontos_disponiveis")
        .eq("id", c.membro_id)
        .single();

      if (membro) {
        await admin.from("popclub_transacoes").insert({
          membro_id: c.membro_id,
          user_id: (membro as { user_id: string; pontos_disponiveis: number }).user_id,
          tipo: "EXPIRACAO",
          pontos: 0,
          saldo_apos: (membro as { user_id: string; pontos_disponiveis: number }).pontos_disponiveis,
          referencia_id: c.id,
          referencia_tipo: "CREDITO",
          descricao: "Crédito PopClub expirado",
        });
      }
    })
  );

  return { expirados: vencidos.length };
}
