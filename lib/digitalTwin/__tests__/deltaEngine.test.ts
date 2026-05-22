/**
 * deltaEngine.test.ts
 *
 * INVARIANTE CENTRAL — verificada em cada teste:
 *   score MENOR = condição MELHORADA = pele melhorando
 *   delta NEGATIVO = melhora
 *   slope NEGATIVO = MELHORANDO
 *
 * Jamais inverter esta lógica.
 */

import {
  calcularDelta,
  calcularEfetividade,
  calcularTrends,
  calcularMelhoraGlobal,
  TREND_WINDOW,
} from "../deltaEngine";
import type { TwinSnapshotRow } from "../twinTypes";
import { toTwinId } from "../twinTypes";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const TWIN_ID = toTwinId("twin-test");

function snapshot(
  scores: Partial<Record<string, number>>,
  overrides: Partial<Pick<TwinSnapshotRow, "numero_sequencia" | "ativos_em_uso" | "criado_em">> = {}
): TwinSnapshotRow {
  const defaults: Record<string, number> = {
    acne: 50, poros: 50, textura: 50,
    oleosidade: 50, pigmentacao: 50,
    vermelhidao: 50, ressecamento: 50,
  };
  return {
    id: crypto.randomUUID(),
    twin_id: TWIN_ID,
    scan_id: crypto.randomUUID(),
    scores_normalizados: { ...defaults, ...scores },
    tipo_pele: "MISTA",
    nivel_sensibilidade: 2,
    focos_selecionados: [],
    ativos_em_uso: [],
    numero_sequencia: 1,
    criado_em: new Date().toISOString(),
    ...overrides,
  };
}

// ─── calcularDelta ─────────────────────────────────────────────────────────────

describe("calcularDelta", () => {
  test("acne 60→42: delta -18, classificacao MELHORA", () => {
    const ant = snapshot({ acne: 60 }, { ativos_em_uso: [] });
    const atu = snapshot({ acne: 42 });
    const { deltas_por_marcador, classificacoes } = calcularDelta(ant, atu);

    expect(deltas_por_marcador.acne).toBe(42 - 60); // -18
    expect(classificacoes.acne).toBe("MELHORA");
  });

  test("oleosidade 30→60: delta +30, classificacao PIORA", () => {
    const ant = snapshot({ oleosidade: 30 }, { ativos_em_uso: [] });
    const atu = snapshot({ oleosidade: 60 });
    const { deltas_por_marcador, classificacoes } = calcularDelta(ant, atu);

    expect(deltas_por_marcador.oleosidade).toBe(30);
    expect(classificacoes.oleosidade).toBe("PIORA");
  });

  test("textura 50→53: delta +3, classificacao ESTAVEL (abaixo do limiar 5)", () => {
    const ant = snapshot({ textura: 50 }, { ativos_em_uso: [] });
    const atu = snapshot({ textura: 53 });
    const { deltas_por_marcador, classificacoes } = calcularDelta(ant, atu);

    expect(deltas_por_marcador.textura).toBe(3);
    expect(classificacoes.textura).toBe("ESTAVEL");
  });

  test("delta_global NEGATIVO quando maioria dos marcadores melhorou", () => {
    // 5 marcadores melhoram (-10 cada), 2 pioram (+5 cada)
    const ant = snapshot(
      { acne: 60, poros: 60, textura: 60, oleosidade: 60, pigmentacao: 60, vermelhidao: 50, ressecamento: 50 },
      { ativos_em_uso: [] }
    );
    const atu = snapshot({ acne: 50, poros: 50, textura: 50, oleosidade: 50, pigmentacao: 50, vermelhidao: 55, ressecamento: 55 });
    const { delta_global } = calcularDelta(ant, atu);

    // delta_global NEGATIVO = melhora global — invariante central
    expect(delta_global).toBeLessThan(0);
  });

  test("delta_global POSITIVO quando maioria piorou", () => {
    const ant = snapshot(
      { acne: 30, poros: 30, textura: 30, oleosidade: 30, pigmentacao: 30, vermelhidao: 30, ressecamento: 30 },
      { ativos_em_uso: [] }
    );
    const atu = snapshot({ acne: 60, poros: 60, textura: 60, oleosidade: 60, pigmentacao: 60, vermelhidao: 60, ressecamento: 60 });
    const { delta_global } = calcularDelta(ant, atu);

    expect(delta_global).toBeGreaterThan(0);
  });
});

