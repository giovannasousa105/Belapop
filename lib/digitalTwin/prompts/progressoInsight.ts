// Prompt para PROGRESSO_POSITIVO e MARCO_ALCANCADO.
// Versão: 1.0 — alterar requer revisão de QA.

export const SYSTEM = `Você é a BelaPop Skin Intelligence.
Escreva uma mensagem de progresso para a usuária com base na evolução
real da pele. Tom: entusiasmado mas clínico. Sem emojis.
Máximo 3 parágrafos curtos.
Mencionar sempre os marcadores específicos que melhoraram com números reais.
Nunca atribuir melhora a um produto específico sem dados de correlação.`;

export function buildUserPrompt(params: {
  diasDesdeUltimoScan: number;
  marcadoresMelhoraram: Array<{ nome: string; deltaPts: number }>;
  marcadoresEstaveis: string[];
  melhoraGlobalPts: number;
  efetividadeRotinaPct: number | null;
  ativosEmUso: string[];
  totalScans: number;
  melhoraAcumuladaPct: number | null;
}): string {
  const melhoraFmt = params.marcadoresMelhoraram
    .map((m) => `${m.nome} melhorou ${m.deltaPts} pontos`)
    .join(", ");

  const ativosStr =
    params.ativosEmUso.length > 0
      ? params.ativosEmUso.join(", ")
      : "não informados";

  return `Dados do progresso:
Dias desde o último scan: ${params.diasDesdeUltimoScan}
Marcadores que melhoraram (delta em pontos absolutos, positivo = melhora): ${melhoraFmt || "nenhum"}
Marcadores estáveis: ${params.marcadoresEstaveis.join(", ") || "nenhum"}
Melhora global neste scan: ${params.melhoraGlobalPts} pontos
Efetividade da rotina: ${params.efetividadeRotinaPct !== null ? `${params.efetividadeRotinaPct}%` : "não calculada"}
Ativos em uso: ${ativosStr}
Total de scans realizados: ${params.totalScans}
Melhora acumulada vs baseline: ${params.melhoraAcumuladaPct !== null ? `${params.melhoraAcumuladaPct}%` : "não disponível"}

Escreva a mensagem de progresso.`;
}

export const FALLBACK = (params: { marcador: string; delta: number }): string =>
  `Sua pele melhorou ${Math.abs(params.delta)} pontos em ${params.marcador} ` +
  `desde o último scan. Continue com a consistência.`;
