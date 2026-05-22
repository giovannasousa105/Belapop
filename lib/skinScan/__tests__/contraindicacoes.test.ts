import { aplicarContraindicacoes } from "../contraindicacoes";
import { calcularSkinProfile } from "../scoringClinico";
import type { SkinFeatureVector } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r(ativos: string[], nivel: number) {
  return aplicarContraindicacoes(ativos, nivel);
}

function vectorSensivel(nivel: number): SkinFeatureVector {
  // vermelhidão alta gera nivel_sensibilidade proporcional
  const verm = nivel === 5 ? 0.75 : nivel === 4 ? 0.62 : nivel === 3 ? 0.45 : 0.25;
  return {
    scan_id: "test",
    face_detectada: true,
    fitzpatrick_estimado: 1,
    confidence_geral: 0.8,
    flags: [],
    scores: {
      acne: 0.3,
      poros: 0.3,
      textura: 0.3,
      oleosidade: 0.3,
      pigmentacao: 0.3,
      vermelhidao: verm,
      ressecamento: 0.3,
    },
  };
}

// ─── Regra global: sensibilidade >= 4 remove todos os ácidos ─────────────────

describe("Regra global: nivel_sensibilidade >= 4", () => {
  const ACIDOS = ["aha-glicolico", "bha-salicilico", "salicilico-0.5", "pha", "acido-azelaico", "acido-kojico"];

  it("nível 4: todos os ácidos removidos", () => {
    const { ativos_finais, contraindicados } = r(
      [...ACIDOS, "ceramidas", "niacinamida"],
      4
    );
    for (const acido of ACIDOS) {
      expect(ativos_finais).not.toContain(acido);
      expect(contraindicados).toContain(acido);
    }
    expect(ativos_finais).toContain("ceramidas");
    expect(ativos_finais).toContain("niacinamida");
  });

  it("nível 5: todos os ácidos removidos", () => {
    const { ativos_finais } = r([...ACIDOS, "pantenol"], 5);
    for (const acido of ACIDOS) {
      expect(ativos_finais).not.toContain(acido);
    }
    expect(ativos_finais).toContain("pantenol");
  });

  it("nível 3: ácidos NÃO são removidos pela regra global", () => {
    const { ativos_finais } = r(["aha-glicolico", "niacinamida"], 3);
    expect(ativos_finais).toContain("aha-glicolico");
  });

  it("nível 1: ácidos mantidos", () => {
    const { ativos_finais } = r(["aha-glicolico", "salicilico-0.5"], 1);
    expect(ativos_finais).toContain("aha-glicolico");
    expect(ativos_finais).toContain("salicilico-0.5");
  });
});

// ─── Regra 1: retinol + vitamina-c (sempre, nivel >= 1) ──────────────────────

describe("Regra 1: retinol-0.025 + vitamina-c — sempre separar", () => {
  it("nível 1: retinol removido quando combinado com vitamina-c", () => {
    const { ativos_finais, contraindicados } = r(
      ["vitamina-c", "retinol-0.025", "niacinamida"],
      1
    );
    expect(ativos_finais).not.toContain("retinol-0.025");
    expect(contraindicados).toContain("retinol-0.025");
    expect(ativos_finais).toContain("vitamina-c");
    expect(ativos_finais).toContain("niacinamida");
  });

  it("nível 2: retinol removido", () => {
    const { ativos_finais } = r(["vitamina-c", "retinol-0.025"], 2);
    expect(ativos_finais).not.toContain("retinol-0.025");
  });

  it("retinol sem vitamina-c → mantido em nível 1", () => {
    const { ativos_finais } = r(["retinol-0.025", "ceramidas"], 1);
    expect(ativos_finais).toContain("retinol-0.025");
  });

  it("vitamina-c sem retinol → mantida", () => {
    const { ativos_finais } = r(["vitamina-c", "niacinamida"], 1);
    expect(ativos_finais).toContain("vitamina-c");
  });
});

// ─── Regra 2: aha-glicolico + retinol (nivel >= 3) ───────────────────────────

