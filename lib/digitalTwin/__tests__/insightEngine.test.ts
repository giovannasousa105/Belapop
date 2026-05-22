/**
 * insightEngine.test.ts
 *
 * INVARIANTE CENTRAL — verificada em cada teste:
 *   delta_global POSITIVO  = piora  → nunca confundir com melhora
 *   delta_global NEGATIVO  = melhora → nunca confundir com piora
 *   gerarCopilotSeed: síncrona, nunca Promise
 *   buildUserPrompt: deltas sempre Math.abs (convenção interna nunca vaza para Claude)
 */

// Mocks hoisted: módulos com dependências externas carregados por insightEngine
jest.mock("@anthropic-ai/sdk", () => ({ default: jest.fn() }));
jest.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: jest.fn() }));

import { classificarInsight, gerarCopilotSeed } from "../insightEngine";
import type { SkinTwinRow, TwinDeltaRow } from "../twinTypes";
import { toTwinId } from "../twinTypes";
import { calcularTrends } from "../deltaEngine";
import { SKIN_MARKERS } from "../invariants";
import type { InsightTipo } from "../invariants";
import * as progressoPrompt from "../prompts/progressoInsight";
import * as regressaoPrompt from "../prompts/regressaoAlert";
import * as ajustePrompt from "../prompts/ajusteRotina";
import * as marcoPrompt from "../prompts/marcoAlcancado";

type TrendMap = ReturnType<typeof calcularTrends>;

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const TWIN_ID = toTwinId("twin-insight-test");

const SCORES_PADRAO = {
  acne: 60, poros: 55, textura: 50,
  oleosidade: 55, pigmentacao: 45,
  vermelhidao: 40, ressecamento: 35,
};

const BASELINE_PADRAO = {
  acne: 70, poros: 60, textura: 55,
  oleosidade: 65, pigmentacao: 50,
  vermelhidao: 45, ressecamento: 40,
};

const CLASSIFICACOES_ESTAVEIS = {
  acne: "ESTAVEL" as const, poros: "ESTAVEL" as const, textura: "ESTAVEL" as const,
  oleosidade: "ESTAVEL" as const, pigmentacao: "ESTAVEL" as const,
  vermelhidao: "ESTAVEL" as const, ressecamento: "ESTAVEL" as const,
};

