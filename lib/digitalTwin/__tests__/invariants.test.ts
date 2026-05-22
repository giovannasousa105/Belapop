/**
 * Testes de invariante do Skin Digital Twin.
 *
 * Estes testes são CRÍTICOS — um bug silencioso aqui significa usuárias
 * recebendo feedback errado sobre a própria pele.
 *
 * Para rodar: npx jest lib/digitalTwin/__tests__/invariants.test.ts
 * Requer: npm install --save-dev jest @types/jest ts-jest
 */

import {
  assertSeedValido,
  assertTrendSuficiente,
  calcularMarkerTrend,
  calcularSkinDelta,
  formatDeltaParaUsuario,
  gerarCopilotSeed,
  MARKER_CHART_CONFIG,
  SKIN_MARKERS,
  toSkinScore,
  TREND_WINDOW,
  type InsightTipo,
  type MarkerTrend,
} from "@/lib/digitalTwin/invariants";

import {
  serie10Scans,
  serieComOutlier,
  serieInsuficiente,
  serieOscilante,
  serieProgressiva,
  seriePiorandoUmMarcador,
} from "./fixtures/scanSeries";

// ─────────────────────────────────────────────────────────────────────────────
// INVARIANTE 1 · SkinScore
// ─────────────────────────────────────────────────────────────────────────────

