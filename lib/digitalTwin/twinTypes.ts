/**
 * INVARIANTE DE DOMÍNIO — leia antes de qualquer operação com o Digital Twin.
 *
 *   SCORE MENOR = CONDIÇÃO MELHORADA = PELE MELHOR
 *   delta_global NEGATIVO = melhora geral
 *   scores_baseline é IMUTÁVEL após o primeiro scan — nunca atualizar
 */

import type { CopilotSeed, InsightTipo } from "./invariants";

// ─── Branded type ─────────────────────────────────────────────────────────────

export type TwinId = string & { readonly __brand: "TwinId" };

export function toTwinId(s: string): TwinId {
  if (!s) throw new TypeError("TwinId não pode ser vazio.");
  return s as TwinId;
}

// ─── Status do twin ───────────────────────────────────────────────────────────

export type TwinStatus =
  | "SEM_DADOS"  // twin criado, sem snapshot ainda
  | "ATIVO"      // pelo menos 1 snapshot, dentro do intervalo esperado
  | "PAUSADO";   // mais de 120 dias sem novo scan

// ─── Rows do banco ────────────────────────────────────────────────────────────

export interface SkinTwinRow {
  id: TwinId;
  user_id: string;
  total_scans: number;
  /**
   * IMUTÁVEL após o primeiro scan — nunca atualizar.
   * Delta global = atual - baseline (negativo = melhora).
   */
  scores_baseline: Record<string, number>;
  /** Scores do último scan — atualizados após cada novo snapshot. */
  scores_atuais: Record<string, number> | null;
  tipo_pele_atual: string | null;
  nivel_sensibilidade_atual: number | null;
  copilot_seed: CopilotSeed | null;
  status: TwinStatus;
  proximo_scan_em: string | null;
  primeiro_scan_em: string | null;
  ultimo_scan_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface TwinSnapshotRow {
  id: string;
  twin_id: TwinId;
  scan_id: string;
  scores_normalizados: Record<string, number>;
  tipo_pele: string;
  nivel_sensibilidade: number;
  focos_selecionados: string[];
  numero_sequencia: number;
  ativos_em_uso: string[];   // ativos do usuário nos últimos 60 dias
  criado_em: string;
}

/**
 * Delta entre dois snapshots consecutivos.
 * delta_global NEGATIVO = melhora geral.
 */
export interface TwinDeltaRow {
  id: string;
  twin_id: TwinId;
  snapshot_anterior_id: string;
  snapshot_atual_id: string;
  deltas_por_marcador: Record<string, SerializedSkinDelta>;
  /** Per-marcador: 'MELHORA' | 'PIORA' | 'ESTAVEL' */
  classificacoes: Record<string, "MELHORA" | "PIORA" | "ESTAVEL">;
  /** NEGATIVO = melhora, POSITIVO = piora */
  delta_global: number;
  melhora_percentual: number;
  efetividade_rotina: number | null;
  intervalo_dias: number;
  criado_em: string;
}

/** Versão serializável de SkinDelta (sem readonly — compatível com JSON). */
export interface SerializedSkinDelta {
  marcador: string;
  valor: number;
  direcao: "MELHORA" | "PIORA" | "ESTAVEL";
  magnitude: number;
}

export interface TwinTrendRow {
  id: string;
  twin_id: TwinId;
  snapshot_id: string;
  marcador: string;
  status: "MELHORANDO" | "ESTAVEL" | "PIORANDO" | "INSUFICIENTE";
  slope: number;
  velocidade_por_semana: number;
  snapshots_usados: number;
  confianca: "ALTA" | "MEDIA" | "BAIXA";
  calculado_em: string;
}

export interface TwinInsightRow {
  id: string;
  twin_id: TwinId;
  snapshot_id: string | null;
  tipo: InsightTipo;
  conteudo: string;
  alerta_ativo: boolean;
  rotina_precisa_revisao: boolean;
  criado_em: string;
}

// ─── Payloads de resposta da API ──────────────────────────────────────────────

export interface TwinStatusResponse {
  twin: SkinTwinRow | null;
  ultimoSnapshot: TwinSnapshotRow | null;
  ultimoInsight: TwinInsightRow | null;
  copilotSeed: CopilotSeed | null;
  diasDesdeUltimoScan: number | null;
  /** NEGATIVO = melhora (delta de scores). Usar calcularMelhoraGlobal para exibição POSITIVA. */
  melhoraGlobal: { delta_global: number; melhora_percentual: number } | null;
}

export interface TwinSnapshotsResponse {
  snapshots: TwinSnapshotRow[];
  deltas: TwinDeltaRow[];
  trends: TwinTrendRow[];
  total: number;
}
