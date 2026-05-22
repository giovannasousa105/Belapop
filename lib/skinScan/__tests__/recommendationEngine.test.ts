/**
 * recommendationEngine.test.ts — 5 testes.
 * calcularCompatibilidade é pura — testada diretamente.
 * Supabase admin mockado para isolar do servidor.
 */

// Mockar server-only e supabase antes de qualquer import
jest.mock("server-only", () => ({}));
jest.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: jest.fn(),
}));

import { calcularCompatibilidade, type ProdutoCatalogo } from "../recommendationEngine";
import type { SkinProfile } from "../types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function perfil(overrides: Partial<SkinProfile> = {}): SkinProfile {
  return {
    scan_id:               "scan-test",
    tipo_pele:             "OLEOSA",
    nivel_sensibilidade:   2,
    necessidades_rankeadas: ["controle_sebaceo", "balanceamento_sebaceo"],
    ativos_recomendados:   ["niacinamida", "zinco-pca"],
    ativos_contraindicados: ["retinol-0.025"],
    scores_normalizados: {
      acne: 35, poros: 40, textura: 30,
      oleosidade: 70, pigmentacao: 20,
      vermelhidao: 15, ressecamento: 20,
    },
    perfil_resumo_input: {
      scan_id: "scan-test",
      tipo_pele: "OLEOSA",
      nivel_sensibilidade: 2,
      fitzpatrick_estimado: 2,
      necessidades_rankeadas: [],
      ativos_recomendados: [],
      ativos_contraindicados: [],
      scores_normalizados: {} as Record<string, number>,
      focos_selecionados: [],
      confidence_geral: 0.85,
      flags: [],
    },
    ...overrides,
  };
}

function produto(overrides: Partial<ProdutoCatalogo> = {}): ProdutoCatalogo {
  return {
    id:                      "prod-1",
    nome:                    "Sérum Niacinamida",
    ativos_principais:       ["niacinamida"],
    tipo_pele_indicado:      ["OLEOSA"],
    nivel_sensibilidade_max: 5,
    passo_rotina:            "serum",
    periodo:                 "ambos",
    ...overrides,
  };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

test("calcularCompatibilidade: +30 quando tipo_pele bate", () => {
  // Base 50 + 30 (tipo bate) + 10 (niacinamida em recomendados) = 90
  const score = calcularCompatibilidade(produto(), perfil());
  expect(score).toBe(90);
});

test("calcularCompatibilidade: -20 para ativo contraindicado", () => {
  const p = produto({ ativos_principais: ["retinol-0.025"], tipo_pele_indicado: ["OLEOSA"] });
  // 50 + 30 (tipo bate) - 20 (contraindicado) = 60
  const score = calcularCompatibilidade(p, perfil());
  expect(score).toBe(60);
});

test("calcularCompatibilidade: score nunca negativo", () => {
  // Produto que não serve em nada: tipo errado + contraindicado + sensibilidade acima
  const p = produto({
    ativos_principais:       ["retinol-0.025"],
    tipo_pele_indicado:      ["SECA"],
    nivel_sensibilidade_max: 1, // perfil tem nivel 2
  });
  const perfilAlto = perfil({ nivel_sensibilidade: 5 });
  const score = calcularCompatibilidade(p, perfilAlto);
  expect(score).toBeGreaterThanOrEqual(0);
});

test("calcularCompatibilidade: score nunca maior que 100", () => {
  // Mesmo com todos os bônus máximos
  const p = produto({ ativos_principais: ["niacinamida", "zinco-pca", "salicilico-0.5"] });
  const score = calcularCompatibilidade(p, perfil());
  expect(score).toBeLessThanOrEqual(100);
});

test("calcularCompatibilidade: -30 quando nivel_sensibilidade_max < perfil", () => {
  const p = produto({ nivel_sensibilidade_max: 1, tipo_pele_indicado: ["OLEOSA"] });
  const perfilSens = perfil({ nivel_sensibilidade: 4 });
  // 50 + 30 (tipo) + 10 (ativo) - 30 (sensibilidade) = 60
  const score = calcularCompatibilidade(p, perfilSens);
  expect(score).toBe(60);
});