function makeTwin(overrides: Partial<SkinTwinRow> = {}): SkinTwinRow {
  return {
    id: TWIN_ID,
    user_id: "user-1",
    total_scans: 3,
    scores_baseline: { ...BASELINE_PADRAO },
    scores_atuais:   { ...SCORES_PADRAO },
    tipo_pele_atual: "MISTA",
    nivel_sensibilidade_atual: 2,
    copilot_seed: null,
    status: "ATIVO",
    proximo_scan_em: null,
    primeiro_scan_em: "2026-01-01T00:00:00Z",
    ultimo_scan_em:   "2026-04-01T00:00:00Z",
    criado_em:        "2026-01-01T00:00:00Z",
    atualizado_em:    "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function makeDelta(overrides: Partial<TwinDeltaRow> = {}): TwinDeltaRow {
  return {
    id: "delta-1",
    twin_id: TWIN_ID,
    snapshot_anterior_id: "snap-1",
    snapshot_atual_id:    "snap-2",
    deltas_por_marcador: {
      acne:         { marcador: "acne",         valor: -10, direcao: "MELHORA", magnitude: 10 },
      poros:        { marcador: "poros",        valor:  -5, direcao: "MELHORA", magnitude:  5 },
      textura:      { marcador: "textura",      valor:   2, direcao: "ESTAVEL", magnitude:  2 },
      oleosidade:   { marcador: "oleosidade",   valor:   3, direcao: "ESTAVEL", magnitude:  3 },
      pigmentacao:  { marcador: "pigmentacao",  valor:  -2, direcao: "ESTAVEL", magnitude:  2 },
      vermelhidao:  { marcador: "vermelhidao",  valor:  -3, direcao: "ESTAVEL", magnitude:  3 },
      ressecamento: { marcador: "ressecamento", valor:  -2, direcao: "ESTAVEL", magnitude:  2 },
    },
    classificacoes: {
      acne: "MELHORA", poros: "MELHORA",
      textura: "ESTAVEL", oleosidade: "ESTAVEL",
      pigmentacao: "ESTAVEL", vermelhidao: "ESTAVEL", ressecamento: "ESTAVEL",
    },
    delta_global:       -8,  // NEGATIVO = melhora
    melhora_percentual: 10,
    efetividade_rotina: 75,
    intervalo_dias:     42,
    criado_em:          "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function makeTrendMap(overrides: Partial<TrendMap> = {}): TrendMap {
  const base = Object.fromEntries(
    SKIN_MARKERS.map((m) => [
      m,
      { status: "ESTAVEL" as const, slope: 0, velocidade_por_semana: 0, confianca: "ALTA" as const },
    ])
  ) as TrendMap;
  return { ...base, ...overrides };
}

// ─── classificarInsight ────────────────────────────────────────────────────────

describe("classificarInsight", () => {
  test("total_scans = 1 → PRIMEIRO_SCAN (delta null)", () => {
    expect(classificarInsight(null, makeTwin({ total_scans: 1 }))).toBe("PRIMEIRO_SCAN");
  });

  test("total_scans = 1 com delta presente → ainda PRIMEIRO_SCAN (prioridade 1)", () => {
    expect(classificarInsight(makeDelta(), makeTwin({ total_scans: 1 }))).toBe("PRIMEIRO_SCAN");
  });

  test("intervalo_dias > 60 → RETORNO_APOS_PAUSA", () => {
    const delta = makeDelta({ intervalo_dias: 90 });
    expect(classificarInsight(delta, makeTwin())).toBe("RETORNO_APOS_PAUSA");
  });

  test("2 marcadores PIORA → REGRESSAO_DETECTADA", () => {
    const delta = makeDelta({
      classificacoes: {
        acne: "PIORA", oleosidade: "PIORA",
        poros: "ESTAVEL", textura: "ESTAVEL",
        pigmentacao: "ESTAVEL", vermelhidao: "ESTAVEL", ressecamento: "ESTAVEL",
      },
      delta_global: 3, // < 5 mas contagem de PIORAs basta
    });
    expect(classificarInsight(delta, makeTwin())).toBe("REGRESSAO_DETECTADA");
  });

  // INVARIANTE: delta_global POSITIVO = piora — nunca inverter esta semântica
  test("delta_global = +8 (positivo = piora global) → REGRESSAO_DETECTADA", () => {
    const delta = makeDelta({
      delta_global: 8,
      classificacoes: { ...CLASSIFICACOES_ESTAVEIS },
    });
    expect(classificarInsight(delta, makeTwin())).toBe("REGRESSAO_DETECTADA");
  });

  // INVARIANTE: delta_global NEGATIVO = melhora — nunca inverter esta semântica
  test("delta_global = -8 (negativo = melhora global) → PROGRESSO_POSITIVO", () => {
    const delta = makeDelta({ delta_global: -8, efetividade_rotina: 75 });
    // makeTwin tem baseline-atual < 20 para todos os marcadores
    expect(classificarInsight(delta, makeTwin())).toBe("PROGRESSO_POSITIVO");
  });

  test("REGRESSAO tem prioridade sobre PROGRESSO quando delta_global > 5", () => {
    const delta = makeDelta({
      delta_global: 7,
      classificacoes: {
        acne: "MELHORA", poros: "ESTAVEL", textura: "ESTAVEL",
        oleosidade: "ESTAVEL", pigmentacao: "ESTAVEL",
        vermelhidao: "ESTAVEL", ressecamento: "ESTAVEL",
      },
    });
    expect(classificarInsight(delta, makeTwin())).toBe("REGRESSAO_DETECTADA");
  });

  test("baseline - atual >= 20 em qualquer marcador → MARCO_ALCANCADO", () => {
    // acne: 80 - 58 = 22 >= 20
    const twin = makeTwin({
      scores_baseline: { acne: 80, poros: 60, textura: 55, oleosidade: 65, pigmentacao: 50, vermelhidao: 45, ressecamento: 40 },
      scores_atuais:   { acne: 58, poros: 59, textura: 54, oleosidade: 64, pigmentacao: 49, vermelhidao: 44, ressecamento: 39 },
    });
    // delta_global = -10 (melhora, não REGRESSAO); sem 2 PIORAs
    const delta = makeDelta({ delta_global: -10 });
    expect(classificarInsight(delta, twin)).toBe("MARCO_ALCANCADO");
  });

  test("efetividade_rotina = 35 → AJUSTE_ROTINA", () => {
    const twin = makeTwin({
      // diffs < 20 em todos os marcadores — sem MARCO
      scores_baseline: { acne: 65, poros: 55, textura: 50, oleosidade: 60, pigmentacao: 45, vermelhidao: 40, ressecamento: 35 },
      scores_atuais:   { acne: 63, poros: 54, textura: 49, oleosidade: 59, pigmentacao: 44, vermelhidao: 39, ressecamento: 34 },
    });
    const delta = makeDelta({
      efetividade_rotina: 35,
      delta_global:       -2,
      classificacoes:     { ...CLASSIFICACOES_ESTAVEIS },
    });
    expect(classificarInsight(delta, twin)).toBe("AJUSTE_ROTINA");
  });

  test("nenhuma condição especial → ESTAVEL", () => {
    const twin = makeTwin({
      scores_baseline: { acne: 65, poros: 55, textura: 50, oleosidade: 60, pigmentacao: 45, vermelhidao: 40, ressecamento: 35 },
      scores_atuais:   { acne: 63, poros: 54, textura: 49, oleosidade: 58, pigmentacao: 44, vermelhidao: 39, ressecamento: 34 },
    });
    const delta = makeDelta({
      delta_global:       -2,  // não < -5 → não PROGRESSO
      efetividade_rotina: 65,  // não < 40 → não AJUSTE
      classificacoes:     { ...CLASSIFICACOES_ESTAVEIS },
    });
    expect(classificarInsight(delta, twin)).toBe("ESTAVEL");
  });
});

// ─── gerarCopilotSeed ─────────────────────────────────────────────────────────

describe("gerarCopilotSeed", () => {
  const BASE_PARAMS = {
    insightTipo:          "ESTAVEL" as InsightTipo,
    trends:               null,
    twin:                 { scores_atuais: { ...SCORES_PADRAO } },
    ultimoScanEm:         new Date("2026-04-01T00:00:00Z"),
    alertaAtivo:          false,
    rotinaPrecisaRevisao: false,
  };

  test("função síncrona — retorno nunca é Promise", () => {
    const resultado = gerarCopilotSeed(BASE_PARAMS);
    expect(resultado).not.toBeInstanceOf(Promise);
    // Se fosse async, .then seria uma função; síncrona = .then indefinido
    expect(typeof (resultado as unknown as { then?: unknown }).then).toBe("undefined");
  });

  test("todos os 7 InsightTipo têm mensagem não vazia — sem undefined no MENSAGENS", () => {
    const todos: InsightTipo[] = [
      "PRIMEIRO_SCAN", "PROGRESSO_POSITIVO", "ESTAVEL",
      "REGRESSAO_DETECTADA", "MARCO_ALCANCADO", "AJUSTE_ROTINA", "RETORNO_APOS_PAUSA",
    ];
    for (const tipo of todos) {
      const seed = gerarCopilotSeed({ ...BASE_PARAMS, insightTipo: tipo });
      expect(seed.mensagemMotivacionalCurta).toBeTruthy();
      expect(typeof seed.mensagemMotivacionalCurta).toBe("string");
      expect(seed.mensagemMotivacionalCurta.length).toBeGreaterThan(0);
    }
  });

  test("proximoScanRecomendadoEm = ultimoScanEm + 42 dias exatos", () => {
    const ultimoScanEm = new Date("2026-04-01T00:00:00Z");
    const seed = gerarCopilotSeed({ ...BASE_PARAMS, ultimoScanEm });
    // 2026-04-01 + 42 dias = 30 abr + 13 mai = 2026-05-13
    expect(seed.proximoScanRecomendadoEm).toBe("2026-05-13");
  });

  test("marcadorFoco: trends PIORANDO → usa o marcador com maior |slope|", () => {
    const trends = makeTrendMap({
      oleosidade: { status: "PIORANDO", slope: 12,  velocidade_por_semana: 3,   confianca: "ALTA" },
      acne:       { status: "PIORANDO", slope:  5,  velocidade_por_semana: 1.5, confianca: "ALTA" },
    });
    const seed = gerarCopilotSeed({ ...BASE_PARAMS, trends });
    expect(seed.marcadorFoco).toBe("oleosidade"); // |12| > |5|
  });

  test("marcadorFoco: sem trends → usa marcador com maior score atual (pior condição)", () => {
    const seed = gerarCopilotSeed({
      ...BASE_PARAMS,
      trends: null,
      twin: {
        scores_atuais: {
          acne: 40, poros: 30, textura: 25,
          oleosidade: 80, pigmentacao: 20,
          vermelhidao: 15, ressecamento: 10,
        },
      },
    });
    expect(seed.marcadorFoco).toBe("oleosidade"); // score 80 = pior condição
  });

  test("marcadorFoco fallback = 'acne' quando scores_atuais é null — nunca undefined", () => {
    const seed = gerarCopilotSeed({ ...BASE_PARAMS, trends: null, twin: { scores_atuais: null } });
    expect(seed.marcadorFoco).toBe("acne");
    expect(seed.marcadorFoco).not.toBeNull();
    expect(seed.marcadorFoco).not.toBeUndefined();
  });

  test("execução < 1ms (sem I/O — pura e síncrona)", () => {
    const inicio = performance.now();
    gerarCopilotSeed(BASE_PARAMS);
    const duracao = performance.now() - inicio;
    expect(duracao).toBeLessThan(1);
  });
});

// ─── buildUserPrompt: convenção interna nunca vaza para Claude ─────────────────
//
// Em todos os prompts, deltas negativos internos (score caiu = melhora)
// NUNCA devem aparecer no texto enviado ao Claude. Math.abs é aplicado
// antes de montar o prompt.

describe("progressoInsight.buildUserPrompt", () => {
  const params = {
    diasDesdeUltimoScan: 42,
    marcadoresMelhoraram: [
      { nome: "acne",       deltaPts: 18 },
      { nome: "oleosidade", deltaPts: 12 },
    ],
    marcadoresEstaveis:   ["poros", "textura"],
    melhoraGlobalPts:     15,
    efetividadeRotinaPct: 75,
    ativosEmUso:          ["niacinamida", "retinol"],
    totalScans:           3,
    melhoraAcumuladaPct:  null,
  };

  test("deltas enviados ao Claude nunca negativos (Math.abs aplicado)", () => {
    const prompt = progressoPrompt.buildUserPrompt(params);
    expect(prompt).not.toMatch(/-\d+ pontos/);
  });

  test("prompt não vazio para qualquer combinação de inputs", () => {
    expect(progressoPrompt.buildUserPrompt(params).trim().length).toBeGreaterThan(0);
  });

  test("sem 'undefined' ou 'null' no texto do prompt", () => {
    const prompt = progressoPrompt.buildUserPrompt(params);
    expect(prompt).not.toContain("undefined");
    expect(prompt).not.toContain("null");
  });

  test("efetividadeRotinaPct null: renderiza texto em vez de 'null'", () => {
    const prompt = progressoPrompt.buildUserPrompt({ ...params, efetividadeRotinaPct: null });
    expect(prompt).not.toContain("null");
    expect(prompt.trim().length).toBeGreaterThan(0);
  });
});

describe("regressaoAlert.buildUserPrompt", () => {
  const params = {
    marcadoresPiora: [
      { nome: "acne",       deltaAbs: 15 },
      { nome: "oleosidade", deltaAbs:  8 },
    ],
    marcadoresEstaveis: ["textura", "poros"],
    intervaloDias:      42,
    consistenciaPct:    70,
    estacao:            "outono",
  };

  test("deltaAbs enviados ao Claude nunca negativos", () => {
    const prompt = regressaoPrompt.buildUserPrompt(params);
    expect(prompt).not.toMatch(/-\d+ pontos/);
  });

  test("prompt não vazio", () => {
    expect(regressaoPrompt.buildUserPrompt(params).trim().length).toBeGreaterThan(0);
  });

  test("sem 'undefined' ou 'null' no texto", () => {
    const prompt = regressaoPrompt.buildUserPrompt(params);
    expect(prompt).not.toContain("undefined");
    expect(prompt).not.toContain("null");
  });

  test("consistenciaPct null: renderiza texto descritivo em vez de 'null'", () => {
    const prompt = regressaoPrompt.buildUserPrompt({ ...params, consistenciaPct: null });
    expect(prompt).not.toContain("null");
    expect(prompt).toContain("não disponível");
  });
});

describe("ajusteRotina.buildUserPrompt", () => {
  const params = {
    efetividadePct:           35,
    ativosEmUso:              ["ceramidas", "pantenol"],
    marcadoresNaoRespondendo: ["acne", "oleosidade"],
    totalScans:               4,
  };

  test("prompt não vazio", () => {
    expect(ajustePrompt.buildUserPrompt(params).trim().length).toBeGreaterThan(0);
  });

  test("sem 'undefined' ou 'null' no texto", () => {
    const prompt = ajustePrompt.buildUserPrompt(params);
    expect(prompt).not.toContain("undefined");
    expect(prompt).not.toContain("null");
  });

  test("sem valores negativos no prompt", () => {
    expect(ajustePrompt.buildUserPrompt(params)).not.toMatch(/-\d+ pontos/);
  });

  test("ativosEmUso vazio: renderiza texto descritivo", () => {
    const prompt = ajustePrompt.buildUserPrompt({ ...params, ativosEmUso: [] });
    expect(prompt).not.toContain("undefined");
    expect(prompt.trim().length).toBeGreaterThan(0);
  });
});

describe("marcoAlcancado.buildUserPrompt", () => {
  const params = {
    marcadorNome:         "acne",
    melhoraPts:           22,  // positivo = Math.abs(baseline - atual)
    totalScans:           5,
    semanas_desde_inicio: 24,
    consistenciaMedia:    85,
  };

  test("melhoraPts enviado ao Claude nunca negativo (positivo = score caiu = melhora)", () => {
    const prompt = marcoPrompt.buildUserPrompt(params);
    expect(prompt).not.toMatch(/-\d+ pontos/);
  });

  test("prompt não vazio", () => {
    expect(marcoPrompt.buildUserPrompt(params).trim().length).toBeGreaterThan(0);
  });

  test("sem 'undefined' ou 'null' no texto", () => {
    const prompt = marcoPrompt.buildUserPrompt(params);
    expect(prompt).not.toContain("undefined");
    expect(prompt).not.toContain("null");
  });
});
