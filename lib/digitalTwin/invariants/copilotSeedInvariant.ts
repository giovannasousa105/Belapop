/**
 * INVARIANTE DE DOMÍNIO — COPILOT SEED
 *
 * O CopilotSeed NUNCA depende de chamada à Claude API ou qualquer serviço externo.
 * É gerado localmente, de forma síncrona, a partir dos dados do twin.
 *
 * Motivação: o Skin Copilot roda check-ins diários. Se o seed dependesse
 * de API externa, uma instabilidade derrubaria a feature de retenção mais
 * importante da plataforma. O seed é contexto estruturado — não narrativa.
 * A narrativa rica fica em twin_insights (gerada pelo Claude). O seed é
 * o que o Copilot precisa para funcionar mesmo offline.
 */

import { SKIN_MARKERS, type SkinMarker } from "./skinScoreInvariant";
import type { MarkerTrend } from "./trendWindowInvariant";

// ─── Tipos de insight ─────────────────────────────────────────────────────────

export type InsightTipo =
  | "PRIMEIRO_SCAN"
  | "PROGRESSO_POSITIVO"
  | "ESTAVEL"
  | "REGRESSAO_DETECTADA"
  | "MARCO_ALCANCADO"
  | "AJUSTE_ROTINA"
  | "RETORNO_APOS_PAUSA";

// ─── CopilotSeed ─────────────────────────────────────────────────────────────

export interface CopilotSeed {
  readonly ultimoInsightTipo: InsightTipo;
  readonly marcadorFoco: SkinMarker; // marcador com pior tendência atual
  readonly diasDesdeUltimoScan: number;
  readonly proximoScanRecomendadoEm: string; // ISO date (YYYY-MM-DD)
  readonly alertaAtivo: boolean;
  readonly rotinaPrecisaRevisao: boolean;
  readonly mensagemMotivacionalCurta: string; // 1 frase — gerada por template
  // NUNCA adicionar campos que exijam chamada de API aqui
}

// ─── Templates de mensagem ────────────────────────────────────────────────────
// Sem IA, sem API, sem async — sempre disponíveis.

const MENSAGENS_POR_TIPO: Record<InsightTipo, string> = {
  PRIMEIRO_SCAN: "Sua jornada começou. Próximo scan em 6 semanas.",
  PROGRESSO_POSITIVO: "Sua pele está respondendo. Continue com a consistência.",
  ESTAVEL: "Estabilidade é progresso. Continue.",
  REGRESSAO_DETECTADA: "Pequenas variações são normais. Vamos ajustar juntas.",
  MARCO_ALCANCADO: "Marco alcançado. Sua rotina está funcionando.",
  AJUSTE_ROTINA: "Hora de atualizar sua rotina para a pele de agora.",
  RETORNO_APOS_PAUSA: "Bem-vinda de volta. Sua pele está esperando.",
};

const PROXIMO_SCAN_INTERVALO_DIAS = 42; // 6 semanas — padrão clínico

// ─── Geração do seed ──────────────────────────────────────────────────────────
// Síncrona, pura, sem dependências externas — sempre funciona.
// eslint-disable-next-line @typescript-eslint/require-await

export function gerarCopilotSeed(params: {
  insightTipo: InsightTipo;
  trends: MarkerTrend[];
  ultimoScanEm: Date;
  alertaAtivo: boolean;
  rotinaPrecisaRevisao: boolean;
}): CopilotSeed {
  const { insightTipo, trends, ultimoScanEm, alertaAtivo, rotinaPrecisaRevisao } =
    params;

  const diasDesdeUltimoScan = Math.floor(
    (Date.now() - ultimoScanEm.getTime()) / (1000 * 60 * 60 * 24)
  );

  const proximoScanEm = new Date(ultimoScanEm);
  proximoScanEm.setDate(proximoScanEm.getDate() + PROXIMO_SCAN_INTERVALO_DIAS);

  // Marcador foco: pior tendência ativa, ou fallback para primeiro marcador
  const trendsAtivos = trends.filter((t) => t.status !== "INSUFICIENTE");
  const marcadorFoco: SkinMarker =
    trendsAtivos
      .sort((a, b) => {
        // PIORANDO primeiro, depois por slope absoluto decrescente
        if (a.status === "PIORANDO" && b.status !== "PIORANDO") return -1;
        if (b.status === "PIORANDO" && a.status !== "PIORANDO") return 1;
        return Math.abs(b.slope) - Math.abs(a.slope);
      })[0]?.marcador ?? "acne"; // fallback seguro sempre dentro de SkinMarker

  return {
    ultimoInsightTipo: insightTipo,
    marcadorFoco,
    diasDesdeUltimoScan,
    proximoScanRecomendadoEm: proximoScanEm.toISOString().split("T")[0],
    alertaAtivo,
    rotinaPrecisaRevisao,
    mensagemMotivacionalCurta: MENSAGENS_POR_TIPO[insightTipo],
  };
}

// ─── Type guard ───────────────────────────────────────────────────────────────
// Nunca persistir seed com campos inválidos.

export function assertSeedValido(seed: CopilotSeed): void {
  if (!seed.marcadorFoco || !seed.mensagemMotivacionalCurta) {
    throw new Error("CopilotSeed inválido: campos obrigatórios ausentes.");
  }
  if (!(SKIN_MARKERS as readonly string[]).includes(seed.marcadorFoco)) {
    throw new Error(
      `marcadorFoco inválido: "${seed.marcadorFoco}". Deve ser um SkinMarker.`
    );
  }
}
