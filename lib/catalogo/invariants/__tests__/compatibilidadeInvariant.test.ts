/**
 * compatibilidadeInvariant.test.ts
 * Cobre toCompatScore, deveExibirBadge, formatarScoreParaExibicao.
 */

import {
  toCompatScore,
  deveExibirBadge,
  formatarScoreParaExibicao,
  CompatScoreInvalidoError,
  COMPAT_BADGE_THRESHOLD,
} from "../compatibilidadeInvariant";

// ─── toCompatScore ─────────────────────────────────────────────────────────

describe("toCompatScore", () => {
  test("aceita 0", () => {
    expect(toCompatScore(0)).toBe(0);
  });

  test("aceita 100", () => {
    expect(toCompatScore(100)).toBe(100);
  });

  test("aceita inteiro no meio do intervalo", () => {
    expect(toCompatScore(75)).toBe(75);
  });

  test("arredonda float para inteiro", () => {
    expect(toCompatScore(74.6)).toBe(75);
    expect(toCompatScore(74.4)).toBe(74);
  });

  test("lança CompatScoreInvalidoError para -1", () => {
    expect(() => toCompatScore(-1)).toThrow(CompatScoreInvalidoError);
  });

  test("lança CompatScoreInvalidoError para 101", () => {
    expect(() => toCompatScore(101)).toThrow(CompatScoreInvalidoError);
  });

  test("lança para NaN", () => {
    expect(() => toCompatScore(NaN)).toThrow(CompatScoreInvalidoError);
  });

  test("lança para Infinity", () => {
    expect(() => toCompatScore(Infinity)).toThrow(CompatScoreInvalidoError);
  });

  test("mensagem de erro contém o valor inválido", () => {
    expect(() => toCompatScore(-5)).toThrow("-5");
  });
});

// ─── deveExibirBadge ───────────────────────────────────────────────────────

describe("deveExibirBadge", () => {
  test("threshold é 60", () => {
    expect(COMPAT_BADGE_THRESHOLD).toBe(60);
  });

  test("não exibe abaixo do threshold (59)", () => {
    expect(deveExibirBadge(toCompatScore(59))).toBe(false);
  });

  test("não exibe em 0", () => {
    expect(deveExibirBadge(toCompatScore(0))).toBe(false);
  });

  test("exibe exatamente no threshold (60)", () => {
    expect(deveExibirBadge(toCompatScore(60))).toBe(true);
  });

  test("exibe acima do threshold (85)", () => {
    expect(deveExibirBadge(toCompatScore(85))).toBe(true);
  });

  test("exibe em 100", () => {
    expect(deveExibirBadge(toCompatScore(100))).toBe(true);
  });
});

// ─── formatarScoreParaExibicao ────────────────────────────────────────────

describe("formatarScoreParaExibicao", () => {
  test("formata 85 como '85% compatível'", () => {
    expect(formatarScoreParaExibicao(toCompatScore(85))).toBe("85% compatível");
  });

  test("formata 100 como '100% compatível'", () => {
    expect(formatarScoreParaExibicao(toCompatScore(100))).toBe("100% compatível");
  });

  test("formata 60 como '60% compatível'", () => {
    expect(formatarScoreParaExibicao(toCompatScore(60))).toBe("60% compatível");
  });

  test("sempre inclui '%'", () => {
    expect(formatarScoreParaExibicao(toCompatScore(42))).toContain("%");
  });

  test("sempre inclui 'compatível'", () => {
    expect(formatarScoreParaExibicao(toCompatScore(42))).toContain("compatível");
  });
});
