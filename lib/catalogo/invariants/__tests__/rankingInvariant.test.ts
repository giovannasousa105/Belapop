/**
 * rankingInvariant.test.ts
 * Cobre assertRankingCoerente e calcularPersonalizado.
 */

import {
  assertRankingCoerente,
  calcularPersonalizado,
  RankingInvariante,
} from "../rankingInvariant";

// ─── assertRankingCoerente ─────────────────────────────────────────────────

describe("assertRankingCoerente", () => {
  const BASE = { total_vendas_30d: 10, rating_medio: 4.5, total_avaliacoes: 20 };

  test("aceita params válidos", () => {
    expect(() => assertRankingCoerente(BASE)).not.toThrow();
  });

  test("aceita zeros", () => {
    expect(() =>
      assertRankingCoerente({ total_vendas_30d: 0, rating_medio: 0, total_avaliacoes: 0 })
    ).not.toThrow();
  });

  test("aceita rating 5.0 exato", () => {
    expect(() =>
      assertRankingCoerente({ ...BASE, rating_medio: 5 })
    ).not.toThrow();
  });

  test("lança para total_vendas negativo", () => {
    expect(() =>
      assertRankingCoerente({ ...BASE, total_vendas_30d: -1 })
    ).toThrow(RankingInvariante);
  });

  test("lança para rating > 5", () => {
    expect(() =>
      assertRankingCoerente({ ...BASE, rating_medio: 5.1 })
    ).toThrow(RankingInvariante);
  });

  test("lança para rating negativo", () => {
    expect(() =>
      assertRankingCoerente({ ...BASE, rating_medio: -0.1 })
    ).toThrow(RankingInvariante);
  });

  test("lança para total_avaliacoes negativo", () => {
    expect(() =>
      assertRankingCoerente({ ...BASE, total_avaliacoes: -1 })
    ).toThrow(RankingInvariante);
  });

  test("lança para total_vendas NaN", () => {
    expect(() =>
      assertRankingCoerente({ ...BASE, total_vendas_30d: NaN })
    ).toThrow(RankingInvariante);
  });

  test("lança para rating Infinity", () => {
    expect(() =>
      assertRankingCoerente({ ...BASE, rating_medio: Infinity })
    ).toThrow(RankingInvariante);
  });

  test("mensagem contém o campo violado", () => {
    expect(() =>
      assertRankingCoerente({ ...BASE, total_vendas_30d: -5 })
    ).toThrow("total_vendas_30d");
  });
});

// ─── calcularPersonalizado ─────────────────────────────────────────────────

describe("calcularPersonalizado", () => {
  const BASE = {
    total_vendas_30d:  10,
    rating_medio:      4.5,
    total_avaliacoes:  20,
    curated:           false,
    is_featured:       false,
  };

  test("retorna número finito", () => {
    expect(Number.isFinite(calcularPersonalizado(BASE))).toBe(true);
  });

  test("nunca retorna NaN", () => {
    expect(Number.isNaN(calcularPersonalizado(BASE))).toBe(false);
  });

  test("produto featured tem score maior", () => {
    const normal   = calcularPersonalizado(BASE);
    const featured = calcularPersonalizado({ ...BASE, is_featured: true });
    expect(featured).toBeGreaterThan(normal);
  });

  test("produto curado tem score maior que não-curado", () => {
    const normal  = calcularPersonalizado(BASE);
    const curated = calcularPersonalizado({ ...BASE, curated: true });
    expect(curated).toBeGreaterThan(normal);
  });

  test("compat_score 100 aumenta o score", () => {
    const sem   = calcularPersonalizado(BASE);
    const com   = calcularPersonalizado({ ...BASE, score_compatibilidade: 100 });
    expect(com).toBeGreaterThan(sem);
  });

  test("compat_score 0 não afeta negativamente", () => {
    const sem = calcularPersonalizado(BASE);
    const com = calcularPersonalizado({ ...BASE, score_compatibilidade: 0 });
    expect(com).toBe(sem);
  });

  test("mais vendas → score maior (log scale)", () => {
    const poucas  = calcularPersonalizado({ ...BASE, total_vendas_30d: 0  });
    const muitas  = calcularPersonalizado({ ...BASE, total_vendas_30d: 100 });
    expect(muitas).toBeGreaterThan(poucas);
  });

  test("score determinístico para mesmos parâmetros", () => {
    const a = calcularPersonalizado(BASE);
    const b = calcularPersonalizado(BASE);
    expect(a).toBe(b);
  });

  test("lança para params incoerentes (rating > 5)", () => {
    expect(() =>
      calcularPersonalizado({ ...BASE, rating_medio: 6 })
    ).toThrow(RankingInvariante);
  });

  test("compat_score acima de 100 é clampado a 100", () => {
    const com100  = calcularPersonalizado({ ...BASE, score_compatibilidade: 100 });
    const com200  = calcularPersonalizado({ ...BASE, score_compatibilidade: 200 });
    expect(com200).toBe(com100);
  });
});
