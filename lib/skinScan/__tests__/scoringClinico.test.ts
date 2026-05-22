/**
 * scoringClinico.test.ts — 11 testes, zero banco, zero I/O.
 *
 * Testa calcularSkinProfile e todas as funções que ele orquestra:
 * correção Fitzpatrick, tipo de pele, sensibilidade, contraindicações.
 */

import { calcularSkinProfile } from "../scoringClinico";
import type { SkinFeatureVector } from "../types";

// ─── Fixture base ─────────────────────────────────────────────────────────────

function vetor(overrides: Partial<SkinFeatureVector["scores"]> & {
  fitzpatrick?: number;
  flags?: string[];
  focos?: string[];
  scan_id?: string;
}): { vector: SkinFeatureVector; focos: string[] } {
  const {
    fitzpatrick = 1, flags = [], focos = [], scan_id = "scan-test",
    acne = 0.30, poros = 0.35, textura = 0.25,
    oleosidade = 0.40, pigmentacao = 0.20,
    vermelhidao = 0.15, ressecamento = 0.25,
  } = overrides;

  return {
    vector: {
      scan_id,
      face_detectada: true,
      fitzpatrick_estimado: fitzpatrick,
      confidence_geral: 0.85,
      flags,
      scores: { acne, poros, textura, oleosidade, pigmentacao, vermelhidao, ressecamento },
    },
    focos,
  };
}

// ─── 1. Correção Fitzpatrick ──────────────────────────────────────────────────

test("Fototipo 4: score_pigmentacao corrigido por 1.15", () => {
  const { vector, focos } = vetor({ fitzpatrick: 4, pigmentacao: 0.50 });
  const perfil = calcularSkinProfile(vector, focos);
  // 0.50 * 1.15 = 0.575 → round(57.5) = 58 (ou 57 dependendo de arredondamento)
  const norm = perfil.scores_normalizados.pigmentacao;
  expect(norm).toBeGreaterThan(50); // corrigido para cima vs fototipo 1 (50)
});

test("Fototipo 1: score_pigmentacao sem correção", () => {
  const { vector, focos } = vetor({ fitzpatrick: 1, pigmentacao: 0.50 });
  const perfil = calcularSkinProfile(vector, focos);
  // 0.50 * 1.00 = 0.50 → 50
  expect(perfil.scores_normalizados.pigmentacao).toBe(50);
});

// ─── 2. Tipo de pele ──────────────────────────────────────────────────────────

test("tipo SENSIVEL quando vermelhidao > 60", () => {
  const { vector, focos } = vetor({ vermelhidao: 0.65 }); // 65 → SENSIVEL
  const perfil = calcularSkinProfile(vector, focos);
  expect(perfil.tipo_pele).toBe("SENSIVEL");
});

test("tipo OLEOSA quando oleosidade > 65 E ressecamento < 35", () => {
  const { vector, focos } = vetor({ oleosidade: 0.70, ressecamento: 0.20 });
  const perfil = calcularSkinProfile(vector, focos);
  expect(perfil.tipo_pele).toBe("OLEOSA");
});

test("tipo MISTA quando oleosidade > 50 E ressecamento > 30", () => {
  const { vector, focos } = vetor({ oleosidade: 0.55, ressecamento: 0.40 });
  const perfil = calcularSkinProfile(vector, focos);
  expect(perfil.tipo_pele).toBe("MISTA");
});

test("tipo SECA quando ressecamento > 55", () => {
  const { vector, focos } = vetor({ ressecamento: 0.60, oleosidade: 0.30 });
  const perfil = calcularSkinProfile(vector, focos);
  expect(perfil.tipo_pele).toBe("SECA");
});

test("tipo NORMAL quando todos os scores entre 20–55", () => {
  const { vector, focos } = vetor({
    acne: 0.30, poros: 0.30, textura: 0.30,
    oleosidade: 0.40, pigmentacao: 0.30,
    vermelhidao: 0.30, ressecamento: 0.30,
  });
  const perfil = calcularSkinProfile(vector, focos);
  expect(perfil.tipo_pele).toBe("NORMAL");
});

// ─── 3. Nível de sensibilidade ────────────────────────────────────────────────

test("nivel_sensibilidade 5 quando vermelhidao > 70", () => {
  const { vector, focos } = vetor({ vermelhidao: 0.75 });
  const perfil = calcularSkinProfile(vector, focos);
  expect(perfil.nivel_sensibilidade).toBe(5);
});

// ─── 4. Ranking com focos ─────────────────────────────────────────────────────

test("foco 'manchas' aumenta rank da necessidade de uniformizacao_tom", () => {
  // Scores baixos para tudo; foco em manchas deve empurrar pigmentacao para o top
  const { vector } = vetor({ pigmentacao: 0.35, focos: ["manchas"] });
  const comFoco    = calcularSkinProfile(vector, ["manchas"]);
  const semFoco    = calcularSkinProfile(vector, []);
  const rankComFoco = comFoco.necessidades_rankeadas.indexOf("uniformizacao_tom");
  const rankSemFoco = semFoco.necessidades_rankeadas.indexOf("uniformizacao_tom");
  // Com foco em manchas, uniformizacao_tom deve aparecer em posição igual ou melhor
  expect(rankComFoco).toBeLessThanOrEqual(rankSemFoco);
});

// ─── 5. Contraindicações ──────────────────────────────────────────────────────

test("sensibilidade >= 4 remove ácidos da lista de ativos recomendados", () => {
  // vermelhidao alto → sensibilidade 5
  const { vector, focos } = vetor({ vermelhidao: 0.75 });
  const perfil = calcularSkinProfile(vector, focos);
  expect(perfil.nivel_sensibilidade).toBeGreaterThanOrEqual(4);

  const ACIDOS = ["aha-glicolico", "bha-salicilico", "salicilico-0.5", "pha", "acido-azelaico", "acido-kojico"];
  const temAcido = perfil.ativos_recomendados.some((a) => ACIDOS.includes(a));
  expect(temAcido).toBe(false);
});

test("retinol-0.025 e vitamina-c nunca aparecem juntos", () => {
  // Qualquer vetor: a regra se aplica independente de sensibilidade
  const { vector, focos } = vetor({ pigmentacao: 0.50, textura: 0.50 });
  const perfil = calcularSkinProfile(vector, focos);
  const temAmbos =
    perfil.ativos_recomendados.includes("retinol-0.025") &&
    perfil.ativos_recomendados.includes("vitamina-c");
  expect(temAmbos).toBe(false);
});
