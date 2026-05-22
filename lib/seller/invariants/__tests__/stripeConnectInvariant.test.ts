/**
 * stripeConnectInvariant.test.ts
 *
 * Verifica que a guarda de Stripe Connect funciona antes de publicar lotes.
 */

import {
  assertStripeCompleto,
  isStripeCompleto,
} from "../stripeConnectInvariant";
import type { SellerStripeData } from "../stripeConnectInvariant";

const SELLER_COMPLETO: SellerStripeData = {
  id:                      "seller-1",
  stripe_account_id:       "acct_test123",
  stripe_charges_enabled:  true,
  stripe_payouts_enabled:  true,
};

const SELLER_SEM_CONTA: SellerStripeData = {
  id:                      "seller-2",
  stripe_account_id:       null,
  stripe_charges_enabled:  false,
  stripe_payouts_enabled:  false,
};

// ─── assertStripeCompleto ─────────────────────────────────────────────────────

describe("assertStripeCompleto", () => {
  test("seller completo: não lança", () => {
    expect(() => assertStripeCompleto(SELLER_COMPLETO)).not.toThrow();
  });

  test("lança se stripe_account_id é null", () => {
    expect(() => assertStripeCompleto(SELLER_SEM_CONTA)).toThrow(/stripe_account_id/);
  });

  test("lança se charges_enabled = false", () => {
    expect(() =>
      assertStripeCompleto({ ...SELLER_COMPLETO, stripe_charges_enabled: false })
    ).toThrow(/charges_enabled/);
  });

  test("lança se payouts_enabled = false", () => {
    expect(() =>
      assertStripeCompleto({ ...SELLER_COMPLETO, stripe_payouts_enabled: false })
    ).toThrow(/payouts_enabled/);
  });

  test("mensagem de erro cita o seller_id", () => {
    try {
      assertStripeCompleto(SELLER_SEM_CONTA);
    } catch (e) {
      expect((e as Error).message).toContain("seller-2");
    }
  });
});

// ─── isStripeCompleto (type guard) ────────────────────────────────────────────

describe("isStripeCompleto", () => {
  test("seller completo: retorna true", () => {
    expect(isStripeCompleto(SELLER_COMPLETO)).toBe(true);
  });

  test("sem account_id: retorna false", () => {
    expect(isStripeCompleto(SELLER_SEM_CONTA)).toBe(false);
  });

  test("charges false: retorna false", () => {
    expect(isStripeCompleto({ ...SELLER_COMPLETO, stripe_charges_enabled: false })).toBe(false);
  });

  test("payouts false: retorna false", () => {
    expect(isStripeCompleto({ ...SELLER_COMPLETO, stripe_payouts_enabled: false })).toBe(false);
  });
});
