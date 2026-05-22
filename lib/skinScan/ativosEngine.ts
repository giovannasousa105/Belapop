import type { NecessidadeClinica, ScoreKey } from "./types";
import type { ScoresNorm } from "./tiposPele";

// ─── Mapa condição → necessidade clínica ─────────────────────────────────────

const LIMIAR_ACNE_GRAVE = 60;

function condicaoParaNecessidade(
  condicao: ScoreKey,
  scoreNorm: number
): NecessidadeClinica {
  switch (condicao) {
    case "acne":
      return scoreNorm > LIMIAR_ACNE_GRAVE ? "tratamento_acne" : "controle_sebaceo";
    case "poros":
      return "refinamento_textura";
    case "oleosidade":
      return "balanceamento_sebaceo";
    case "pigmentacao":
      return "uniformizacao_tom";
    case "vermelhidao":
      return "calmante_barreira";
    case "ressecamento":
      return "hidratacao_profunda";
    case "textura":
      return "renovacao_celular";
  }
}

// ─── Mapeamento focos UI → ScoreKey ──────────────────────────────────────────
// Permite que focos selecionados pelo usuário influenciem o ranking.

const FOCO_PARA_SCORE: Record<string, ScoreKey> = {
  acne: "acne",
  oleosidade: "oleosidade",
  manchas: "pigmentacao",
  sensibilidade: "vermelhidao",
  poros: "poros",
  hidratação: "ressecamento",
  textura: "textura",
  brilho: "oleosidade",
  linhas: "textura",
  olheiras: "pigmentacao",
};

// ─── Ativos por necessidade clínica ──────────────────────────────────────────

const ATIVOS_POR_NECESSIDADE: Record<NecessidadeClinica, string[]> = {
  controle_sebaceo: ["niacinamida", "zinco-pca", "salicilico-0.5"],
  tratamento_acne: ["bha-salicilico", "acido-azelaico", "niacinamida"],
  refinamento_textura: ["aha-glicolico", "pha", "retinol-0.025"],
  balanceamento_sebaceo: ["niacinamida", "zinco-pca", "salicilico-0.5"],
  uniformizacao_tom: ["vitamina-c", "acido-kojico", "niacinamida"],
  calmante_barreira: ["ceramidas", "centella-asiatica", "pantenol"],
  hidratacao_profunda: ["acido-hialuronico", "glicerina", "ceramidas"],
  renovacao_celular: ["pha", "aha-glicolico", "retinol-0.025"],
};

// ─── Ranking de necessidades ──────────────────────────────────────────────────

const PESO_FOCO = 1.3;
const MIN_NECESSIDADES = 3;
const MAX_NECESSIDADES = 5;

/**
 * Ordena as condições por score ponderado e retorna as necessidades clínicas
 * priorizadas (mínimo 3, máximo 5).
 *
 * Condições cujo foco foi selecionado pelo usuário recebem peso 1.3×.
 */
export function rankearNecessidades(
  scores: ScoresNorm,
  focos_selecionados: string[]
): NecessidadeClinica[] {
  const focosComoScores = new Set(
    focos_selecionados.map((f) => FOCO_PARA_SCORE[f]).filter(Boolean)
  );

  const condicoes: ScoreKey[] = [
    "acne",
    "poros",
    "textura",
    "oleosidade",
    "pigmentacao",
    "vermelhidao",
    "ressecamento",
  ];

  const ordenado = condicoes
    .map((condicao) => {
      const scoreNorm = scores[condicao];
      const pesoEfetivo = focosComoScores.has(condicao)
        ? scoreNorm * PESO_FOCO
        : scoreNorm;
      return { condicao, scoreNorm, pesoEfetivo };
    })
    .sort((a, b) => b.pesoEfetivo - a.pesoEfetivo);

  // Garantir mínimo de 3 e máximo de 5
  const top = ordenado.slice(0, MAX_NECESSIDADES);
  const necessidades = top.map(({ condicao, scoreNorm }) =>
    condicaoParaNecessidade(condicao, scoreNorm)
  );

  // Preencher até MIN se necessário (scores baixos ainda geram necessidade)
  while (necessidades.length < MIN_NECESSIDADES) {
    const next = ordenado[necessidades.length];
    if (!next) break;
    necessidades.push(condicaoParaNecessidade(next.condicao, next.scoreNorm));
  }

  // Deduplicar preservando ordem (ex: acne + oleosidade podem gerar a mesma)
  return Array.from(new Set(necessidades)).slice(0, MAX_NECESSIDADES) as NecessidadeClinica[];
}

// ─── Seleção de ativos ────────────────────────────────────────────────────────

/**
 * Coleta ativos para cada necessidade, deduplicando.
 * A ordem de inserção define a prioridade implícita de cada ativo.
 */
export function selecionarAtivos(necessidades: NecessidadeClinica[]): string[] {
  const vistos = new Set<string>();
  const resultado: string[] = [];

  for (const necessidade of necessidades) {
    for (const ativo of ATIVOS_POR_NECESSIDADE[necessidade]) {
      if (!vistos.has(ativo)) {
        vistos.add(ativo);
        resultado.push(ativo);
      }
    }
  }

  return resultado;
}
