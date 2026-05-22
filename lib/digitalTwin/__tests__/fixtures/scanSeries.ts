/**
 * Fixtures de séries de scan para testes das invariantes do Digital Twin.
 *
 * Todas as séries são verificadas matematicamente abaixo.
 * Alterar valores aqui invalida os testes de regressão — documentar o motivo.
 */

import { toSkinScore, type SkinScore } from "@/lib/digitalTwin/invariants";

// ─── serieProgressiva ─────────────────────────────────────────────────────────
// Acne melhora 3pts por scan: [80, 77, 74, 71, 68]
// Regressão linear: slope = -3.0 → MELHORANDO ✓
// snapshotsUsados = 5 → confianca = ALTA ✓

export const serieProgressiva: SkinScore[] = [80, 77, 74, 71, 68].map(toSkinScore);

// ─── seriePiorandoUmMarcador ──────────────────────────────────────────────────
// Vermelhidão: 4 scans estáveis (~20), 1 outlier em 75.
// [20, 22, 21, 19, 75]
// Slope = ((−2)(20−31.4) + (−1)(22−31.4) + 0(21−31.4) + (1)(19−31.4) + (2)(75−31.4)) / 10
//       = (22.8 + 9.4 + 0 − 12.4 + 87.2) / 10 = 107 / 10 = 10.7 → PIORANDO
// Usado para verificar que outlier extremo no final SÃO capturados.

export const seriePiorandoUmMarcador: SkinScore[] = [20, 22, 21, 19, 75].map(
  toSkinScore
);

// ─── serieComOutlier ──────────────────────────────────────────────────────────
// Poros: série boa com outlier no meio. [30, 28, 70, 32, 30]
// yMean = (30+28+70+32+30)/5 = 38
// Slope = ((−2)(30−38) + (−1)(28−38) + 0(70−38) + (1)(32−38) + (2)(30−38)) / 10
//       = (16 + 10 + 0 − 6 − 16) / 10 = 4 / 10 = 0.4
// 0.4 < SLOPE_LIMIAR (0.5) → ESTAVEL ✓
// O outlier (70) tem peso 0 por estar no centro exato da janela.

export const serieComOutlier: SkinScore[] = [30, 28, 70, 32, 30].map(toSkinScore);

// ─── serieInsuficiente ────────────────────────────────────────────────────────
// Apenas 2 snapshots — abaixo do mínimo (3) → deve retornar INSUFICIENTE.

export const serieInsuficiente: SkinScore[] = [50, 45].map(toSkinScore);

// ─── serieOscilante ───────────────────────────────────────────────────────────
// Textura alternando entre 50 e 30: [50, 30, 50, 30, 50]
// yMean = 42, slope = 0 exato (simetria perfeita) → ESTAVEL ✓

export const serieOscilante: SkinScore[] = [50, 30, 50, 30, 50].map(toSkinScore);

// ─── serie10Scans ─────────────────────────────────────────────────────────────
// 10 snapshots — a janela deve usar apenas os últimos 5.
// Primeiros 5: [20, 20, 20, 20, 20] (excelente — causariam ESTAVEL se incluídos)
// Últimos 5:   [80, 77, 74, 71, 68] (piorando no começo → slope = -3 → MELHORANDO)
// Resultado esperado com janela: MELHORANDO, snapshotsUsados = 5

export const serie10Scans: SkinScore[] = [
  20, 20, 20, 20, 20, // ignorados pela janela
  80, 77, 74, 71, 68, // janela ativa — slope -3 → MELHORANDO
].map(toSkinScore);