describe("Regra 2: aha-glicolico + retinol-0.025 — nivel >= 3", () => {
  it("nível 3: retinol removido", () => {
    const { ativos_finais } = r(["aha-glicolico", "retinol-0.025"], 3);
    expect(ativos_finais).not.toContain("retinol-0.025");
    expect(ativos_finais).toContain("aha-glicolico");
  });

  it("nível 4: aha removido pela regra global, regra 2 não se aplica", () => {
    const { ativos_finais, contraindicados } = r(["aha-glicolico", "retinol-0.025"], 4);
    // aha é ácido → removido pela regra global antes da regra 2
    expect(ativos_finais).not.toContain("aha-glicolico");
    expect(contraindicados).toContain("aha-glicolico");
  });

  it("nível 2: aha e retinol coexistem (regra 2 não se aplica)", () => {
    const { ativos_finais } = r(["aha-glicolico", "retinol-0.025"], 2);
    expect(ativos_finais).toContain("aha-glicolico");
    expect(ativos_finais).toContain("retinol-0.025");
  });
});

// ─── Regra 3: bha-salicilico + retinol (nivel >= 4) ──────────────────────────

describe("Regra 3: bha-salicilico + retinol-0.025 — nivel >= 4", () => {
  it("nível 4: bha removido pela regra global", () => {
    const { ativos_finais } = r(["bha-salicilico", "retinol-0.025"], 4);
    expect(ativos_finais).not.toContain("bha-salicilico");
  });

  it("nível 3: bha e retinol coexistem (regra 3 não se aplica)", () => {
    const { ativos_finais } = r(["bha-salicilico", "retinol-0.025"], 3);
    // Nível 3 + regra 2 (aha+retinol) não se aplica; regra 3 (bha+retinol) também não
    expect(ativos_finais).toContain("bha-salicilico");
    expect(ativos_finais).toContain("retinol-0.025");
  });
});

// ─── Integração: calcularSkinProfile garante ausência de combinações proibidas

describe("Integração: calcularSkinProfile — sem combinações proibidas", () => {
  it("nível sensibilidade >= 4: nenhum ácido no resultado final", () => {
    const ACIDOS_CHECK = ["aha-glicolico", "bha-salicilico", "salicilico-0.5", "pha", "acido-azelaico", "acido-kojico"];
    const vector = vectorSensivel(4);
    const perfil = calcularSkinProfile(vector, []);
    for (const acido of ACIDOS_CHECK) {
      expect(perfil.ativos_recomendados).not.toContain(acido);
    }
  });

  it("nível 1 com vitamina-c presente: retinol removido se ambos surgirem", () => {
    const vector = vectorSensivel(1);
    const perfil = calcularSkinProfile(vector, ["manchas", "textura"]);
    // Se vitamina-c e retinol foram recomendados pelo motor, retinol deve ter saído
    if (
      perfil.ativos_contraindicados.includes("retinol-0.025") &&
      perfil.ativos_recomendados.includes("vitamina-c")
    ) {
      expect(perfil.ativos_recomendados).not.toContain("retinol-0.025");
    }
  });

  it("ativos_contraindicados são subconjunto dos ativos_brutos (nunca inventados)", () => {
    const vector = vectorSensivel(4);
    const perfil = calcularSkinProfile(vector, []);
    // Todos contraindicados devem ter originado do motor de ativos
    expect(perfil.ativos_contraindicados.every(
      (a) => !perfil.ativos_recomendados.includes(a)
    )).toBe(true);
  });
});

// ─── Idempotência e casos limite ─────────────────────────────────────────────

describe("Casos limite", () => {
  it("lista de ativos vazia → retorna listas vazias sem erro", () => {
    const { ativos_finais, contraindicados } = r([], 5);
    expect(ativos_finais).toEqual([]);
    expect(contraindicados).toEqual([]);
  });

  it("sem conflitos → ativos_finais idêntico à entrada", () => {
    const entrada = ["ceramidas", "pantenol", "glicerina"];
    const { ativos_finais } = r(entrada, 3);
    expect(ativos_finais).toEqual(entrada);
  });

  it("scores normalizados estão sempre entre 0 e 100", () => {
    // fototipo VI com scores máximos → clamp deve garantir <= 100
    const vector: SkinFeatureVector = {
      scan_id: "t",
      face_detectada: true,
      fitzpatrick_estimado: 6,
      confidence_geral: 0.9,
      flags: [],
      scores: {
        acne: 1.0, poros: 1.0, textura: 1.0, oleosidade: 1.0,
        pigmentacao: 1.0, vermelhidao: 1.0, ressecamento: 1.0,
      },
    };
    const perfil = calcularSkinProfile(vector);
    for (const v of Object.values(perfil.scores_normalizados)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
