/**
 * calcularSkinProfile — orquestrador da camada de scoring clínico.
 *
 * Função pura: sem I/O, sem efeitos colaterais, determinística.
 * Pode ser chamada em server components, route handlers ou testes unitários.
 */

import { aplicarContraindicacoes } from "./contraindicacoes";
import { rankearNecessidades, selecionarAtivos } from "./ativosEngine";
import { calcularNivelSensibilidade, determinarTipoPele } from "./tiposPele";
import {
  CORRECAO_FOTOTIPO,
  SCORE_KEYS,
  type ScoreKey,
  type SkinFeatureVector,
  type SkinProfile,
  type SkinProfileResumoInput,
} from "./types";
import type { ScoresNorm } from "./tiposPele";

// ─── Normalização com correção Fitzpatrick ────────────────────────────────────

function normalizarScores(
  rawScores: SkinFeatureVector["scores"],
  fitzpatrick: number
): Record<ScoreKey, number> {
  const correcao = CORRECAO_FOTOTIPO[fitzpatrick] ?? {};
  const resultado = {} as Record<ScoreKey, number>;

  for (const key of SCORE_KEYS) {
    const fator = correcao[key] ?? 1.0;
    const corrigido = Math.min(1.0, rawScores[key] * fator);
    resultado[key] = Math.round(corrigido * 100);
  }

  return resultado;
}

// ─── Função principal ─────────────────────────────────────────────────────────

export function calcularSkinProfile(
  vector: SkinFeatureVector,
  focos_selecionados: string[] = []
): SkinProfile {
  // 1. Normalizar scores com correção por fototipo
  const scores_normalizados = normalizarScores(
    vector.scores,
    vector.fitzpatrick_estimado
  );

  // Cast para ScoresNorm (mesmo shape, apenas tipagem local)
  const scoresNorm = scores_normalizados as ScoresNorm;

  // 2. Tipo de pele e nível de sensibilidade
  const tipo_pele = determinarTipoPele(scoresNorm, vector.flags, focos_selecionados);
  const nivel_sensibilidade = calcularNivelSensibilidade(scoresNorm);

  // 3. Ranking de necessidades clínicas
  const necessidades_rankeadas = rankearNecessidades(scoresNorm, focos_selecionados);

  // 4. Ativos brutos (antes das contraindicações)
  const ativos_brutos = selecionarAtivos(necessidades_rankeadas);

  // 5. Aplicar contraindicações
  const { ativos_finais, contraindicados } = aplicarContraindicacoes(
    ativos_brutos,
    nivel_sensibilidade
  );

  // 6. Montar payload para o Claude
  const perfil_resumo_input: SkinProfileResumoInput = {
    scan_id: vector.scan_id,
    tipo_pele,
    nivel_sensibilidade,
    fitzpatrick_estimado: vector.fitzpatrick_estimado,
    necessidades_rankeadas,
    ativos_recomendados: ativos_finais,
    ativos_contraindicados: contraindicados,
    scores_normalizados,
    focos_selecionados,
    confidence_geral: vector.confidence_geral,
    flags: vector.flags,
  };

  return {
    scan_id: vector.scan_id,
    tipo_pele,
    nivel_sensibilidade,
    necessidades_rankeadas,
    ativos_recomendados: ativos_finais,
    ativos_contraindicados: contraindicados,
    scores_normalizados,
    perfil_resumo_input,
  };
}
