// Prompt para AJUSTE_ROTINA.
// Versão: 1.0 — alterar requer revisão de QA.

export const SYSTEM = `Você é a BelaPop Skin Intelligence.
A efetividade da rotina atual está baixa. Escreva uma mensagem
propondo revisão. Tom: consultiva, parceira. Máximo 2 parágrafos.
Mencionar que o próximo Skin Scan atualiza as recomendações.`;

export function buildUserPrompt(params: {
  efetividadePct: number;
  ativosEmUso: string[];
  marcadoresNaoRespondendo: string[];
  totalScans: number;
}): string {
  return `Dados da rotina atual:
Efetividade calculada: ${params.efetividadePct}%
Ativos em uso: ${params.ativosEmUso.join(", ") || "não informados"}
Marcadores que não responderam à rotina: ${params.marcadoresNaoRespondendo.join(", ") || "nenhum identificado"}
Total de scans: ${params.totalScans}

Escreva a mensagem de ajuste de rotina.`;
}

export const FALLBACK = (): string =>
  `Sua rotina atual pode ser atualizada para a pele de agora. ` +
  `Fazer um novo Skin Scan vai recalibrar as recomendações com precisão.`;