// ─── calcularEfetividade ───────────────────────────────────────────────────────

describe("calcularEfetividade", () => {
  test("sem ativos_em_uso: retorna null", () => {
    const result = calcularEfetividade([], {
      acne: "MELHORA", poros: "ESTAVEL", textura: "ESTAVEL",
      oleosidade: "MELHORA", pigmentacao: "ESTAVEL",
      vermelhidao: "ESTAVEL", ressecamento: "ESTAVEL",
    });
    expect(result).toBeNull();
  });

  test("niacinamida em uso + oleosidade melhorou: efetividade > 0", () => {
    // niacinamida atua em oleosidade + poros
    const result = calcularEfetividade(["niacinamida"], {
      acne: "ESTAVEL", poros: "ESTAVEL", textura: "ESTAVEL",
      oleosidade: "MELHORA", pigmentacao: "ESTAVEL",
      vermelhidao: "ESTAVEL", ressecamento: "ESTAVEL",
    });
    // 1 de 2 marcadores cobertos melhorou = 50%
    expect(result).toBeGreaterThan(0);
  });

  test("ceramidas em uso + ressecamento e vermelhidao melhoraram: efetividade 100", () => {
    // ceramidas atua em ressecamento + vermelhidao
    const result = calcularEfetividade(["ceramidas"], {
      acne: "ESTAVEL", poros: "ESTAVEL", textura: "ESTAVEL",
      oleosidade: "ESTAVEL", pigmentacao: "ESTAVEL",
      vermelhidao: "MELHORA", ressecamento: "MELHORA",
    });
    expect(result).toBe(100);
  });
});

// ─── calcularTrends ────────────────────────────────────────────────────────────

