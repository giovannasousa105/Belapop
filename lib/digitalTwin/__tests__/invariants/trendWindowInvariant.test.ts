/**
 * trendWindowInvariant.test.ts
 *
 * Verifica as invariantes da janela deslizante de trends:
 *   Mínimo 3 snapshots para calcular — abaixo → INSUFICIENTE
 *   Janela máxima de 5 — outlier tem peso máximo 1/5
 *   slope NEGATIVO = score descendo = MELHORANDO (NUNCA inverter)
 *   slope POSITIVO = score subindo  = PIORANDO   (NUNCA inverter)
 */

import {
  calcularMarkerTrend,
  assertTrendSuficiente,
  TREND_WINDOW,
} from "@/lib/digitalTwin/invariants/trendWindowInvariant";
import { toSkinScore } from "@/lib/digitalTwin/invariants/skinScoreInvariant";
import type { MarkerTrend } from "@/lib/digitalTwin/invariants/trendWindowInvariant";

const s = (...values: number[]) => values.map((v) => toSkinScore(v));

// ─── Constantes ───────────────────────────────────────────────────────────────

describe("TREND_WINDOW", () => {
  test("MIN_SNAPSHOTS === 3", () => {
    expect(TREND_WINDOW.MIN_SNAPSHOTS).toBe(3);
  });

  test("MAX_SNAPSHOTS === 5", () => {
    expect(TREND_WINDOW.MAX_SNAPSHOTS).toBe(5);
  });
});

// ─── calcularMarkerTrend ──────────────────────────────────────────────────────

describe("calcularMarkerTrend", () => {
  test("2 scores → INSUFICIENTE, confianca BAIXA", () => {
    const trend = calcularMarkerTrend(s(60, 55), "acne", 42);
    expect(trend.status).toBe("INSUFICIENTE");
    expect(trend.confianca).toBe("BAIXA");
    expect(trend.snapshotsUsados).toBe(2);
  });

  test("3 scores → status calculado, confianca MEDIA", () => {
    const trend = calcularMarkerTrend(s(60, 55, 50), "acne", 42);
    expect(trend.status).not.toBe("INSUFICIENTE");
    expect(trend.confianca).toBe("MEDIA");
    expect(trend.snapshotsUsados).toBe(3);
  });

  test("5 scores → status calculado, confianca ALTA", () => {
    const trend = calcularMarkerTrend(s(80, 70, 60, 50, 40), "acne", 42);
    expect(trend.status).not.toBe("INSUFICIENTE");
    expect(trend.confianca).toBe("ALTA");
    expect(trend.snapshotsUsados).toBe(5);
  });

  test("10 scores → usa apenas os últimos 5 (janela deslizante)", () => {
    // Primeiros 5: tendência crescente (piora). Últimos 5: decrescente (melhora).
    const trend = calcularMarkerTrend(
      s(40, 50, 60, 70, 80,   75, 65, 55, 45, 35),
      "acne",
      42
    );
    expect(trend.snapshotsUsados).toBe(5);
    expect(trend.status).toBe("MELHORANDO");
  });

  // INVARIANTE CRÍTICA: slope NEGATIVO = MELHORANDO
  // Esta lógica reflete que score MENOR = PELE MELHOR.
  // Inverter aqui quebraria toda a feature de tendências.
  test("série decrescente [80,70,60,50,40] → MELHORANDO e slope NEGATIVO", () => {
    const trend = calcularMarkerTrend(s(80, 70, 60, 50, 40), "acne", 42);
    expect(trend.status).toBe("MELHORANDO");
    expect(trend.slope).toBeLessThan(0); // slope negativo = score descendo = bom
  });

  // INVARIANTE CRÍTICA: slope POSITIVO = PIORANDO
  test("série crescente [40,50,60,70,80] → PIORANDO e slope POSITIVO", () => {
    const trend = calcularMarkerTrend(s(40, 50, 60, 70, 80), "acne", 42);
    expect(trend.status).toBe("PIORANDO");
    expect(trend.slope).toBeGreaterThan(0); // slope positivo = score subindo = ruim
  });

  test("série estável [50,51,49,50,51] → ESTAVEL", () => {
    const trend = calcularMarkerTrend(s(50, 51, 49, 50, 51), "acne", 42);
    expect(trend.status).toBe("ESTAVEL");
  });

  test("outlier em scan 3 não destrói tendência: [60,55,80,45,40] → MELHORANDO", () => {
    // scan 3 = outlier ruim (80). Janela de 5 atenua — slope ainda negativo.
    const trend = calcularMarkerTrend(s(60, 55, 80, 45, 40), "acne", 42);
    expect(trend.slope).toBeLessThan(0);
    expect(trend.status).toBe("MELHORANDO");
  });

  test("marcador correto preservado no retorno", () => {
    const trend = calcularMarkerTrend(s(60, 55, 50), "oleosidade", 42);
    expect(trend.marcador).toBe("oleosidade");
  });
});

// ─── assertTrendSuficiente ────────────────────────────────────────────────────

describe("assertTrendSuficiente", () => {
  test("lança quando TODOS os trends são INSUFICIENTE", () => {
    const todos: MarkerTrend[] = [
      { marcador: "acne",  status: "INSUFICIENTE", slope: 0, velocidade_por_semana: 0, snapshotsUsados: 1, confianca: "BAIXA" },
      { marcador: "poros", status: "INSUFICIENTE", slope: 0, velocidade_por_semana: 0, snapshotsUsados: 1, confianca: "BAIXA" },
    ];
    expect(() => assertTrendSuficiente(todos)).toThrow();
  });

  test("não lança quando pelo menos 1 trend não é INSUFICIENTE", () => {
    const misto: MarkerTrend[] = [
      { marcador: "acne",  status: "MELHORANDO",  slope: -2, velocidade_por_semana: 0.3, snapshotsUsados: 5, confianca: "ALTA" },
      { marcador: "poros", status: "INSUFICIENTE", slope: 0,  velocidade_por_semana: 0,   snapshotsUsados: 1, confianca: "BAIXA" },
    ];
    expect(() => assertTrendSuficiente(misto)).not.toThrow();
  });

  test("lança para lista vazia (0 === 0: todos insuficientes por vacuidade)", () => {
    expect(() => assertTrendSuficiente([])).toThrow();
  });
});
