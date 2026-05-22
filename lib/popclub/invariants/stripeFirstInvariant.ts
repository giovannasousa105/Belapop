/**
 * INVARIANTE DE ARQUITETURA — STRIPE ANTES DO BANCO, SEMPRE
 *
 * Ao criar um crédito PopClub (resgate de pontos → coupon Stripe):
 *
 *   ORDEM CORRETA:
 *     1. stripe.coupons.create(...)    ← se falhar, para aqui, banco intacto
 *     2. insertCredito(...)            ← banco nunca vê crédito sem coupon
 *     3. decrementarPontos(...)
 *     4. insertTransacao(...)
 *
 *   ORDEM ERRADA (nunca fazer):
 *     1. insertCredito(...)            ← banco gravado
 *     2. stripe.coupons.create(...)    ← se falhar: crédito sem coupon no Stripe
 *     3. → inconsistência permanente — suporte inevitável
 *
 * Por quê a ordem importa:
 *   Falha após Stripe OK → coupon existe no Stripe mas não no banco.
 *   O job de expiração deleta do Stripe. Inconsistência temporária, recuperável.
 *
 *   Falha após banco OK → crédito no banco sem coupon no Stripe.
 *   O checkout rejeita. Usuária abre ticket. Inconsistência permanente.
 *
 *   Inconsistência temporária > inconsistência permanente. Stripe primeiro.
 */

import type Stripe from "stripe";

// ─── Tipos de entrada/saída ───────────────────────────────────────────────────

export interface CouponInput {
  valor_brl:         number;
  membro_id:         string;
  user_id:           string;
  pontos_utilizados: number;
}

export interface CouponCriado {
  stripe_coupon_id: string;
  valor_centavos:   number;
  valor_brl:        number;
}

// ─── Interface de DB (implementation-agnostic) ────────────────────────────────
// Pode ser Supabase, Knex, Prisma — o que importa é a ORDEM, não o cliente.

export interface InsertCreditoData {
  membro_id:         string;
  valor_brl:         number;
  pontos_utilizados: number;
  stripe_coupon_id:  string;
  status:            "DISPONIVEL";
  expira_em:         Date;
}

export interface InsertTransacaoData {
  membro_id:       string;
  user_id:         string;
  tipo:            "RESGATE_CREDITO";
  pontos:          number;
  saldo_apos:      number;
  referencia_id:   string;
  referencia_tipo: string;
  descricao:       string;
}

export interface CreditoDbOps {
  insertCredito(data: InsertCreditoData): Promise<string>;          // retorna credito_id
  decrementarPontos(membro_id: string, pontos: number): Promise<number>; // retorna saldo_novo
  insertTransacao(data: InsertTransacaoData): Promise<void>;
}

// ─── Passo 1: criar coupon no Stripe ─────────────────────────────────────────
// Chamar ANTES de qualquer operação no banco.

export async function criarCouponStripe(
  stripe: Pick<Stripe, "coupons">,
  input:  CouponInput
): Promise<CouponCriado> {
  // Math.round evita imprecisão de float: 10.1 * 100 = 1009.9999...
  const valor_centavos = Math.round(input.valor_brl * 100);

  // Idempotency key — retry seguro: não cria coupon duplicado em timeout + retry
  const idempotencyKey = `popclub-${input.membro_id}-${input.pontos_utilizados}-${Date.now()}`;

  const coupon = await stripe.coupons.create(
    {
      amount_off:      valor_centavos,
      currency:        "brl",
      duration:        "once",
      max_redemptions: 1,            // nunca reutilizável
      name:            `PopClub ${input.pontos_utilizados}pts`,
      metadata: {
        membro_id:         input.membro_id,
        user_id:           input.user_id,
        pontos_utilizados: String(input.pontos_utilizados),
        criado_em:         new Date().toISOString(),
      },
    },
    { idempotencyKey }
  );

  return { stripe_coupon_id: coupon.id, valor_centavos, valor_brl: input.valor_brl };
}

// ─── Passo 2: persistir no banco ──────────────────────────────────────────────
// Chamar SOMENTE após criarCouponStripe retornar com sucesso.

export async function persistirCreditoNoBanco(
  db:     CreditoDbOps,
  params: {
    membro_id:         string;
    user_id:           string;
    coupon:            CouponCriado;
    pontos_utilizados: number;
    expira_em:         Date;
  }
): Promise<string> {
  const credito_id = await db.insertCredito({
    membro_id:         params.membro_id,
    valor_brl:         params.coupon.valor_brl,
    pontos_utilizados: params.pontos_utilizados,
    stripe_coupon_id:  params.coupon.stripe_coupon_id,
    status:            "DISPONIVEL",
    expira_em:         params.expira_em,
  });

  const saldo_novo = await db.decrementarPontos(params.membro_id, params.pontos_utilizados);

  await db.insertTransacao({
    membro_id:       params.membro_id,
    user_id:         params.user_id,
    tipo:            "RESGATE_CREDITO",
    pontos:          -params.pontos_utilizados,
    saldo_apos:      saldo_novo,
    referencia_id:   credito_id,
    referencia_tipo: "CREDITO",
    descricao:       `Resgate de ${params.pontos_utilizados} pts → R$ ${params.coupon.valor_brl.toFixed(2)}`,
  });

  return credito_id;
}

// ─── executarResgate: enforça a ordem correta ─────────────────────────────────
// Único ponto de criação de coupon PopClub no codebase.

export async function executarResgate(
  stripe: Pick<Stripe, "coupons">,
  db:     CreditoDbOps,
  params: CouponInput & { expira_em: Date }
): Promise<{ credito_id: string; stripe_coupon_id: string; valor_brl: number }> {

  // PASSO 1: Stripe primeiro — falha aqui = banco intacto
  const coupon = await criarCouponStripe(stripe, params);

  // PASSO 2: banco após Stripe OK — falha aqui = inconsistência temporária
  const credito_id = await persistirCreditoNoBanco(db, {
    membro_id:         params.membro_id,
    user_id:           params.user_id,
    coupon,
    pontos_utilizados: params.pontos_utilizados,
    expira_em:         params.expira_em,
  });

  return { credito_id, stripe_coupon_id: coupon.stripe_coupon_id, valor_brl: coupon.valor_brl };
}
