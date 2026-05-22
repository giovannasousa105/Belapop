import { calcularNivelSensibilidade, determinarTipoPele } from "../tiposPele";
import { calcularSkinProfile } from "../scoringClinico";
import type { SkinFeatureVector } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoresEq(overrides: Partial<Parameters<typeof determinarTipoPele>[0]> = {}) {
  return {
    acne: 30,
    poros: 30,
    textura: 30,
    oleosidade: 30,
    pigmentacao: 30,
    vermelhidao: 30,
    ressecamento: 30,
    ...overrides,
  };
}

function vectorBase(
  scores: Partial<SkinFeatureVector["scores"]> = {},
  fitz = 1
): SkinFeatureVector {
  return {
    scan_id: "test",
    face_detectada: true,
    fitzpatrick_estimado: fitz,
    confidence_geral: 0.8,
    flags: [],
    scores: {
      acne: 0.3,
      poros: 0.3,
      textura: 0.3,
      oleosidade: 0.3,
      pigmentacao: 0.3,
      vermelhidao: 0.3,
      ressecamento: 0.3,
      ...scores,
    },
  };
}

// ─── determinarTipoPele ───────────────────────────────────────────────────────

describe("determinarTipoPele", () => {
  describe("SENSIVEL — prioridade máxima", () => {
    it("vermelhidão > 60 → SENSIVEL independente dos outros scores", () => {
      expect(
        determinarTipoPele(scoresEq({ vermelhidao: 61, oleosidade: 70 }), [], [])
      ).toBe("SENSIVEL");
    });

    it("vermelhidão = 60 → NÃO é SENSIVEL (limite exclusivo)", () => {
      const tipo = determinarTipoPele(
        scoresEq({ vermelhidao: 60, oleosidade: 70, ressecamento: 20 }),
        [],
        []
      );
      expect(tipo).toBe("OLEOSA");
    });

    it("LOW_CONFIDENCE + foco 'sensibilidade' → SENSIVEL", () => {
      expect(
        determinarTipoPele(
          scoresEq({ vermelhidao: 40 }),
          ["LOW_CONFIDENCE"],
          ["sensibilidade"]
        )
      ).toBe("SENSIVEL");
    });

    it("LOW_CONFIDENCE sem foco 'sensibilidade' → NÃO é SENSIVEL por flag", () => {
      const tipo = determinarTipoPele(
        scoresEq({ vermelhidao: 40 }),
        ["LOW_CONFIDENCE"],
        ["acne"]
      );
      expect(tipo).not.toBe("SENSIVEL");
    });
  });

  describe("OLEOSA", () => {
    it("oleosidade > 65 e ressecamento < 35 → OLEOSA", () => {
      expect(
        determinarTipoPele(scoresEq({ oleosidade: 66, ressecamento: 34 }), [], [])
      ).toBe("OLEOSA");
    });

    it("oleosidade = 65 → NÃO é OLEOSA (limite exclusivo)", () => {
      const tipo = determinarTipoPele(
        scoresEq({ oleosidade: 65, ressecamento: 20 }),
        [],
        []
      );
      expect(tipo).not.toBe("OLEOSA");
    });

    it("oleosidade > 65 mas ressecamento >= 35 → não é OLEOSA pura", () => {
      const tipo = determinarTipoPele(
        scoresEq({ oleosidade: 70, ressecamento: 35 }),
        [],
        []
      );
      expect(tipo).toBe("MISTA");
    });
  });

  describe("MISTA", () => {
    it("oleosidade > 50 e ressecamento > 30 → MISTA", () => {
      expect(
        determinarTipoPele(scoresEq({ oleosidade: 55, ressecamento: 35 }), [], [])
      ).toBe("MISTA");
    });

    it("oleosidade = 50 → NÃO é MISTA", () => {
      const tipo = determinarTipoPele(
        scoresEq({ oleosidade: 50, ressecamento: 40 }),
        [],
        []
      );
      expect(tipo).not.toBe("MISTA");
    });
  });

  describe("SECA", () => {
    it("ressecamento > 55 → SECA", () => {
      expect(
        determinarTipoPele(scoresEq({ ressecamento: 56, oleosidade: 30 }), [], [])
      ).toBe("SECA");
    });

    it("oleosidade < 25 → SECA", () => {
      expect(
        determinarTipoPele(scoresEq({ oleosidade: 24, ressecamento: 30 }), [], [])
      ).toBe("SECA");
    });

    it("ressecamento = 55 e oleosidade >= 25 → NÃO é SECA", () => {
      const tipo = determinarTipoPele(
        scoresEq({ ressecamento: 55, oleosidade: 25 }),
        [],
        []
      );
      expect(tipo).toBe("NORMAL");
    });
  });

  describe("NORMAL — fallback", () => {
    it("todos os scores entre 20–55 → NORMAL", () => {
      expect(
        determinarTipoPele(
          scoresEq({ acne: 35, poros: 35, textura: 35, oleosidade: 35, ressecamento: 35, vermelhidao: 35, pigmentacao: 35 }),
          [],
          []
        )
      ).toBe("NORMAL");
    });

    it("scores zerados → NORMAL (oleosidade 0 ativa SECA, não NORMAL)", () => {
      // oleosidade < 25 → SECA tem prioridade sobre NORMAL
      expect(
        determinarTipoPele(
          scoresEq({ oleosidade: 0 }),
          [],
          []
        )
      ).toBe("SECA");
    });
  });
});

