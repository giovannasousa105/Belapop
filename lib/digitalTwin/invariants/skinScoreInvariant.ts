/**
 * INVARIANTE DE DOMÍNIO — LEIA ANTES DE QUALQUER OPERAÇÃO COM SCORES
 *
 * Na BelaPop, todos os marcadores de pele (acne, oleosidade, poros,
 * textura, pigmentacao, vermelhidao, ressecamento) seguem a convenção:
 *
 *   SCORE MENOR = CONDIÇÃO MELHORADA = PELE MELHOR
 *
 * Exemplos:
 *   acne: 80 → 40   significa MELHORA  (menos acne)
 *   oleosidade: 30 → 60  significa PIORA  (mais oleosidade)
 *
 * Consequências para leitura de deltas:
 *   delta NEGATIVO = melhora
 *   delta POSITIVO = piora
 *
 * Consequências para gráficos:
 *   eixo Y deve ser INVERTIDO — valor menor aparece mais ALTO na tela
 *   label obrigatório: "← melhor" no eixo Y
 *
 * NÃO EXISTE exceção a esta regra nos marcadores atuais.
 * Se um novo marcador "positivo" for adicionado no futuro (ex: luminosidade),
 * ele deve ser declarado explicitamente em POSITIVE_DIRECTION_MARKERS abaixo
 * e tratado separadamente em TODOS os locais que calculam delta.
 */

// ─── Marcadores ───────────────────────────────────────────────────────────────

export const SKIN_MARKERS = [
  "acne",
  "poros",
  "textura",
  "oleosidade",
  "pigmentacao",
  "vermelhidao",
  "ressecamento",
] as const;

export type SkinMarker = (typeof SKIN_MARKERS)[number];

// Marcadores com direção positiva (score maior = melhor) — lista intencionalmente vazia.
// Se adicionar aqui, buscar TODOS os usos de calcularSkinDelta e ajustar.
export const POSITIVE_DIRECTION_MARKERS: readonly string[] = [] as const;

// ─── Branded type SkinScore ───────────────────────────────────────────────────
// Impede passar número cru onde SkinScore é esperado.

export type SkinScore = number & { readonly __brand: "SkinScore" };

export type SkinScoreMap = Record<SkinMarker, SkinScore>;

// ─── Guard de criação ─────────────────────────────────────────────────────────
// O ÚNICO lugar onde number → SkinScore. Não use "as SkinScore" fora daqui.

export function toSkinScore(value: number): SkinScore {
  if (value < 0 || value > 100) {
    throw new RangeError(
      `SkinScore inválido: ${value}. ` +
        `Scores devem estar entre 0 e 100. ` +
        `Lembre: score 0 = condição ausente (melhor). Score 100 = condição severa (pior).`
    );
  }
  return value as SkinScore;
}

// ─── Delta com semântica explícita ────────────────────────────────────────────

export interface SkinDelta {
  readonly marcador: SkinMarker;
  readonly valor: number; // negativo = melhora, positivo = piora
  readonly direcao: "MELHORA" | "PIORA" | "ESTAVEL";
  readonly magnitude: number; // sempre positivo — só a intensidade
  /**
   * ATENÇÃO: para exibição ao usuário, INVERTER o sinal de `valor`.
   * "Sua acne melhorou 18 pontos" = delta.valor de -18.
   * Nunca exibir delta.valor diretamente — usar formatDeltaParaUsuario().
   */
}

const DELTA_LIMIAR = 5; // variação menor que 5 pontos = estável

export function calcularSkinDelta(
  anterior: SkinScore,
  atual: SkinScore,
  marcador: SkinMarker
): SkinDelta {
  const isPositiveMarker = POSITIVE_DIRECTION_MARKERS.includes(marcador);
  const rawDelta = atual - anterior;

  // Para marcadores padrão (lista positiva vazia agora):
  //   delta negativo (score caiu) = MELHORA
  //   delta positivo (score subiu) = PIORA
  // Para marcadores positivos futuros: lógica invertida.
  const direcao: SkinDelta["direcao"] = isPositiveMarker
    ? rawDelta >= DELTA_LIMIAR
      ? "MELHORA"
      : rawDelta <= -DELTA_LIMIAR
        ? "PIORA"
        : "ESTAVEL"
    : rawDelta <= -DELTA_LIMIAR
      ? "MELHORA"
      : rawDelta >= DELTA_LIMIAR
        ? "PIORA"
        : "ESTAVEL";

  return {
    marcador,
    valor: rawDelta,
    direcao,
    magnitude: Math.abs(rawDelta),
  };
}

// ─── Formatação segura para exibição ─────────────────────────────────────────
// Nunca exibir delta.valor diretamente — sempre passar por aqui.

export function formatDeltaParaUsuario(delta: SkinDelta): string {
  const pontos = delta.magnitude.toFixed(0);
  switch (delta.direcao) {
    case "MELHORA":
      return `↓ ${pontos} pts`; // seta para baixo = score menor = melhor
    case "PIORA":
      return `↑ ${pontos} pts`; // seta para cima = score maior = pior
    case "ESTAVEL":
      return `→ estável`;
  }
}

// ─── Configuração obrigatória para gráficos ───────────────────────────────────
// Qualquer gráfico de marcador de pele DEVE usar estas configurações.

export const MARKER_CHART_CONFIG = {
  yAxisInverted: true, // score menor aparece mais alto
  yAxisLabel: "← melhor", // label obrigatório — não omitir
  yDomain: [0, 100] as const,
  // No Recharts: <YAxis reversed={true} label="← melhor" />
} as const;
