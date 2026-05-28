export type TipoPele = "seca" | "oleosa" | "mista" | "normal" | "sensivel";
export type Fototipo = 1 | 2 | 3 | 4 | 5 | 6;

export interface SkinScores {
  hidratacao: number;
  oleosidade: number;
  uniformidade: number;
  textura: number;
  luminosidade: number;
  sensibilidade: number;
}

export interface AchadosVisuais {
  zonaT?: "oleosa" | "mista" | "normal";
  bochechas?: "secas" | "normais" | "oleosas";
  poros?: "dilatados_severos" | "dilatados_moderados" | "normais" | "finos";
  eritema?: "presente" | "leve" | "ausente";
  manchas?: "hiperpigmentadas" | "melasma" | "pos_inflamatorias" | "ausentes";
  descamacao?: "presente" | "leve" | "ausente";
  linhasFinas?: "presentes_moderadas" | "presentes_leves" | "ausentes";
  acne?: "ativa_severa" | "ativa_leve" | "comedoes" | "ausente";
}

export interface Evidencia {
  grau: "A" | "B" | "C";
  fonte: string;
}

export interface RotinaPasso {
  ordem: number;
  slug: string;
  nome: string;
  categoria: "limpeza" | "tonico" | "serum" | "hidratante" | "protetor" | "tratamento";
  preco: number;
  ativosChave: string[];
  porQueRecomendado: string;
  comoUsar: string;
  alertaSinergia?: string;
  evidencia?: Evidencia;
}

export interface SkinAnaliseFull {
  tipoPele: TipoPele;
  subtipo?: string;
  fototipo: Fototipo | null;
  confianca: number;
  scores: SkinScores;
  achados: AchadosVisuais;
  observacao: string;
  alertas: string[];
  modoFallback: boolean;
}

export interface SkinRotina {
  manha: RotinaPasso[];
  noite: RotinaPasso[];
  semanal: RotinaPasso[];
  semana1?: RotinaPasso[];
}

export interface SkinScanResult {
  scanId: string;
  timestamp: number;
  focos: string[];
  analise: SkinAnaliseFull;
  rotina: SkinRotina;
}

export const BELAPOP_SCAN_KEY = "belapop_scan_v2";
export const SKIN_SCAN_FOCOS_KEY = "skinScanFocos";

export const LEGACY_SKIN_SCAN_KEYS = [
  "skinScanAnalysis",
  "skinScanData",
  "skinScanResult",
  "skinScanResultado",
  "belapop_scan_result",
  "skinScanProgress",
  "skinScanAnalise",
] as const;