// ─── calcularNivelSensibilidade ───────────────────────────────────────────────

describe("calcularNivelSensibilidade", () => {
  it("nível 1: vermelhidão < 20 e acne < 20", () => {
    expect(calcularNivelSensibilidade(scoresEq({ vermelhidao: 19, acne: 19 }))).toBe(1);
  });

  it("nível 2: vermelhidão 20–34", () => {
    expect(calcularNivelSensibilidade(scoresEq({ vermelhidao: 25, acne: 10 }))).toBe(2);
  });

  it("nível 2: acne 20–34", () => {
    expect(calcularNivelSensibilidade(scoresEq({ vermelhidao: 10, acne: 30 }))).toBe(2);
  });

  it("nível 3: vermelhidão 35–55", () => {
    expect(calcularNivelSensibilidade(scoresEq({ vermelhidao: 45, acne: 10 }))).toBe(3);
  });

  it("nível 3: acne 35–55", () => {
    expect(calcularNivelSensibilidade(scoresEq({ vermelhidao: 10, acne: 50 }))).toBe(3);
  });

  it("nível 4: vermelhidão 56–70", () => {
    expect(calcularNivelSensibilidade(scoresEq({ vermelhidao: 60, acne: 10 }))).toBe(4);
  });

  it("nível 4: acne > 55", () => {
    expect(calcularNivelSensibilidade(scoresEq({ vermelhidao: 10, acne: 60 }))).toBe(4);
  });

  it("nível 5: vermelhidão > 70", () => {
    expect(calcularNivelSensibilidade(scoresEq({ vermelhidao: 71 }))).toBe(5);
  });
});

// ─── Correção Fitzpatrick via calcularSkinProfile ────────────────────────────

describe("Correção Fitzpatrick", () => {
  it("fototipo I e II: sem correção — scores inalterados", () => {
    for (const fitz of [1, 2]) {
      const p = calcularSkinProfile(vectorBase({ pigmentacao: 0.5 }, fitz));
      expect(p.scores_normalizados.pigmentacao).toBe(50);
    }
  });

  it("fototipo III: boost de 5% em pigmentação", () => {
    const p = calcularSkinProfile(vectorBase({ pigmentacao: 0.8 }, 3));
    expect(p.scores_normalizados.pigmentacao).toBe(Math.round(0.8 * 1.05 * 100));
  });

  it("fototipo IV: boost de 15% em pigmentação", () => {
    const p = calcularSkinProfile(vectorBase({ pigmentacao: 0.6 }, 4));
    expect(p.scores_normalizados.pigmentacao).toBe(Math.round(0.6 * 1.15 * 100));
  });

  it("fototipo V: boost de 25% em pigmentação", () => {
    const p = calcularSkinProfile(vectorBase({ pigmentacao: 0.7 }, 5));
    expect(p.scores_normalizados.pigmentacao).toBe(Math.round(0.7 * 1.25 * 100));
  });

  it("fototipo VI: boost de 35% em pigmentação, capped em 100", () => {
    const p = calcularSkinProfile(vectorBase({ pigmentacao: 0.95 }, 6));
    // 0.95 * 1.35 = 1.2825 → clamp → 1.0 → 100
    expect(p.scores_normalizados.pigmentacao).toBe(100);
  });

  it("fototipo VI: boost de 20% em vermelhidão", () => {
    const p = calcularSkinProfile(vectorBase({ vermelhidao: 0.5 }, 6));
    expect(p.scores_normalizados.vermelhidao).toBe(Math.round(0.5 * 1.2 * 100));
  });

  it("score de textura não é afetado pela correção de fototipo", () => {
    const p = calcularSkinProfile(vectorBase({ textura: 0.6 }, 6));
    expect(p.scores_normalizados.textura).toBe(60);
  });
});
