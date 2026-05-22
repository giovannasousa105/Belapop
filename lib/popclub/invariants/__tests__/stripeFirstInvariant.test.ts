/**
 * Testes da Invariante 2: Stripe primeiro, banco depois.
 *
 * Verificação central: stripe.coupons.create é chamado ANTES de qualquer
 * operação no banco. Se Stripe falhar, banco não é tocado.
 *
 * Executar: npx jest lib/popclub/invariants/__tests__/stripeFirstInvariant.test.ts
 */

import {
  criarCouponStripe,
  executarResgate,
  type CouponInput,
  type CreditoDbOps,
} from "../stripeFirstInvariant";
import type Stripe from "stripe";

// ─── Mock de Stripe ───────────────────────────────────────────────────────────

function makeStripeMock(overrides?: Partial<{ create: jest.Mock }>) {
  return {
    coupons: {
      create: overrides?.create ?? jest.fn().mockResolvedValue({ id: "coupon_test_abc123" }),
    },
  } as unknown as Pick<Stripe, "coupons">;
}

// ─── Mock de DbOps ───────────────────────────────────────────────────────────

function makeDbMock(overrides?: Partial<CreditoDbOps>): CreditoDbOps {
  return {
    insertCredito:      overrides?.insertCredito ?? jest.fn().mockResolvedValue("cred_uuid_123"),
    decrementarPontos:  overrides?.decrementarPontos ?? jest.fn().mockResolvedValue(300),
    insertTransacao:    overrides?.insertTransacao ?? jest.fn().mockResolvedValue(undefined),
  };
}

const BASE_INPUT: CouponInput & { expira_em: Date } = {
  valor_brl:         30,
  membro_id:         "membro-uuid-1",
  user_id:           "user-uuid-1",
  pontos_utilizados: 300,
  expira_em:         new Date("2027-05-16"),
};

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("stripeFirstInvariant — Stripe antes do banco", () => {

  // ── criarCouponStripe ────────────────────────────────────────────────────

  describe("criarCouponStripe", () => {
    it("chama stripe.coupons.create com max_redemptions: 1", async () => {
      const stripe = makeStripeMock();
      await criarCouponStripe(stripe, BASE_INPUT);
      expect(stripe.coupons.create).toHaveBeenCalledWith(
        expect.objectContaining({ max_redemptions: 1 }),
        expect.any(Object)
      );
    });

    it("valor_centavos = Math.round(valor_brl * 100) — sem float impreciso", async () => {
      const stripe = makeStripeMock();
      await criarCouponStripe(stripe, { ...BASE_INPUT, valor_brl: 10.1 });
      expect(stripe.coupons.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount_off: 1010 }),
        expect.any(Object)
      );
    });

    it("idempotencyKey único por (membro_id + pontos + timestamp)", async () => {
      const stripe = makeStripeMock();
      await criarCouponStripe(stripe, BASE_INPUT);
      const chamada = (stripe.coupons.create as jest.Mock).mock.calls[0];
      const opts = chamada[1] as { idempotencyKey: string };
      expect(opts.idempotencyKey).toContain(BASE_INPUT.membro_id);
      expect(opts.idempotencyKey).toContain(String(BASE_INPUT.pontos_utilizados));
    });

    it("retorna stripe_coupon_id, valor_centavos e valor_brl", async () => {
      const stripe = makeStripeMock();
      const resultado = await criarCouponStripe(stripe, BASE_INPUT);
      expect(resultado.stripe_coupon_id).toBe("coupon_test_abc123");
      expect(resultado.valor_centavos).toBe(3000);
      expect(resultado.valor_brl).toBe(30);
    });
  });

  // ── Ordem: Stripe ANTES do banco ─────────────────────────────────────────

  it("executarResgate chama Stripe ANTES de qualquer operação no banco", async () => {
    const callOrder: string[] = [];

    const stripe = {
      coupons: {
        create: jest.fn().mockImplementation(async () => {
          callOrder.push("stripe");
          return { id: "coupon_order_test" };
        }),
      },
    } as unknown as Pick<Stripe, "coupons">;

    const db = makeDbMock({
      insertCredito: jest.fn().mockImplementation(async () => {
        callOrder.push("db:insertCredito");
        return "cred_uuid";
      }),
      decrementarPontos: jest.fn().mockImplementation(async () => {
        callOrder.push("db:decrementarPontos");
        return 0;
      }),
      insertTransacao: jest.fn().mockImplementation(async () => {
        callOrder.push("db:insertTransacao");
      }),
    });

    await executarResgate(stripe, db, BASE_INPUT);

    expect(callOrder[0]).toBe("stripe");
    expect(callOrder[1]).toBe("db:insertCredito");
    expect(callOrder[2]).toBe("db:decrementarPontos");
    expect(callOrder[3]).toBe("db:insertTransacao");
  });

  it("se Stripe falha: banco não é tocado", async () => {
    const stripe = makeStripeMock({
      create: jest.fn().mockRejectedValue(new Error("Stripe indisponível")),
    });
    const db = makeDbMock();

    await expect(executarResgate(stripe, db, BASE_INPUT)).rejects.toThrow("Stripe indisponível");

    expect(db.insertCredito).not.toHaveBeenCalled();
    expect(db.decrementarPontos).not.toHaveBeenCalled();
    expect(db.insertTransacao).not.toHaveBeenCalled();
  });

  it("se banco falha após Stripe OK: coupon permanece no Stripe (inconsistência recuperável)", async () => {
    const stripe = makeStripeMock();
    const db = makeDbMock({
      insertCredito: jest.fn().mockRejectedValue(new Error("DB connection lost")),
    });

    await expect(executarResgate(stripe, db, BASE_INPUT)).rejects.toThrow("DB connection lost");

    // Stripe foi chamado e retornou — coupon existe no Stripe
    expect(stripe.coupons.create).toHaveBeenCalledTimes(1);
    // O coupon NÃO foi deletado — inconsistência temporária, recuperável
    // (job de expiração vai limpar eventualmente)
  });

  it("retorna credito_id, stripe_coupon_id e valor_brl em sucesso", async () => {
    const stripe = makeStripeMock();
    const db = makeDbMock();

    const resultado = await executarResgate(stripe, db, BASE_INPUT);

    expect(resultado.credito_id).toBe("cred_uuid_123");
    expect(resultado.stripe_coupon_id).toBe("coupon_test_abc123");
    expect(resultado.valor_brl).toBe(30);
  });
});
