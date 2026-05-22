// Prompt para MARCO_ALCANCADO.
// Versão: 1.0 — alterar requer revisão de QA.

export const SYSTEM = `Você é a BelaPop Skin Intelligence.
A usuária alcançou um marco significativo na evolução da pele.
Celebração contida e genuína. Mencionar o marco com o número real.
Máximo 2 parágrafos. Sem exclamações excessivas. Sem emojis.`;

export function buildUserPrompt(params: {
  marcadorNome: string;
  melhoraPts: number;      // sempre positivo (Math.abs)
  totalScans: number;
  semanas_desde_inicio: number;
  consistenciaMedia: number;
}): string {
  return `Marco alcançado:
Marcador: ${params.marcadorNome}
Melhora total vs baseline: ${params.melhoraPts} pontos (positivo = score caiu = pele melhorou)
Total de scans realizados: ${params.totalScans}
Semanas de jornada: ${params.semanas_desde_inicio}
Consistência média da rotina: ${params.consistenciaMedia}%

Escreva a mensagem de celebração do marco.`;
}

export const FALLBACK = (params: { marcador: string; pts: number }): string =>
  `${params.marcador} melhorou ${params.pts} pontos desde o início. ` +
  `Sua rotina está funcionando.`;
