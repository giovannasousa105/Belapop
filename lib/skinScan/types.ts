// ─── Entrada — saída do serviço Python CV ────────────────────────────────────

export interface SkinFeatureVector {
  scan_id: string;
  face_detectada: boolean;
  fitzpatrick_estimado: number; // 1–6
  scores: SkinRawScores;
  confidence_geral: number; // 0.0–1.0
  flags: string[];
}

export interface SkinRawScores {
  acne: number;
  poros: number;
  textura: number;
  oleosidade: number;
  pigmentacao: number;
  vermelhidao: number;
  ressecamento: number;
}

// ─── Saída — perfil clínico normalizado ──────────────────────────────────────

export type TipoPele = "SECA" | "MISTA" | "OLEOSA" | "NORMAL" | "SENSIVEL";

export interface SkinProfile {
  scan_id: string;
  tipo_pele: TipoPele;
  nivel_sensibilidade: number; // 1–5
  necessidades_rankeadas: NecessidadeClinica[];
  ativos_recomendados: string[];
  ativos_contraindicados: string[];
  scores_normalizados: Record<ScoreKey, number>; // 0–100
  perfil_resumo_input: SkinProfileResumoInput;
}

// Payload estruturado para consumo pelo Claude / SkinGPT
export interface SkinProfileResumoInput {
  scan_id: string;
  tipo_pele: TipoPele;
  nivel_sensibilidade: number;
  fitzpatrick_estimado: number;
  necessidades_rankeadas: NecessidadeClinica[];
  ativos_recomendados: string[];
  ativos_contraindicados: string[];
  scores_normalizados: Record<ScoreKey, number>;
  focos_selecionados: string[];
  confidence_geral: number;
  flags: string[];
}

// ─── Literais de domínio ──────────────────────────────────────────────────────

export type ScoreKey =
  | "acne"
  | "poros"
  | "textura"
  | "oleosidade"
  | "pigmentacao"
  | "vermelhidao"
  | "ressecamento";

export type NecessidadeClinica =
  | "controle_sebaceo"
  | "tratamento_acne"
  | "refinamento_textura"
  | "balanceamento_sebaceo"
  | "uniformizacao_tom"
  | "calmante_barreira"
  | "hidratacao_profunda"
  | "renovacao_celular";

// ─── Fatores de correção por fototipo Fitzpatrick ────────────────────────────
// Fototipos mais escuros subestimam pigmentação e vermelhidão — aplicar boost.

export const CORRECAO_FOTOTIPO: Record<number, Partial<Record<ScoreKey, number>>> = {
  1: {},
  2: {},
  3: { pigmentacao: 1.05, vermelhidao: 1.05 },
  4: { pigmentacao: 1.15, vermelhidao: 1.10 },
  5: { pigmentacao: 1.25, vermelhidao: 1.15 },
  6: { pigmentacao: 1.35, vermelhidao: 1.20 },
};

export const SCORE_KEYS: ScoreKey[] = [
  "acne",
  "poros",
  "textura",
  "oleosidade",
  "pigmentacao",
  "vermelhidao",
  "ressecamento",
];
