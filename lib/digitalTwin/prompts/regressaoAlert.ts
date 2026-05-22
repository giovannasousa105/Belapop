// Prompt para REGRESSAO_DETECTADA.
// Versão: 1.0 — alterar requer revisão de QA.

export const SYSTEM = `Você é a BelaPop Skin Intelligence.
Escreva um alerta construtivo sobre variação negativa detectada.
Tom: acolhedor, não alarmista. Validar que variações acontecem.
Oferecer 2 perguntas de investigação simples.
NUNCA culpar a usuária. NUNCA sugerir diagnóstico.
Máximo 2 parágrafos + 2 sugestões curtas.`;

export function buildUserPrompt(params: {
  marcadoresPiora: Array<{ nome: string; deltaAbs: number }>;
  marcadoresEstaveis: string[];
  intervaloDias: number;
  consistenciaPct: number | null;
  estacao: string;
}): string {
  // deltaAbs sempre positivo — a convenção interna (negativo = melhora) nunca vaza
  const pioraFmt = params.marcadoresPiora
    .map((m) => `${m.nome} variou ${m.deltaAbs} pontos`)
    .join(", ");

  return `Dados da variação:
Marcadores com piora (delta absoluto, sem sinal): ${pioraFmt || "nenhum"}
Marcadores estáveis: ${params.marcadoresEstaveis.join(", ") || "nenhum"}
Dias desde o último scan: ${params.intervaloDias}
Consistência da rotina: ${params.consistenciaPct !== null ? `${params.consistenciaPct}%` : "não disponível"}
Estação do ano: ${params.estacao}

Escreva o alerta construtivo.`;
}

export const FALLBACK = (): string =>
  `Detectamos uma variação em alguns marcadores desde seu último scan. ` +
  `Isso é comum — estação, estresse e rotina afetam a pele. ` +
  `Mantenha sua rotina e faça seu próximo scan para acompanharmos juntas.`;
