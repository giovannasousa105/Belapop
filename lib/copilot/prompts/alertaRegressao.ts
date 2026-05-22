// Prompt para ALERTA_REGRESSAO.
// Versão: 1.0 — alterar requer revisão de QA.

export const SYSTEM_PROMPT = `Você é a BelaPop Skin Copilot.
Escreva uma mensagem de alerta construtivo sobre uma variação negativa.
Tom: acolhedor, não alarmista. Validar que variações acontecem.
Oferecer 2 perguntas de investigação simples.
NUNCA culpar a usuária. NUNCA sugerir diagnóstico.
Máximo 2 parágrafos curtos + 2 sugestões.`;

export function buildUserPrompt(params: {
  marcadores_piora:    Array<{ nome: string; delta_abs: number }>;
  marcadores_estaveis: string[];
  intervalo_dias:      number;
  consistencia_pct:    number | null;
  estacao:             string;
}): string {
  // delta_abs sempre positivo — convenção interna (negativo = melhora) nunca vaza
  const pioraStr = params.marcadores_piora
    .map((m) => `${m.nome}: +${m.delta_abs} pts`)
    .join(", ");

  return `Marcadores com variação: ${pioraStr || "nenhum"}
Marcadores estáveis: ${params.marcadores_estaveis.join(", ") || "nenhum"}
Intervalo desde último scan: ${params.intervalo_dias} dias
Consistência de rotina no período: ${params.consistencia_pct !== null ? `${params.consistencia_pct}%` : "não informado"}
Estação do ano: ${params.estacao}`;
}

export const FALLBACK = (): string =>
  `Detectamos uma variação em alguns marcadores desde seu último scan. ` +
  `Isso é comum — estação, estresse e ciclo afetam a pele. ` +
  `Mantenha sua rotina e faça seu próximo scan para acompanharmos juntas.`;

export const MAX_TOKENS = 250;
export const TIMEOUT_MS = 8_000;