describe("calcularTrends", () => {
  test("2 snapshots: todos retornam INSUFICIENTE", () => {
    const snaps = [
      snapshot({ acne: 60 }, { numero_sequencia: 1, criado_em: "2026-01-01T00:00:00Z" }),
      snapshot({ acne: 55 }, { numero_sequencia: 2, criado_em: "2026-02-12T00:00:00Z" }),
    ];
    const result = calcularTrends(snaps);
    for (const m of Object.keys(result) as Array<keyof typeof result>) {
      expect(result[m].status).toBe("INSUFICIENTE");
    }
  });

  test("série progressiva 5 scans (scores caindo): todos MELHORANDO", () => {
    // acne cai 5 pontos por scan: 80, 75, 70, 65, 60
    const datas = [
      "2026-01-01", "2026-02-12", "2026-03-26",
      "2026-05-07", "2026-06-18",
    ];
    const snaps = [80, 75, 70, 65, 60].map((acne, i) =>
      snapshot({ acne, poros: acne, textura: acne, oleosidade: acne, pigmentacao: acne, vermelhidao: acne, ressecamento: acne },
        { numero_sequencia: i + 1, criado_em: `${datas[i]}T00:00:00Z` })
    );
    const result = calcularTrends(snaps);
    // slope negativo = MELHORANDO — NUNCA inverter
    expect(result.acne.status).toBe("MELHORANDO");
    expect(result.acne.slope).toBeLessThan(0);
  });

  test("slope negativo → MELHORANDO (NUNCA inverter)", () => {
    // Série com slope claramente negativo
    const datas = [
      "2026-01-01", "2026-02-12", "2026-03-26",
    ];
    const snaps = [70, 60, 50].map((acne, i) =>
      snapshot({ acne }, { numero_sequencia: i + 1, criado_em: `${datas[i]}T00:00:00Z` })
    );
    const result = calcularTrends(snaps);
    expect(result.acne.slope).toBeLessThan(0);
    expect(result.acne.status).toBe("MELHORANDO");
  });

  test("confianca ALTA apenas com 5 snapshots", () => {
    const datas = [
      "2026-01-01", "2026-02-12", "2026-03-26",
      "2026-05-07", "2026-06-18",
    ];
    const snaps = [80, 75, 70, 65, 60].map((v, i) =>
      snapshot({ acne: v }, { numero_sequencia: i + 1, criado_em: `${datas[i]}T00:00:00Z` })
    );
    expect(snaps.length).toBe(TREND_WINDOW.MAX_SNAPSHOTS);
    const result = calcularTrends(snaps);
    expect(result.acne.confianca).toBe("ALTA");
  });

  test("confianca MEDIA com 3 snapshots", () => {
    const datas = ["2026-01-01", "2026-02-12", "2026-03-26"];
    const snaps = [70, 65, 60].map((v, i) =>
      snapshot({ acne: v }, { numero_sequencia: i + 1, criado_em: `${datas[i]}T00:00:00Z` })
    );
    const result = calcularTrends(snaps);
    expect(result.acne.confianca).toBe("MEDIA");
  });

  test("série com outlier no scan 3: tendência não distorcida drasticamente", () => {
    // Série: 80, 75, 90 (outlier), 65, 60 — a regressão linear suaviza o outlier
    const datas = [
      "2026-01-01", "2026-02-12", "2026-03-26",
      "2026-05-07", "2026-06-18",
    ];
    const snaps = [80, 75, 90, 65, 60].map((v, i) =>
      snapshot({ acne: v }, { numero_sequencia: i + 1, criado_em: `${datas[i]}T00:00:00Z` })
    );
    const result = calcularTrends(snaps);
    // Com o outlier no meio, a tendência ainda deve ser detectável como melhora
    // slope deve ser negativo (tendência geral é de queda)
    expect(result.acne.slope).toBeLessThan(0);
  });
});

// ─── calcularMelhoraGlobal ─────────────────────────────────────────────────────

describe("calcularMelhoraGlobal", () => {
  test("scores atuais < baseline: melhora_global_pct POSITIVO", () => {
    // Score caiu = pele melhorou = retorno POSITIVO para exibição
    const baseline = { acne: 80, poros: 70, textura: 60, oleosidade: 70, pigmentacao: 50, vermelhidao: 40, ressecamento: 50 };
    const atual    = { acne: 60, poros: 55, textura: 45, oleosidade: 50, pigmentacao: 40, vermelhidao: 30, ressecamento: 40 };
    const result = calcularMelhoraGlobal(baseline, atual);
    // melhora_global_pct POSITIVO = pele melhorou — atenção: convenção especial desta função
    expect(result).toBeGreaterThan(0);
  });

  test("scores atuais > baseline: melhora_global_pct NEGATIVO (piora)", () => {
    const baseline = { acne: 40, poros: 40, textura: 40, oleosidade: 40, pigmentacao: 40, vermelhidao: 40, ressecamento: 40 };
    const atual    = { acne: 70, poros: 70, textura: 70, oleosidade: 70, pigmentacao: 70, vermelhidao: 70, ressecamento: 70 };
    const result = calcularMelhoraGlobal(baseline, atual);
    expect(result).toBeLessThan(0);
  });

  test("scores idênticos: melhora_global_pct = 0", () => {
    const scores = { acne: 50, poros: 50, textura: 50, oleosidade: 50, pigmentacao: 50, vermelhidao: 50, ressecamento: 50 };
    const result = calcularMelhoraGlobal(scores, scores);
    expect(result).toBe(0);
  });
});
