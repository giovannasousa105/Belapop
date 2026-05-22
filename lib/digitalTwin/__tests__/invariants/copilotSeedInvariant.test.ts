/**
 * copilotSeedInvariant.test.ts
 *
 * Verifica as invariantes do CopilotSeed:
 *   gerarCopilotSeed é SÍNCRONA e PURA — nunca retorna Promise
 *   Todos os 7 InsightTipo têm mensagem motivacional
 *   proximoScanRecomendadoEm = ultimoScanEm + 42 dias exatos
 *   marcadorFoco: PIORANDO prioritário > maior |slope| > fallback 'acne'
 *   assertSeedValido lança para campos inválidos
 */

import {
  gerarCopilotSeed,
  assertSeedValido,
} from "@/lib/digitalTwin/invariants/copilotSeedInvariant";
import type { InsightTipo, CopilotSeed } from "@/lib/digitalTwin/invariants/copilotSeedInvariant";
import type { MarkerTrend } from "@/lib/digitalTwin/invariants/trendWindowInvariant";

const SEM_TRENDS: MarkerTrend[] = [];

const BASE_PARAMS = {
  insightTipo: "ESTAVEL" as InsightTipo,
  trends:      SEM_TRENDS,
  ultimoScanEm: new Date("2026-04-01T00:00:00Z"),
  alertaAtivo:          false,
  rotinaPrecisaRevisao: false,
};

// ─── gerarCopilotSeed ─────────────────────────────────────────────────────────

describe("gerarCopilotSeed", () => {
  test("retorna CopilotSeed síncrono — nunca Promise", () => {
    const resultado = gerarCopilotSeed(BASE_PARAMS);
    expect(resultado).not.toBeInstanceOf(Promise);
    expect(typeof (resultado as unknown as { then?: unknown }).then).toBe("undefined");
  });

  test("todos os 7 InsightTipo têm mensagem motivacional não vazia", () => {
    const todos: InsightTipo[] = [
      "PRIMEIRO_SCAN", "PROGRESSO_POSITIVO", "ESTAVEL",
      "REGRESSAO_DETECTADA", "MARCO_ALCANCADO", "AJUSTE_ROTINA", "RETORNO_APOS_PAUSA",
    ];
    for (const tipo of todos) {
      const seed = gerarCopilotSeed({ ...BASE_PARAMS, insightTipo: tipo });
      expect(seed.mensagemMotivacionalCurta).toBeTruthy();
      expect(seed.mensagemMotivacionalCurta.length).toBeGreaterThan(0);
    }
  });

  test("proximoScanRecomendadoEm = ultimoScanEm + 42 dias exatos", () => {
    const ultimoScanEm = new Date("2026-04-01T00:00:00Z");
    const seed = gerarCopilotSeed({ ...BASE_PARAMS, ultimoScanEm });
    // 2026-04-01 + 42 = 2026-05-13
    expect(seed.proximoScanRecomendadoEm).toBe("2026-05-13");
  });

  test("marcadorFoco: PIORANDO prioritário — usa o com maior |slope|", () => {
    const trends: MarkerTrend[] = [
      { marcador: "acne",      status: "PIORANDO",   slope:  5, velocidade_por_semana: 1.5, snapshotsUsados: 5, confianca: "ALTA" },
      { marcador: "oleosidade",status: "PIORANDO",   slope: 12, velocidade_por_semana: 3,   snapshotsUsados: 5, confianca: "ALTA" },
      { marcador: "poros",     status: "MELHORANDO", slope: -8, velocidade_por_semana: 2,   snapshotsUsados: 5, confianca: "ALTA" },
    ];
    const seed = gerarCopilotSeed({ ...BASE_PARAMS, trends });
    expect(seed.marcadorFoco).toBe("oleosidade"); // |12| > |5|
  });

  test("marcadorFoco: sem PIORANDO — usa primeiro não-INSUFICIENTE por |slope|", () => {
    const trends: MarkerTrend[] = [
      { marcador: "textura",   status: "MELHORANDO", slope: -3, velocidade_por_semana: 0.8, snapshotsUsados: 5, confianca: "ALTA" },
      { marcador: "pigmentacao",status: "MELHORANDO", slope: -8, velocidade_por_semana: 2,   snapshotsUsados: 5, confianca: "ALTA" },
    ];
    const seed = gerarCopilotSeed({ ...BASE_PARAMS, trends });
    // Não PIORANDO; sort por |slope| desc → |8| > |3| → pigmentacao
    expect(seed.marcadorFoco).toBe("pigmentacao");
  });

  test("marcadorFoco fallback = 'acne' quando sem trends não-INSUFICIENTE", () => {
    const seed = gerarCopilotSeed({ ...BASE_PARAMS, trends: [] });
    expect(seed.marcadorFoco).toBe("acne");
    expect(seed.marcadorFoco).not.toBeNull();
    expect(seed.marcadorFoco).not.toBeUndefined();
  });

  test("marcadorFoco fallback = 'acne' quando todos os trends são INSUFICIENTE", () => {
    const insuficientes: MarkerTrend[] = [
      { marcador: "acne", status: "INSUFICIENTE", slope: 0, velocidade_por_semana: 0, snapshotsUsados: 1, confianca: "BAIXA" },
      { marcador: "poros", status: "INSUFICIENTE", slope: 0, velocidade_por_semana: 0, snapshotsUsados: 1, confianca: "BAIXA" },
    ];
    const seed = gerarCopilotSeed({ ...BASE_PARAMS, trends: insuficientes });
    expect(seed.marcadorFoco).toBe("acne");
  });

  test("execução < 1ms — sem I/O (pura e síncrona)", () => {
    const inicio = performance.now();
    gerarCopilotSeed(BASE_PARAMS);
    const duracao = performance.now() - inicio;
    expect(duracao).toBeLessThan(1);
  });
});

// ─── assertSeedValido ─────────────────────────────────────────────────────────

describe("assertSeedValido", () => {
  const seedValido: CopilotSeed = {
    ultimoInsightTipo:         "ESTAVEL",
    marcadorFoco:              "acne",
    diasDesdeUltimoScan:       10,
    proximoScanRecomendadoEm:  "2026-05-13",
    alertaAtivo:               false,
    rotinaPrecisaRevisao:      false,
    mensagemMotivacionalCurta: "Estabilidade é progresso. Continue.",
  };

  test("não lança para seed completamente válido", () => {
    expect(() => assertSeedValido(seedValido)).not.toThrow();
  });

  test("lança para marcadorFoco inválido ('banana' não é SkinMarker)", () => {
    expect(() =>
      assertSeedValido({ ...seedValido, marcadorFoco: "banana" as never })
    ).toThrow();
  });

  test("lança para marcadorFoco vazio", () => {
    expect(() =>
      assertSeedValido({ ...seedValido, marcadorFoco: "" as never })
    ).toThrow();
  });

  test("lança para mensagemMotivacionalCurta vazia", () => {
    expect(() =>
      assertSeedValido({ ...seedValido, mensagemMotivacionalCurta: "" })
    ).toThrow();
  });

  test("aceita todos os 7 SkinMarker como marcadorFoco", () => {
    const marcadores = ["acne", "poros", "textura", "oleosidade", "pigmentacao", "vermelhidao", "ressecamento"] as const;
    for (const m of marcadores) {
      expect(() => assertSeedValido({ ...seedValido, marcadorFoco: m })).not.toThrow();
    }
  });
});
