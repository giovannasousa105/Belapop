/**
 * skinScoreInvariant.test.ts
 *
 * Verifica as invariantes de domínio do SkinScore:
 *   SCORE MENOR = CONDIÇÃO MELHORADA = PELE MELHOR
 *   delta NEGATIVO = melhora
 *   formatDeltaParaUsuario: NUNCA retorna número negativo
 *   MARKER_CHART_CONFIG.yAxisInverted === true (NUNCA alterar)
 */

import {
  toSkinScore,
  calcularSkinDelta,
  formatDeltaParaUsuario,
  MARKER_CHART_CONFIG,
  POSITIVE_DIRECTION_MARKERS,
  SKIN_MARKERS,
} from "@/lib/digitalTwin/invariants/skinScoreInvariant";

// ─── toSkinScore ───────────────────────────────────────────────────────────────

describe("toSkinScore", () => {
  test("lança RangeError para valor -1 (abaixo de 0)", () => {
    expect(() => toSkinScore(-1)).toThrow(RangeError);
  });

  test("lança RangeError para valor 101 (acima de 100)", () => {
    expect(() => toSkinScore(101)).toThrow(RangeError);
  });

  test("0 é válido — condição ausente (melhor possível)", () => {
    expect(() => toSkinScore(0)).not.toThrow();
    expect(toSkinScore(0)).toBe(0);
  });

  test("100 é válido — condição máxima (pior possível)", () => {
    expect(() => toSkinScore(100)).not.toThrow();
    expect(toSkinScore(100)).toBe(100);
  });

  test("lança RangeError para -0.1 (fora do intervalo)", () => {
    expect(() => toSkinScore(-0.1)).toThrow(RangeError);
  });

  test("lança RangeError para 100.1 (fora do intervalo)", () => {
    expect(() => toSkinScore(100.1)).toThrow(RangeError);
  });
});

// ─── calcularSkinDelta ────────────────────────────────────────────────────────
// INVARIANTE: score menor = pele melhor.
// delta NEGATIVO (score caiu) = MELHORA.
// delta POSITIVO (score subiu) = PIORA.
// Nunca inverter.

describe("calcularSkinDelta", () => {
  test("acne 60→42: MELHORA, valor -18, magnitude 18", () => {
    const delta = calcularSkinDelta(toSkinScore(60), toSkinScore(42), "acne");
    expect(delta.direcao).toBe("MELHORA");
    expect(delta.valor).toBe(-18);
    expect(delta.magnitude).toBe(18);
  });

  test("oleosidade 30→60: PIORA, valor +30", () => {
    const delta = calcularSkinDelta(toSkinScore(30), toSkinScore(60), "oleosidade");
    expect(delta.direcao).toBe("PIORA");
    expect(delta.valor).toBe(30);
  });

  test("textura 50→53: ESTAVEL (delta +3 abaixo do limiar 5)", () => {
    const delta = calcularSkinDelta(toSkinScore(50), toSkinScore(53), "textura");
    expect(delta.direcao).toBe("ESTAVEL");
  });

  test("delta exatamente -5: MELHORA (limiar inclusivo)", () => {
    const delta = calcularSkinDelta(toSkinScore(55), toSkinScore(50), "acne");
    expect(delta.valor).toBe(-5);
    expect(delta.direcao).toBe("MELHORA");
  });

  test("delta exatamente +5: PIORA (limiar inclusivo)", () => {
    const delta = calcularSkinDelta(toSkinScore(50), toSkinScore(55), "acne");
    expect(delta.valor).toBe(5);
    expect(delta.direcao).toBe("PIORA");
  });

  test("sem mudança (50→50): ESTAVEL", () => {
    const delta = calcularSkinDelta(toSkinScore(50), toSkinScore(50), "poros");
    expect(delta.direcao).toBe("ESTAVEL");
    expect(delta.valor).toBe(0);
  });
});

// ─── formatDeltaParaUsuario ────────────────────────────────────────────────────
// INVARIANTE: nunca exibir número negativo para a usuária.
// delta.valor pode ser negativo internamente — magnitude nunca é.

describe("formatDeltaParaUsuario", () => {
  test("MELHORA → começa com '↓' (seta para baixo = score caiu = bom)", () => {
    const d = calcularSkinDelta(toSkinScore(60), toSkinScore(42), "acne");
    expect(formatDeltaParaUsuario(d)).toMatch(/^↓/);
  });

  test("PIORA → começa com '↑' (seta para cima = score subiu = ruim)", () => {
    const d = calcularSkinDelta(toSkinScore(40), toSkinScore(60), "oleosidade");
    expect(formatDeltaParaUsuario(d)).toMatch(/^↑/);
  });

  test("ESTAVEL → contém 'estável'", () => {
    const d = calcularSkinDelta(toSkinScore(50), toSkinScore(52), "textura");
    expect(formatDeltaParaUsuario(d)).toContain("estável");
  });

  test("NUNCA retorna string com número negativo para o usuário", () => {
    const casos = [
      calcularSkinDelta(toSkinScore(80), toSkinScore(20), "acne"),     // -60
      calcularSkinDelta(toSkinScore(100), toSkinScore(5), "poros"),    // -95
      calcularSkinDelta(toSkinScore(70), toSkinScore(65), "textura"),  // -5
    ];
    for (const d of casos) {
      const resultado = formatDeltaParaUsuario(d);
      expect(resultado).not.toMatch(/-\d/);
    }
  });
});

// ─── MARKER_CHART_CONFIG ──────────────────────────────────────────────────────

describe("MARKER_CHART_CONFIG", () => {
  test("yAxisInverted === true (NUNCA alterar — CI verifica com grep)", () => {
    expect(MARKER_CHART_CONFIG.yAxisInverted).toBe(true);
  });

  test("yAxisLabel === '← melhor' (label obrigatório no gráfico)", () => {
    expect(MARKER_CHART_CONFIG.yAxisLabel).toBe("← melhor");
  });

  test("yDomain = [0, 100]", () => {
    expect(MARKER_CHART_CONFIG.yDomain).toEqual([0, 100]);
  });
});

// ─── POSITIVE_DIRECTION_MARKERS ───────────────────────────────────────────────

describe("POSITIVE_DIRECTION_MARKERS", () => {
  test("lista vazia por design — todos os marcadores atuais têm score menor = melhor", () => {
    expect(POSITIVE_DIRECTION_MARKERS.length).toBe(0);
  });
});

// ─── SKIN_MARKERS ─────────────────────────────────────────────────────────────

describe("SKIN_MARKERS", () => {
  test("contém os 7 marcadores padrão", () => {
    expect(SKIN_MARKERS).toHaveLength(7);
    expect(SKIN_MARKERS).toContain("acne");
    expect(SKIN_MARKERS).toContain("poros");
    expect(SKIN_MARKERS).toContain("textura");
    expect(SKIN_MARKERS).toContain("oleosidade");
    expect(SKIN_MARKERS).toContain("pigmentacao");
    expect(SKIN_MARKERS).toContain("vermelhidao");
    expect(SKIN_MARKERS).toContain("ressecamento");
  });
});
