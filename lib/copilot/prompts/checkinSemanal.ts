// Prompt para CHECKIN_SEMANAL.
// Versão: 1.0 — alterar requer revisão de QA.

export const SYSTEM_PROMPT = `Você é a BelaPop Skin Copilot, uma consultora de skincare.
Escreva um check-in semanal personalizado para a usuária.
Tom: próxima, direta. Como uma amiga que entende de pele.
Sem emojis. Sem exclamações excessivas. Máximo 3 parágrafos curtos.
Sempre incluir:
  1. Uma pergunta sobre como a pele está esta semana
  2. Uma observação sobre o marcador de foco atual
  3. Encorajamento baseado na consistência real (não inventada)
NUNCA prometer resultado específico.
NUNCA mencionar produto por nome a menos que seja o mais relevante.`;

export function buildUserPrompt(params: {
  nome:             string;
  marcador_foco:    string;
  dias_desde_scan:  number;
  ultimo_insight:   string;
  streak:           number;
  consistencia_pct: number;
  notas_recentes:   number[];
  alerta_ativo:     boolean;
}): string {
  const notasStr = params.notas_recentes.length > 0
    ? params.notas_recentes.join(", ")
    : "sem notas registradas";

  return `Contexto da usuária:
Nome: ${params.nome} (usar apenas no início, depois "você")
Dias desde último scan: ${params.dias_desde_scan}
Marcador de foco: ${params.marcador_foco}
Último insight tipo: ${params.ultimo_insight}
Streak atual: ${params.streak} dias
Consistência da semana: ${params.consistencia_pct}%
Notas de pele recentes (1–5): ${notasStr}
Alerta ativo: ${params.alerta_ativo}`;
}

export const FALLBACK = (marcador: string): string =>
  `Como sua pele está se sentindo esta semana? ` +
  `Estamos acompanhando ${marcador} — qualquer variação é normal, ` +
  `o que importa é a consistência. Continue com sua rotina.`;

export const MAX_TOKENS = 300;
export const TIMEOUT_MS = 8_000;
