/**
 * sellerStatusInvariant.test.ts
 *
 * Verifica transições de status e pré-condições de aprovação.
 * Funções puras — sem I/O, sem banco, sem Redis.
 */

import {
  validarTransicaoSeller,
  assertPodeAprovar,
} from "../sellerStatusInvariant";
import type { SellerParaAprovacao, SellerStatus } from "../sellerStatusInvariant";

// ─── Fixture base ─────────────────────────────────────────────────────────────

function makeSellerOk(overrides: Partial<SellerParaAprovacao> = {}): SellerParaAprovacao {
  return {
    id:                     "seller-1",
    status:                 "APROVADO_PARCIAL",
    stripe_account_id:      "acct_test123",
    stripe_charges_enabled: true,
    stripe_payouts_enabled: true,
    documentos_pendentes:   0,
    ...overrides,
  };
}

// ─── validarTransicaoSeller ───────────────────────────────────────────────────

describe("validarTransicaoSeller", () => {
  test("RASCUNHO → AGUARDANDO_DOCS: válida", () => {
    expect(validarTransicaoSeller("RASCUNHO", "AGUARDANDO_DOCS").valida).toBe(true);
  });

  test("AGUARDANDO_DOCS → EM_VERIFICACAO: válida", () => {
    expect(validarTransicaoSeller("AGUARDANDO_DOCS", "EM_VERIFICACAO").valida).toBe(true);
  });

  test("EM_VERIFICACAO → APROVADO_PARCIAL: válida", () => {
    expect(validarTransicaoSeller("EM_VERIFICACAO", "APROVADO_PARCIAL").valida).toBe(true);
  });

  test("APROVADO_PARCIAL → ATIVO: válida", () => {
    expect(validarTransicaoSeller("APROVADO_PARCIAL", "ATIVO").valida).toBe(true);
  });

  test("ATIVO → SUSPENSO: válida", () => {
    expect(validarTransicaoSeller("ATIVO", "SUSPENSO").valida).toBe(true);
  });

  test("SUSPENSO → ATIVO: válida (reativação)", () => {
    expect(validarTransicaoSeller("SUSPENSO", "ATIVO").valida).toBe(true);
  });

  test("EM_VERIFICACAO → REPROVADO: válida", () => {
    expect(validarTransicaoSeller("EM_VERIFICACAO", "REPROVADO").valida).toBe(true);
  });

  // INVARIANTE: seller nunca vai direto para ATIVO sem passar pelas etapas
  test("RASCUNHO → ATIVO diretamente: inválida (atalho proibido)", () => {
    const result = validarTransicaoSeller("RASCUNHO", "ATIVO");
    expect(result.valida).toBe(false);
    expect(result.motivo).toBeDefined();
    expect(result.motivo?.length).toBeGreaterThan(0);
  });

  test("AGUARDANDO_DOCS → ATIVO: inválida (pula EM_VERIFICACAO)", () => {
    expect(validarTransicaoSeller("AGUARDANDO_DOCS", "ATIVO").valida).toBe(false);
  });

  test("RASCUNHO → APROVADO_PARCIAL: inválida (pula etapas)", () => {
    expect(validarTransicaoSeller("RASCUNHO", "APROVADO_PARCIAL").valida).toBe(false);
  });

  test("ATIVO → RASCUNHO: inválida (não existe retrocesso)", () => {
    expect(validarTransicaoSeller("ATIVO", "RASCUNHO").valida).toBe(false);
  });

  test("resultado inválido sempre tem motivo descritivo", () => {
    const result = validarTransicaoSeller("RASCUNHO", "ATIVO");
    expect(result.motivo).toMatch(/RASCUNHO.*ATIVO/);
    expect(result.motivo).toContain("obrigatória");
  });
});

// ─── assertPodeAprovar ────────────────────────────────────────────────────────

describe("assertPodeAprovar", () => {
  test("seller com tudo ok: não lança", () => {
    expect(() => assertPodeAprovar(makeSellerOk())).not.toThrow();
  });

  test("lança se stripe_charges_enabled = false", () => {
    expect(() =>
      assertPodeAprovar(makeSellerOk({ stripe_charges_enabled: false }))
    ).toThrow(/charges_enabled/);
  });

  test("lança se stripe_payouts_enabled = false", () => {
    expect(() =>
      assertPodeAprovar(makeSellerOk({ stripe_payouts_enabled: false }))
    ).toThrow(/payouts_enabled/);
  });

  test("lança se stripe_account_id é null", () => {
    expect(() =>
      assertPodeAprovar(makeSellerOk({ stripe_account_id: null }))
    ).toThrow(/stripe_account_id/);
  });

  test("lança se há documentos pendentes", () => {
    expect(() =>
      assertPodeAprovar(makeSellerOk({ documentos_pendentes: 2 }))
    ).toThrow(/2 documento/);
  });

  test("lança se status é inválido para a transição", () => {
    expect(() =>
      assertPodeAprovar(makeSellerOk({ status: "RASCUNHO" }))
    ).toThrow();
  });

  test("caminho completo válido: APROVADO_PARCIAL + Stripe + sem docs pendentes = ok", () => {
    expect(() =>
      assertPodeAprovar({
        id:                     "seller-ok",
        status:                 "APROVADO_PARCIAL",
        stripe_account_id:      "acct_ok",
        stripe_charges_enabled: true,
        stripe_payouts_enabled: true,
        documentos_pendentes:   0,
      })
    ).not.toThrow();
  });
});