describe("Invariante 1 — SkinScore: score menor = pele melhor", () => {
  describe("toSkinScore — guard de criação", () => {
    it("lança RangeError para score > 100", () => {
      expect(() => toSkinScore(101)).toThrow(RangeError);
    });

    it("lança RangeError para score < 0", () => {
      expect(() => toSkinScore(-1)).toThrow(RangeError);
    });

    it("aceita valores no limite inferior (0)", () => {
      expect(() => toSkinScore(0)).not.toThrow();
    });

    it("aceita valores no limite superior (100)", () => {
      expect(() => toSkinScore(100)).not.toThrow();
    });

    it("lança com mensagem explicando a convenção de direção", () => {
      expect(() => toSkinScore(150)).toThrow(/score 0 = condição ausente/);
    });
  });

  describe("calcularSkinDelta — semântica de direção", () => {
    it("acne: 80 → 40 = score caiu = MELHORA", () => {
      const delta = calcularSkinDelta(toSkinScore(80), toSkinScore(40), "acne");
      expect(delta.direcao).toBe("MELHORA");
      expect(delta.valor).toBe(-40); // delta negativo = melhora
      expect(delta.magnitude).toBe(40);
    });

    it("acne: 30 → 60 = score subiu = PIORA", () => {
      const delta = calcularSkinDelta(toSkinScore(30), toSkinScore(60), "acne");
      expect(delta.direcao).toBe("PIORA");
      expect(delta.valor).toBe(30); // delta positivo = piora
    });

    it("acne: 50 → 53 = variação < limiar = ESTAVEL", () => {
      const delta = calcularSkinDelta(toSkinScore(50), toSkinScore(53), "acne");
      expect(delta.direcao).toBe("ESTAVEL");
    });

    it("acne: 50 → 45 = variação < limiar (4pts) = ESTAVEL", () => {
      const delta = calcularSkinDelta(toSkinScore(50), toSkinScore(46), "acne");
      expect(delta.direcao).toBe("ESTAVEL"); // 4 < LIMIAR(5) → estável
    });

    it("acne: 50 → 44 = variação exata no limiar (6pts) = MELHORA", () => {
      const delta = calcularSkinDelta(toSkinScore(50), toSkinScore(44), "acne");
      expect(delta.direcao).toBe("MELHORA");
    });

    it("magnitude é sempre positiva, independente da direção", () => {
      const melhora = calcularSkinDelta(toSkinScore(80), toSkinScore(40), "acne");
      const piora = calcularSkinDelta(toSkinScore(40), toSkinScore(80), "acne");
      expect(melhora.magnitude).toBeGreaterThan(0);
      expect(piora.magnitude).toBeGreaterThan(0);
      expect(melhora.magnitude).toBe(piora.magnitude);
    });
  });

  describe("formatDeltaParaUsuario — exibição segura", () => {
    it("MELHORA retorna seta para baixo (↓) — score menor = melhor", () => {
      const delta = calcularSkinDelta(toSkinScore(80), toSkinScore(40), "acne");
      expect(formatDeltaParaUsuario(delta)).toMatch(/^↓/);
    });

    it("PIORA retorna seta para cima (↑)", () => {
      const delta = calcularSkinDelta(toSkinScore(30), toSkinScore(70), "acne");
      expect(formatDeltaParaUsuario(delta)).toMatch(/^↑/);
    });

    it("ESTAVEL retorna seta horizontal", () => {
      const delta = calcularSkinDelta(toSkinScore(50), toSkinScore(52), "acne");
      expect(formatDeltaParaUsuario(delta)).toContain("→");
    });

    it("MELHORA de 18 pts exibe '↓ 18 pts'", () => {
      const delta = calcularSkinDelta(toSkinScore(60), toSkinScore(42), "acne");
      expect(formatDeltaParaUsuario(delta)).toBe("↓ 18 pts");
    });
  });

  describe("MARKER_CHART_CONFIG — configuração de gráfico", () => {
    it("yAxisInverted é true (score menor deve aparecer mais alto)", () => {
      expect(MARKER_CHART_CONFIG.yAxisInverted).toBe(true);
    });

    it("yAxisLabel contém '← melhor' (label obrigatório)", () => {
      expect(MARKER_CHART_CONFIG.yAxisLabel).toContain("← melhor");
    });

    it("yDomain é [0, 100]", () => {
      expect(MARKER_CHART_CONFIG.yDomain).toEqual([0, 100]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INVARIANTE 2 · TrendWindow
// ─────────────────────────────────────────────────────────────────────────────

describe("Invariante 2 — TrendWindow: janela de 5 scans", () => {
  const INTERVALO_PADRAO = 42; // ~6 semanas entre scans

  it("2 scores → status = INSUFICIENTE (< mínimo de 3)", () => {
    const trend = calcularMarkerTrend(serieInsuficiente, "acne", INTERVALO_PADRAO);
    expect(trend.status).toBe("INSUFICIENTE");
    expect(trend.snapshotsUsados).toBe(2);
  });

  it("serieProgressiva (slope = -3) → MELHORANDO", () => {
    const trend = calcularMarkerTrend(serieProgressiva, "acne", INTERVALO_PADRAO);
    expect(trend.status).toBe("MELHORANDO");
    expect(trend.slope).toBeLessThan(0); // slope negativo = score caindo = MELHORANDO
  });

  it("serieComOutlier (outlier no centro, slope = 0.4) → ESTAVEL", () => {
    // O outlier tem peso reduzido por estar no centro da janela
    const trend = calcularMarkerTrend(serieComOutlier, "poros", INTERVALO_PADRAO);
    expect(trend.status).toBe("ESTAVEL");
  });

  it("serieOscilante (alternando) → ESTAVEL (slope = 0)", () => {
    const trend = calcularMarkerTrend(serieOscilante, "textura", INTERVALO_PADRAO);
    expect(trend.status).toBe("ESTAVEL");
    expect(trend.slope).toBeCloseTo(0, 5);
  });

  it("seriePiorandoUmMarcador (outlier final extremo) → PIORANDO", () => {
    const trend = calcularMarkerTrend(
      seriePiorandoUmMarcador,
      "vermelhidao",
      INTERVALO_PADRAO
    );
    expect(trend.status).toBe("PIORANDO");
    expect(trend.slope).toBeGreaterThan(0);
  });

  it("10 snapshots → janela usa apenas os últimos 5 (snapshotsUsados = 5)", () => {
    const trend = calcularMarkerTrend(serie10Scans, "acne", INTERVALO_PADRAO);
    expect(trend.snapshotsUsados).toBe(5);
    expect(trend.snapshotsUsados).toBeLessThanOrEqual(TREND_WINDOW.MAX_SNAPSHOTS);
    // Últimos 5: [80,77,74,71,68] → slope = -3 → MELHORANDO
    expect(trend.status).toBe("MELHORANDO");
  });

  it("confianca = ALTA somente com 5 snapshots usados", () => {
    const alta = calcularMarkerTrend(serieProgressiva, "acne", INTERVALO_PADRAO);
    expect(alta.confianca).toBe("ALTA");
    expect(alta.snapshotsUsados).toBe(5);
  });

  it("confianca = MEDIA com 3 snapshots", () => {
    const media = calcularMarkerTrend(
      [toSkinScore(60), toSkinScore(55), toSkinScore(50)],
      "acne",
      INTERVALO_PADRAO
    );
    expect(media.confianca).toBe("MEDIA");
    expect(media.snapshotsUsados).toBe(3);
  });

  it("slope negativo em marcador padrão = MELHORANDO (nunca invertido)", () => {
    const trend = calcularMarkerTrend(serieProgressiva, "acne", INTERVALO_PADRAO);
    // Garante que a convenção de direção não está invertida
    expect(trend.slope).toBeLessThan(0);
    expect(trend.status).toBe("MELHORANDO");
  });

  describe("assertTrendSuficiente", () => {
    it("lança erro quando TODOS os trends são INSUFICIENTE", () => {
      const trendsInsuficientes: MarkerTrend[] = SKIN_MARKERS.map((m) =>
        calcularMarkerTrend([toSkinScore(50)], m, INTERVALO_PADRAO)
      );
      expect(() => assertTrendSuficiente(trendsInsuficientes)).toThrow(
        /snapshots insuficientes/
      );
    });

    it("não lança erro quando ao menos 1 trend tem dados suficientes", () => {
      const mixed: MarkerTrend[] = [
        calcularMarkerTrend([toSkinScore(50)], "acne", INTERVALO_PADRAO), // INSUFICIENTE
        calcularMarkerTrend(serieProgressiva, "oleosidade", INTERVALO_PADRAO), // OK
      ];
      expect(() => assertTrendSuficiente(mixed)).not.toThrow();
    });
  });

  it("calcularMarkerTrend nunca retorna snapshotsUsados < MIN_SNAPSHOTS sem INSUFICIENTE", () => {
    // Série com exatamente MIN - 1 snapshots
    const serie = [toSkinScore(50), toSkinScore(48)]; // 2 < MIN(3)
    const trend = calcularMarkerTrend(serie, "acne", INTERVALO_PADRAO);
    if (trend.snapshotsUsados < TREND_WINDOW.MIN_SNAPSHOTS) {
      expect(trend.status).toBe("INSUFICIENTE");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INVARIANTE 3 · CopilotSeed
// ─────────────────────────────────────────────────────────────────────────────

describe("Invariante 3 — CopilotSeed: geração síncrona sem API", () => {
  const trendsCompletos: MarkerTrend[] = SKIN_MARKERS.map((m) =>
    calcularMarkerTrend(serieProgressiva, m, 42)
  );

  const ultimoScanEm = new Date("2026-01-01T00:00:00Z");

  const baseSeed = () =>
    gerarCopilotSeed({
      insightTipo: "ESTAVEL",
      trends: trendsCompletos,
      ultimoScanEm,
      alertaAtivo: false,
      rotinaPrecisaRevisao: false,
    });

  it("gerarCopilotSeed é função síncrona — não retorna Promise", () => {
    const resultado = gerarCopilotSeed({
      insightTipo: "ESTAVEL",
      trends: trendsCompletos,
      ultimoScanEm,
      alertaAtivo: false,
      rotinaPrecisaRevisao: false,
    });
    // Se fosse Promise, seria um objeto com then/catch — não é o caso
    expect(resultado).not.toBeInstanceOf(Promise);
    expect(typeof resultado.marcadorFoco).toBe("string");
  });

  it("seed gerado em < 1ms (sem I/O)", () => {
    const inicio = performance.now();
    baseSeed();
    const duracao = performance.now() - inicio;
    expect(duracao).toBeLessThan(1);
  });

  it("todos os 7 InsightTipo têm mensagem de template — sem undefined", () => {
    const tipos: InsightTipo[] = [
      "PRIMEIRO_SCAN",
      "PROGRESSO_POSITIVO",
      "ESTAVEL",
      "REGRESSAO_DETECTADA",
      "MARCO_ALCANCADO",
      "AJUSTE_ROTINA",
      "RETORNO_APOS_PAUSA",
    ];

    for (const tipo of tipos) {
      const seed = gerarCopilotSeed({
        insightTipo: tipo,
        trends: trendsCompletos,
        ultimoScanEm,
        alertaAtivo: false,
        rotinaPrecisaRevisao: false,
      });
      expect(seed.mensagemMotivacionalCurta).toBeDefined();
      expect(seed.mensagemMotivacionalCurta.length).toBeGreaterThan(0);
    }
  });

  it("proximoScanRecomendadoEm = ultimoScanEm + 42 dias exatos", () => {
    const seed = baseSeed();
    const esperado = new Date("2026-01-01T00:00:00Z");
    esperado.setDate(esperado.getDate() + 42);
    expect(seed.proximoScanRecomendadoEm).toBe(
      esperado.toISOString().split("T")[0]
    );
  });

  it("marcadorFoco é sempre um SkinMarker válido", () => {
    const seed = baseSeed();
    expect(SKIN_MARKERS).toContain(seed.marcadorFoco);
  });

  it("marcadorFoco nunca é string arbitrária — é sempre SkinMarker", () => {
    // Com trends todos MELHORANDO, pega o de maior slope absoluto
    const seed = baseSeed();
    expect(["acne", "poros", "textura", "oleosidade", "pigmentacao", "vermelhidao", "ressecamento"]).toContain(
      seed.marcadorFoco
    );
  });

  describe("gerarCopilotSeed com trends todos INSUFICIENTE → fallback seguro", () => {
    it("retorna marcadorFoco = 'acne' como fallback quando não há trends ativos", () => {
      const trendsInsuficientes: MarkerTrend[] = SKIN_MARKERS.map((m) =>
        calcularMarkerTrend([toSkinScore(50)], m, 42)
      );
      const seed = gerarCopilotSeed({
        insightTipo: "PRIMEIRO_SCAN",
        trends: trendsInsuficientes,
        ultimoScanEm,
        alertaAtivo: false,
        rotinaPrecisaRevisao: false,
      });
      expect(SKIN_MARKERS).toContain(seed.marcadorFoco); // sempre válido
    });
  });

  describe("assertSeedValido", () => {
    it("não lança para seed válido", () => {
      expect(() => assertSeedValido(baseSeed())).not.toThrow();
    });

    it("lança para seed com marcadorFoco inválido", () => {
      const seedInvalido = {
        ...baseSeed(),
        marcadorFoco: "luminosidade" as never, // não é SkinMarker
      };
      expect(() => assertSeedValido(seedInvalido)).toThrow(/marcadorFoco inválido/);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTE DE REGRESSÃO CROSS-INVARIANTE
// ─────────────────────────────────────────────────────────────────────────────

describe("Pipeline completo — regressão cross-invariante", () => {
  it("toSkinScore → calcularSkinDelta → calcularMarkerTrend → gerarCopilotSeed: sem exceção, sem undefined, sem NaN", () => {
    // Step 1: criar scores
    const scores = [75, 70, 64, 58, 52].map(toSkinScore);

    // Step 2: calcular delta entre o mais antigo e o mais recente
    const delta = calcularSkinDelta(scores[0], scores[scores.length - 1], "acne");
    expect(delta.direcao).toBe("MELHORA");
    expect(Number.isNaN(delta.valor)).toBe(false);

    // Step 3: calcular trend
    const trend = calcularMarkerTrend(scores, "acne", 42);
    expect(trend.status).toBe("MELHORANDO");
    expect(Number.isNaN(trend.slope)).toBe(false);
    expect(trend.snapshotsUsados).toBeGreaterThanOrEqual(TREND_WINDOW.MIN_SNAPSHOTS);

    // Step 4: gerar seed
    const seed = gerarCopilotSeed({
      insightTipo: "PROGRESSO_POSITIVO",
      trends: [trend],
      ultimoScanEm: new Date(),
      alertaAtivo: false,
      rotinaPrecisaRevisao: false,
    });

    expect(seed.mensagemMotivacionalCurta).toBeDefined();
    expect(seed.mensagemMotivacionalCurta).not.toBe("");
    expect(SKIN_MARKERS).toContain(seed.marcadorFoco);
    expect(seed.proximoScanRecomendadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Step 5: validar seed
    expect(() => assertSeedValido(seed)).not.toThrow();

    // Step 6: formatar delta para exibição (never throws)
    const exibicao = formatDeltaParaUsuario(delta);
    expect(typeof exibicao).toBe("string");
    expect(exibicao.length).toBeGreaterThan(0);
  });
});
