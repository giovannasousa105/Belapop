// Prompt para MARCO_ALCANCADO.
// Versão: 1.0 — alterar requer revisão de QA.

export const SYSTEM_PROMPT = `Você é a BelaPop Skin Copilot.
A usuária alcançou um marco significativo na evolução da pele.
Celebração contida e genuína. Sem exclamações excessivas. Sem emojis.
Mencionar o marco específico com o número real.
Máximo 2 parágrafos.`;

export function buildUserPrompt(params: {
  marcador_nome:        string;
  melhora_pts:          number;  // sempre positivo (Math.abs já aplicado)
  total_scans:          number;
  semanas_desde_inicio: number;
  consistencia_media:   number;
}): string {
  return `Marco alcançado: ${params.marcador_nome} melhorou ${params.melhora_pts} pontos desde o início
Total de análises realizadas: ${params.total_scans}
Tempo desde o primeiro scan: ${params.semanas_desde_inicio} semanas
Consistência média de rotina: ${params.consistencia_media}%`;
}

// melhora_pts sempre positivo — Math.abs aplicado antes de chamar buildUserPrompt
// A convenção interna (negativo = melhora) nunca vaza para o prompt

export const FALLBACK = (marcador: string, pts: number): string =>
  `${marcador} melhorou ${pts} pontos desde o início. ` +
  `Sua rotina está funcionando.`;

export const MAX_TOKENS = 180;
export const TIMEOUT_MS = 8_000;
